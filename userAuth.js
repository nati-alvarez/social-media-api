const jwt = require("jsonwebtoken");

module.exports = function(req, res, next){
    var token = req.cookies['api-token'];
    if (token) {
        jwt.verify(token, secret, function(err, user) {      
            if (err) {
                return res.status(403).json({ success: false, message: 'Failed to authenticate token.' });    
            } else {
                req.user = user;    
                next();
            }
        });
    } else {
        return res.status(403).json({success: false, message: 'No token provided.'});
    }
}