const express = require("express");
const router = express.Router();

//models
const Comment = require("../models/Comment");
const User = require("../models/User");

//JWT auth middleware
const authMiddleware = require("../userAuth");

//Create comment route is post request on /:postid

router.delete("/:commentid", authMiddleware, (req, res)=>{
    Comment.remove({_id: req.params.commentid, author: req.user.id}, (err, data)=>{
        if(err){
            res.status(500).json({success: false, message: "Error Deleting Comment", err});
            return
        }
        if(data.result.n < 1){
            res.status(403).json({success: false, message: "You Are Not Authorized To Delete This Comment."});
            return;
        }
        
        res.json({success: false, message: "Comment Deleted."});
    });
});

router.post("/:commentid/like", authMiddleware, (req, res)=>{
    Comment.findById(req.params.commentid, (err, comment)=>{
        if(err){
            res.status(500).json({success: false, message: "Error Liking Comment.", err});
            return;
        }
        User.update({_id: req.user.id}, {$addToSet: {'likes.comments': req.params.commentid}}, (err, data)=>{
            if(err){
                res.status(500).json({success: false, message: "Error Liking Comment.", err});
                return;
            }else if(data.nModified < 1){
                res.json({success: false, message: "Comment Already Liked."});
                return;
            }
            
            comment.likes += 1;
            comment.save((err)=>{
                if(err){
                    res.status(500).json({success: false, message: "Error Liking Comment.", err});
                    return;
                }
                res.json({success: true, message: "Comment Liked."});
            });
        });
    });
});

router.delete("/:commentid/like", authMiddleware, (req, res)=>{
    Comment.findById(req.params.commentid, (err, comment)=>{
        if(err){
            res.status(500).json({success: false, message: "Error Un-Liking Comment.", err});
            return;
        }
        User.update({_id: req.user.id}, {$pull: {'likes.comments': req.params.commentid}}, (err, data)=>{
            if(err){
                res.status(500).json({success: false, message: "Error Un-Liking Comment.", err});
                return;
            }else if(data.nModified < 1){
                res.json({success: false, message: "You Have Not Liked This Comment."});
                return;
            }
            comment.likes -= 1;
            comment.save((err)=>{
                if(err){
                    res.status(500).json({success: false, message: "Error Un-Liking Comment.", err});
                    return;
                }
                res.json({success: true, message: "Comment Un-Liked."});
            });
            
        });
    });
});


router.post("/:commentid/dislike", authMiddleware, (req, res)=>{
    Comment.findById(req.params.commentid, (err, comment)=>{
        if(err){
            res.status(500).json({success: false, message: "Error Disiking Comment.", err});
            return;
        }
        User.update({_id: req.user.id}, {$addToSet: {'dislikes.comments': req.params.commentid}}, (err, data)=>{
            if(err){
                res.status(500).json({success: false, message: "Error Disliking Comment.", err});
                return;
            }else if(data.nModified < 1){
                res.json({success: false, message: "Comment Already Disliked."});
                return;
            }
            comment.dislikes += 1;
            comment.save((err)=>{
                if(err){
                    res.status(500).json({success: false, message: "Error Disliking Comment.", err});
                    return;
                }
                res.json({success: true, message: "Comment Disliked."});
            });        
        });
    });
});

router.delete("/:commentid/dislike", authMiddleware, (req, res)=>{
    Comment.findById(req.params.commentid, (err, comment)=>{
        if(err){
            res.status(500).json({success: false, message: "Error Un-Disiking Comment.", err});
            return;
        }
        User.update({_id: req.user.id}, {$pull: {'dislikes.comments': req.params.commentid}}, (err, data)=>{
            if(err){
                res.status(500).json({success: false, message: "Error Un-Disliking Comment.", err});
                return;
            }else if(data.nModified < 1){
                res.json({success: false, message: "You Have Not Disliked This Comment."});
                return;
            }

            comment.dislikes -= 1;
            comment.save((err)=>{
                if(err){
                    res.status(500).json({success: false, message: "Error Un-Disliking Comment.", err});
                    return;
                }
                res.json({success: true, message: "Comment Un-Disliked."});
            });
        });
    });
});



module.exports = router;