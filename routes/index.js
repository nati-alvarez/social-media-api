const express = require("express");
const router = express.Router();

const userRoutes = require("./users");
const postRoutes = require("./posts");
router.use("/users", userRoutes);
router.use("/posts", postRoutes);

module.exports = router;