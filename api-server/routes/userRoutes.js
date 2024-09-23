const express = require("express");
const { createOrLoginUser } = require("../controllers/userController");
const router = express.Router();

router.post("/user", createOrLoginUser);

module.exports = router;
