const mongoose = require("mongoose");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const UserSchema = new mongoose.Schema({
    username:{type: String, required: true, index: true, unique: true},
    email: {type: String, lowercase: true, required: true, index: true, unique: true},
    hash: String,
    salt: String,
    image: {type: String, default: "https://sm.uploads.im/t/6I9RS.png"},
    bio: String,
    posts: [{type: mongoose.Schema.Types.ObjectId, ref: "Post"}],
    favorites: [{type: mongoose.Schema.Types.ObjectId, ref: "Post"}],
    following: [{type: mongoose.Schema.Types.ObjectId, ref: "User"}],
    likes: {
        posts: [mongoose.Schema.Types.ObjectId],
        comments: [mongoose.Schema.Types.ObjectId]
    },
    dislikes: {
        posts: [mongoose.Schema.Types.ObjectId],
        comments: [mongoose.Schema.Types.ObjectId]
    }
});

UserSchema.methods.hashPassword = function(password){
    this.salt = crypto.randomBytes(16).toString('hex');
    this.hash = crypto.pbkdf2Sync(password, this.salt, 10000, 512, 'sha512').toString('hex');
}

UserSchema.methods.checkPassword = function(password){
    var hash = crypto.pbkdf2Sync(password, this.salt, 10000, 512, 'sha512').toString('hex');
    return this.hash === hash;
}

UserSchema.methods.generateJWT = function(){
    var today = new Date();
    var exp = new Date(today);
    exp.setDate(today.getDate() + 60);
  
    return jwt.sign({
      id: this._id,
      username: this.username,
      exp: parseInt(exp.getTime() / 1000),
    }, secret);
}

UserSchema.methods.toAuthJSON = function(){
    return {
      username: this.username,
      email: this.email,
      token: this.generateJWT(),
      bio: this.bio,
      image: this.image,
      following: this.following,
      favorites: this.favorites,
      likes: this.likes,
      dislikes: this.dislikes
    };
};

module.exports = db.model('User', UserSchema);