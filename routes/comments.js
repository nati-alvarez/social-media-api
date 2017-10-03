const express = require("express");
const router = express.Router();

//models
const Comment = require("../models/Comment");

//JWT auth middleware
const authMiddleware = require("../userAuth");

//Create comment route is post request on /:postid

router.delete("/:commentid", authMiddleware, (req, res)=>{
    Comment.remove({_id: req.params.commentid, author: req.user.id}, (err, data)=>{
        if(err){
            res.status(500).json({success: false, message: "Error Deleting Comment", err});
        }else {
            if(data.result.n < 1){
                res.status(403).json({success: false, message: "You Are Not Authorized To Delete This Comment."});
            }else{
                res.json({success: false, message: "Comment Deleted."});
            }
        }
    });
});

router.post("/:commentid/like", (req, res)=>{
    Comment.findById(req.params.commentid, (err, comment)=>{
        if(err){
            res.status(500).json({success: false, message: "Error Liking Comment.", err});
        }else{
            User.update({_id: req.user.id}, {$addToSet: {'likes.comments': req.params.commentid}}, (err, data)=>{
                if(err){
                    res.status(500).json({success: false, message: "Error Liking Comment.", err});
                }else if(data.nModified < 1){
                    res.json({success: false, message: "Comment Already Liked."});
                }else {
                    comment.likes += 1;
                    comment.save((err)=>{
                        if(err){
                            res.status(500).json({success: false, message: "Error Liking Comment.", err});
                        }else{
                            res.json({success: true, message: "Comment Liked."});
                        }
                    });
                }
            });
        }
    });
});

router.delete("/:commentid/like", (req, res)=>{
    Comment.findById(req.params.commentid, (err, comment)=>{
        if(err){
            res.status(500).json({success: false, message: "Error Un-Liking Comment.", err});
        }else{
            User.update({_id: req.user.id}, {$pull: {'likes.comments': req.params.commentid}}, (err, data)=>{
                if(err){
                    res.status(500).json({success: false, message: "Error Un-Liking Comment.", err});
                }else if(data.nModified < 1){
                    res.json({success: false, message: "You Have Not Liked This Comment."});
                }else {
                    comment.likes -= 1;
                    comment.save((err)=>{
                        if(err){
                            res.status(500).json({success: false, message: "Error Un-Liking Comment.", err});
                        }else{
                            res.json({success: true, message: "Comment Un-Liked."});
                        }
                    });
                }
            });
        }
    });
});


router.post("/:commentid/dislike", (req, res)=>{
    Comment.findById(req.params.commentid, (err, comment)=>{
        if(err){
            res.status(500).json({success: false, message: "Error Disiking Comment.", err});
        }else{
            User.update({_id: req.user.id}, {$addToSet: {'dislikes.comments': req.params.commentid}}, (err, data)=>{
                if(err){
                    res.status(500).json({success: false, message: "Error Disliking Comment.", err});
                }else if(data.nModified < 1){
                    res.json({success: false, message: "Comment Already Disliked."});
                }else {
                    comment.dislikes += 1;
                    comment.save((err)=>{
                        if(err){
                            res.status(500).json({success: false, message: "Error Disliking Comment.", err});
                        }else{
                            res.json({success: true, message: "Comment Disliked."});
                        }
                    });
                }
            });
        }
    });
});

router.delete("/:commentid/dislike", (req, res)=>{
    Comment.findById(req.params.commentid, (err, comment)=>{
        if(err){
            res.status(500).json({success: false, message: "Error Un-Disiking Comment.", err});
        }else{
            User.update({_id: req.user.id}, {$pull: {'dislikes.comments': req.params.commentid}}, (err, data)=>{
                if(err){
                    res.status(500).json({success: false, message: "Error Un-Disliking Comment.", err});
                }else if(data.nModified < 1){
                    res.json({success: false, message: "You Have Not Disliked This Comment."});
                }else {
                    comment.dislikes -= 1;
                    comment.save((err)=>{
                        if(err){
                            res.status(500).json({success: false, message: "Error Un-Disliking Comment.", err});
                        }else{
                            res.json({success: true, message: "Comment Un-Disliked."});
                        }
                    });
                }
            });
        }
    });
});



module.exports = router;