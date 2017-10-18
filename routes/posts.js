const express = require("express");
const router = express.Router();

//models
const Post = require('../models/Post');
const User = require('../models/User');
const Comment = require('../models/Comment')

//JWT auth middleware
const authMiddleware = require("../userAuth");

router.get('/', (req, res)=>{
    Post.find({})
    .sort({createdAt: -1})
    .populate('author', 'username email image').exec((err, posts)=>{
        if(err){
            res.status(500).json({success: false, message: "Error Fetching Posts", err});
            return;
        }else if(!posts[0]){
            res.json({success: false, message: "No Posts Found"});
            return;
        }

        res.json({success: true, posts});
    });
});

router.post('/', authMiddleware, (req, res)=>{
    var postBody = req.body.postbody;
    var newPost = new Post();
    newPost.body = postBody;
    newPost.author = req.user.id;
    newPost.save((err, post)=>{
        if(err){
            res.status(500).json({success: false, message: "Error Creating Post", err});
            return;
        }

        //add post id to user model
        User.update({_id: req.user.id}, {$push: {'posts': post._id}}, (err)=>{
            if(err){
                res.status(500).json({success: false, message: "Error Creating post", err});
                return;
            }

            res.json({success: true, message: "Post Created", post});
        });
    });
});

//get users feed of followed users
router.get('/feed', authMiddleware, (req, res)=>{
    User.findById(req.user.id, (err, user)=>{
        Post.find({author: {$in: user.following}})
        .sort({createdAt: -1})
        .populate('author', 'email username image').exec((err, posts)=>{
            if(err){
                res.status(500).json({success: false, message: "Error Fetching Feed", err});
                return;
            }else if(!posts[0]){
                res.json({success: false, message: "No Posts In Feed."});
                return;
            }

            res.json({success: true, posts});
        });
    });
});

router.get('/:postid', (req,res)=>{
    Post.findById(req.params.postid)
    .populate('author', 'username image email')
    .populate({
        path: 'comments',
        populate: {
          path: 'author',
          model: 'User',
          select: 'username email image'
        }
     })
    .exec((err, post)=>{
        if(err){
            res.status(500).json({success: false, message: "Error Fetching Post", err});
            return;
        } else if(!post){
            res.json({success: false, message: "Post Not Found"});
            return
        }

        res.json({success: true, post});
    });
});

router.post('/:postid', authMiddleware, (req, res)=>{
    Post.findById(req.params.postid, (err, post)=>{
        if(err){
            res.status(404).json({success: false, message: "Post Not Found"});
            return;
        }

        var newComment = new Comment();
        newComment.body = req.body.commentbody;
        newComment.author = req.user.id;
        newComment.post = req.params.postid;

        newComment.save((err, comment)=>{
            if(err){
                res.status(500).json({success: false, message: "Error Creating Comment", err});
                return;
            }

            //add post id to user model
            post.comments.push(comment._id);
            post.save((err)=>{
                if(err){
                    res.status(500).json({success: false, message: "Error Creating Comment", err});
                    return;
                }

                comment.populate({
                  path: 'author',
                  model: 'User',
                  select: 'username email image'
                }, function(err){
                    if(err){
                      res.status(500).json({success: false, message: "Error Creating Comment", err});
                      return
                    }
                      res.json({success: true, message: "Comment Created", comment});
                })
            });
        });
    });
});

router.delete('/:postid', authMiddleware, (req, res)=>{
    //delete all posts where _id = postid in url param and author = current logged in user id
    //if 0 posts are deleted, the user tried to delete a post they didn't own
    //or the post did not exist
    Post.remove({_id: req.params.postid, author: req.user.id}, (err, data)=>{
        if(err){
            res.status(500).json({success: false, message: "Error Deleting Post", err});
            return;
        }else if(data.result.n < 1){
            //data.result.n = the number of posts that were deleted
            res.status(403).json({succes: false, message: "You Are Not Authorized to Delete This Post."});
            return;
        }

        //delete post's comments
        Comment.remove({post: req.params.postid}, (err)=>{
            res.json({success: true, message: "Post Deleted", data});
        });
    });
});

