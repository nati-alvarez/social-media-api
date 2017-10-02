const mongoose = require("mongoose");

const PostSchema = new mongoose.Schema({
    author: {type: mongoose.Schema.Types.ObjectId, ref: "User"},
    comments: [{type: mongoose.Schema.Types.ObjectId, ref: "Comment"}],
    body: {type: String, required: true},
    likes: {type: Number, default: 0},
    dislikes: {type: Number, default: 0},
    favorites: {type: Number, default: 0},
}, {timestamps: true});

module.exports = db.model('Post', PostSchema);