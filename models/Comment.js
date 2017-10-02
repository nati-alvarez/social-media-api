const mongoose = require("mongoose");

const CommentSchema = new mongoose.Schema({
    post: {type: mongoose.Schema.Types.ObjectId, ref: "Post"},
    author: {type: mongoose.Schema.Types.ObjectId, ref: "User"},
    body: {type: String, required: true},
    likes: {type: Number, default: 0},
    dislikes: {type: Number, default: 0},
}, {timestamps: true});

module.exports = db.model('Comment', CommentSchema);