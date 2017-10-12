var express = require("express");
var router = express.Router();

//models
const User = require('../models/User');

//JWT auth middleware
const authMiddleware = require('../userAuth');

router.get("/", authMiddleware, (req, res)=>{
    var username = (req.query.username)? new RegExp('^'+req.query.username, "i"): /.*/; //optional username parameter
    User.find({username: username}, {email: 0, salt: 0, hash: 0})
    .populate("posts")
    .populate("following", "username, image")
    .populate("favorites")
    .populate({
        path: "favorites",
        populate: {
            path: "author",
            model: "User"
        }
    })
    .exec((err, users)=>{
        res.json({success: true, users});
    });
});

router.post("/", (req, res)=>{
    var newUser = new User;
    newUser.username = req.body.username;
    newUser.email = req.body.email;
    newUser.hashPassword(req.body.password);

    newUser.save((err)=>{
        if(err){
            switch(err.code){
                case 11000:
                    res.status(500).json({success: false, message: "Username or Email Taken", err});
                    break;
                default:
                    res.status(500).json({success: false, message: "Error Signing Up", err});
            }
            return;
        }
        res.cookie('api-token', newUser.toAuthJSON().token, {httpOnly: true });
        res.json({success: true, user: newUser.toAuthJSON()});
    })
});


router.post('/login', (req, res)=>{
    User.findOne({ $or: [{username: req.body.username}, {email: req.body.username}]})
    .populate('following')
    .populate({
        path: 'favorites',
        populate: {
            path: 'author',
            model: 'User',
            select: 'email username image'
        }
    })
    .exec((err, user)=>{
        if(err){
            res.status(500).json({success: false, message: "Error Loging In.", err});
            return;
        }
        else if(!user){
            res.json({success: false, message: "User Not Found."});
            return;
        }
        
        var validPassword = user.checkPassword(req.body.password);
        if(!validPassword){
            res.json({success: false, message: "Incorrect Password"});
            return;
        }
        res.cookie('api-token', user.toAuthJSON().token, {httpOnly: true });
        res.json({success: true, user: user.toAuthJSON()});
    });
});

router.get('/logout', authMiddleware, (req, res)=>{
    res.clearCookie('api-token');
    res.json({success: true, message: "You were logged out successfully."});
});

router.get("/:username", authMiddleware, (req, res)=>{
    var username = req.params.username;
    User.findOne({username}, {salt: 0, hash: 0})
    .populate('posts')
    .populate('following', 'email username image')
    .populate('favorites')
    .populate({
        path: 'favorites',
        populate: {
            path: 'author',
            model: 'User',
            select: 'email username image'
        }
    })
    .exec((err, user)=>{
        if(err){
            res.status(500).json({success: false, message: "Error Fetching User."});
            return;
        } else if(!user){
            res.json({success: false, message: "User Not Found."});
            return
        }

        res.json({success: true, user});
            
    });
});

//follows user
router.post("/:username", authMiddleware, (req, res)=>{
    if(req.user.username === req.params.username){
        res.json({success: false, message: "You Cannot Follow Yourself Loser :P."});
        return;
    }
    User.findOne({username: req.params.username}, {hash: 0, salt: 0, favorites: 0, following: 0})
    .populate('posts')
    .exec((err, user)=>{
        if(err){
            res.status(404).json({success: false, message: "User Not Found."});
            return;
        }
        User.update({username: req.user.username}, {$addToSet: {"following": user._id}}, (err, data)=>{
            if(err){
                res.json({success: false, message: "Error Following User.", err});
                return;
            }else if(data.nModified < 1){
                res.json({success: false, message: `You Are Already Following ${user.username}`});
                return;
            }
                
            res.json({success: true, message: `Now Following ${user.username}`, user});
                
        });
    });
});

router.put("/:username", authMiddleware, (req, res)=>{
    if(req.user.username !== req.params.username){
        res.status(403).json({success: false, message: "You Are Not Authorized to Edit This Account."});
        return;
    }

    User.findOne({username: req.params.username}, (err, user)=>{
        if(err){
            res.status(500).json({success: false, message: "Error Updating Profile", err});
            return;
        }else if(!user){
            res.json({success: false, message: "User Not Found"});
            return;
        }
            
        user.bio = req.body.bio || user.bio;
        user.image = req.body.image || user.image;
        user.email = req.body.email || user.email;

        user.save((err, updatedUser)=>{
            if(err){
                res.status(500).json({success: false, message: "Error Updating Profile", err});
                return;
            }
            res.json({success: true, message: "Profile Updated.", updatedUser});
        });
    });
});

router.delete("/:username", authMiddleware, (req, res)=>{
    if(req.user.username !== req.params.username){
        res.status(403).json({success: false, message: "You Are Not Authorized To Delete This Account"});
        return;
    }
    
    User.remove({username: req.params.username }, (err)=> {
        if (err){
            res.status(500).json({success: false, message: "Error Deleting Account.", err});
            return;
        }
        res.json({success: true, message: "Account Deleted."});
        
    });
});


module.exports = router;