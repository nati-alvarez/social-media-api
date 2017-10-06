const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const jwt = require('jsonwebtoken');
const config = require('./config');
const cookieParser = require('cookie-parser');
const cors = require("cors");

//make db connection  and jwt secret global
global.db = mongoose.createConnection(config.database);
global.secret = config.secret;

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(cookieParser());

//enable cors for complainr client app
const corsOptions = {
    origin: 'http://localhost:3000',
    credentials: true
}
app.use(cors(corsOptions));

//routes
const routes = require('./routes');
app.use("/api", routes);

app.listen(8080, ()=> console.log("listening on port 8080"));