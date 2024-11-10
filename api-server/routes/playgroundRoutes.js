const express = require("express");
const {
  getPlaygrounds,
  getPlaygroundById,
  createPlayground,
  deletePlayground
} = require("../controllers/playgroundController");

const router = express.Router();

// Define your routes
router.get("/", getPlaygrounds);
router.get("/:id", getPlaygroundById);
router.post("/", createPlayground);
router.delete("/:id", deletePlayground);

module.exports = router;
