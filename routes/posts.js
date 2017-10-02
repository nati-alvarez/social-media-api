const express = require("express");
const router = express.Router();

//models
const Post = require('../models/Post');
const User = require('../models/User');
const Comment = require('../models/Comment')

//JWT auth middleware
const authMiddleware = require("../userAuth");

router.get('/', (req, res)=>{
    Post.find({}, {comments: 0}).populate('author', 'username email image').exec((err, posts)=>{
        if(err){
            res.status(500).json({success: false, message: "Error Fetching Posts", err});
        }else {
            if(!posts[0]){
                res.json({success: false, message: "No Posts Found"});
            }else {
                res.json({success: true, posts});
            }
        }
    });
});

router.post('/', authMiddleware, (req, res)=>{
    var postBody = req.body.postBody;
    var newPost = new Post();
    newPost.body = postBody;
    newPost.author = req.user.id;
    newPost.save((err, post)=>{
        if(err){
            res.status(500).json({success: false, message: "Error Creating Post", err});
        }else{
            //add post id to user model
            User.update({_id: req.user.id}, {$push: {'posts': post._id}}, (err)=>{
                if(err){
                    res.status(500).json({success: false, message: "Error Creating post", err});
                }else {
                    res.json({success: true, message: "Post Created", post});
                }
            });
        }
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
        }else {
            if(!post){
                res.json({success: false, message: "Post Not Found"});
            }else{
                res.json({success: true, post});
            }
        }
    });
});

router.post('/:postid', authMiddleware, (req, res)=>{
    var newComment = new Comment();
    newComment.body = req.body.commentBody;
    newComment.author = req.user.id;
    newComment.post = req.params.postid;

    newComment.save((err, comment)=>{
        if(err){
            res.status(500).json({success: false, message: "Error Creating Comment", err});
        }else{
            //add post id to user model
            Post.update({_id: req.params.postid}, {$push: {'comments': comment._id}}, (err)=>{
                if(err){
                    res.status(500).json({success: false, message: "Error Creating Comment", err});
                }else {
                    res.json({success: true, message: "Comment Created", comment});
                }
            });
        }
    });
});

router.delete('/:postid', authMiddleware, (req, res)=>{
    //delete all posts where _id = postid in url param and author = current logged in user id
    //if 0 posts are deleted, the user tried to delete a post they didn't own
    //or the post did not exist
    Post.remove({_id: req.params.postid, author: req.user.id}, (err, data)=>{
        if(err){
            res.status(500).json({success: false, message: "Error Deleting Post", err});
        }else {
            //data.result.n = the number of posts that were deleted
            if(data.result.n < 1){
                res.status(403).json({succes: false, message: "You Are Not Authorized to Delete This Post."});
            }else {
                //delete post's comments
                Comment.remove({post: req.params.postid}, (err)=>{
                    res.json({success: true, message: "Post Deleted", data});
                });
            }
        }
    });
});

router.post("/:postid/favorite", authMiddleware, (req, res)=>{
    User.findOneAndUpdate(
    {_id: req.user.id}, 
    {$addToSet: {'favorites': req.params.postid}}, 
    {new: true}).populate('favorites').exec((err, user)=>{
        if(err){
            res.status(500).json({success: false, message: "Error Favoriting Article", err});
        }else {
            Post.findById(req.params.postid, '-comments').populate('author', 'username, email, image').exec((err, post)=>{
                res.json({success: true, message: "Added To Favorites.", post});
            });
        }
    });
});

module.exports = router;