router.post("/:postid/like", authMiddleware, (req, res)=>{
    Post.findById(req.params.postid, (err, post)=>{
        if(err){
            res.status(404).json({success: false, message: "Post Not Found."});
            return;
        }
        User.update({_id: req.user.id}, {$addToSet: {'likes.posts': req.params.postid}})
        .exec((err, data)=>{
            if(data.nModified < 1){
                res.json({success: false, message: "Post Already Liked."});
                return;
            }
            post.likes += 1;
            post.save((err)=>{
                if(err){
                    res.status(500).json({success: false, message: "Error Liking Post.", err});
                    return;
                }

                res.json({success: true, message: "Post Liked."});
            });

        });
    });
});

router.delete("/:postid/like", authMiddleware, (req, res)=>{
    Post.findById(req.params.postid, (err, post)=>{
        if(err){
            res.status(404).json({success: false, message: "Post Not Found."});
            return;
        }
        User.update({_id: req.user.id}, {$pull: {'likes.posts': req.params.postid}})
        .exec((err, data)=>{
            if(data.nModified < 1){
                res.json({success: false, message: "You Have Not Liked This Post."});
            }
            post.likes -= 1;
            post.save((err)=>{
                if(err){
                    res.status(500).json({success: false, message: "Error Un-Liking Post.", err});
                    return;
                }

                res.json({success: true, message: "Post Un-Liked."});
            });
        });
    });
});

router.post("/:postid/dislike", authMiddleware, (req, res)=>{
    Post.findById(req.params.postid, (err, post)=>{
        if(err){
            res.status(404).json({success: false, message: "Post Not Found."});
            return;
        }
        User.update({_id: req.user.id}, {$addToSet: {'dislikes.posts': req.params.postid}})
        .exec((err, data)=>{
            if(data.nModified < 1){
                res.json({success: false, message: "Post Already Disliked."});
                return;
            }

            post.dislikes += 1;
            post.save((err)=>{
                if(err){
                    res.status(500).json({success: false, message: "Error Disliking Post.", err});
                    return;
                }

                res.json({success: true, message: "Post Disliked."});
            });
        });
    });
});

router.delete("/:postid/dislike", authMiddleware, (req, res)=>{
    Post.findById(req.params.postid, (err, post)=>{
        if(err){
            res.status(404).json({success: false, message: "Post Not Found."});
            return;
        }
        User.update({_id: req.user.id}, {$pull: {'dislikes.posts': req.params.postid}})
        .exec((err, data)=>{
            if(data.nModified < 1){
                res.json({success: false, message: "You Have Not Disliked This Post."});
                return;
            }

            post.dislikes -= 1;
            post.save((err)=>{
                if(err){
                    res.status(500).json({success: false, message: "Error Un-Disliking Post.", err});
                    return;
                }

                res.json({success: true, message: "Post Un-Disliked."});
            });
        });
    });
});

router.post("/:postid/favorite", authMiddleware, (req, res)=>{
    User.update(
    {_id: req.user.id},
    {$addToSet: {'favorites': req.params.postid}},
    {new: true}).exec((err, data)=>{
        if(err){
            res.status(500).json({success: false, message: "Error Favoriting Article", err});
            return;
        }
        if(data.nModified < 1){
            res.json({sucess: false, message: "Already In Favorites"});
            return;
        }
        Post.findById(req.params.postid, '-comments').populate('author', 'username, email, image').exec((err, post)=>{
            post.favorites += 1;
            post.save((err)=>{
                if(err){
                    res.json({success: false, message: "Error Adding To Favorites", err});
                    return;
                }

                res.json({success: true, message: "Added To Favorites.", post});
            })
        });
    });
});

router.delete("/:postid/favorite", authMiddleware, (req, res)=>{
    User.update(
    {_id: req.user.id},
    {$pull: {'favorites': req.params.postid}},
    {new: true}).exec((err, data)=>{
        if(err){
            res.status(500).json({success: false, message: "Error Un-Favoriting Article", err});
            return;
        }

        Post.findById(req.params.postid, '-comments').populate('author', 'username, email, image').exec((err, post)=>{
            post.favorites -=1;
            post.save(err=>{
                if(err){
                    res.json({success: false, message: "Error Removing From Favorites.", err});
                    return;
                }

                res.json({success: true, message: "Removed From Favorites.", post});
            })
        });
    });
});



module.exports = router;
