const express = require("express");
const { handleUserCreateOrLogin } = require("../controllers/userController");
const router = express.Router();

router.post("/", handleUserCreateOrLogin);

module.exports = router;
