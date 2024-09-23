const express = require("express");
const { getProjects, createProject, deleteProject, deployProject, getProjectById } = require("../controllers/projectController");
const router = express.Router();

router.post("/project", createProject);
router.get("/projects", getProjects);
router.get('/projects/:id', getProjectById);
router.delete("/projects/:id", deleteProject);
router.post("/deploy", deployProject);

module.exports = router;
