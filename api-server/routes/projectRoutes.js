const express = require("express");
const {
  getProjects,
  getProjectById,
  createProject,
  deleteProject,
  deployProject
} = require("../controllers/projectController");
const router = express.Router();

router.get("/", getProjects);
router.get("/:id", getProjectById);
router.post("/", createProject);
router.delete("/:id", deleteProject);
router.post("/deploy", deployProject);

module.exports = router;
