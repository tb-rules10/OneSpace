const { generateSlug } = require("random-word-slugs");
const prisma = require("../prisma/prismaClient");
const { s3Bucket, s3Client } = require("../utils/s3Client");
const { ecsClient, config } = require("../utils/ECSClient");
const { RunTaskCommand } = require("@aws-sdk/client-ecs");
const { ListObjectsV2Command, DeleteObjectsCommand } = require("@aws-sdk/client-s3");
const { z } = require("zod");

// Helper function to delete S3 folder
const deleteS3Folder = async (Bucket, folderPath) => {
  try {
    const listParams = {
      Bucket,
      Prefix: folderPath.endsWith('/') ? folderPath : folderPath + '/',
    };

    console.log("Listing objects with params:", listParams);

    const listResponse = await s3Client.send(new ListObjectsV2Command(listParams));

    if (listResponse.Contents.length === 0) {
      console.log("No objects found in folder.");
      return;
    }

    const deleteParams = {
      Bucket,
      Delete: {
        Objects: listResponse.Contents.map(item => ({ Key: item.Key })),
      },
    };

    console.log("Deleting objects with params:", deleteParams);

    await s3Client.send(new DeleteObjectsCommand(deleteParams));
    console.log("Objects deleted successfully");
  } catch (error) {
    console.error("Error deleting folder:", error);
  }
};


// Controller functions

// Get all projects for a user
const getProjects = async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: "User ID is required" });

  try {
    const projects = await prisma.project.findMany({ where: { userID: userId } });
    return res.status(200).json(projects);
  } catch (error) {
    console.error("Error fetching projects:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// Get project by ID
const getProjectById = async (req, res) => {
  const { id } = req.params;
  console.log("---> Fetching project:", id);

  try {
    const project = await prisma.project.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    return res.status(200).json(project);
  } catch (error) {
    console.error("Error fetching project:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// Create a new project
const createProject = async (req, res) => {
  const { userId } = req.body;

  const schema = z.object({
    name: z.string().min(3, "Project name should have at least 3 characters"),
    gitURL: z.string().url("Invalid URL format"),
  });

  const safeParseResult = schema.safeParse(req.body);
  if (!safeParseResult.success) return res.status(400).json({ error: safeParseResult.error.errors });

  const { name, gitURL } = safeParseResult.data;

  try {
    await prisma.project.create({
      data: { name, gitURL, subDomain: generateSlug(), userID: userId },
    });
    return res.status(201).json({ status: "success" });
  } catch (error) {
    if (error.meta?.target?.includes("name")) {
      return res.status(409).json({ error: "Choose a different project name." });
    }
    console.error("Error creating project:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// Delete a project by ID
const deleteProject = async (req, res) => {
  const { id } = req.params;
  console.log("---> Deleting project:", id);

  try {
    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) return res.status(404).json({ error: "Project not found" });

    // Delete associated S3 folder
    await deleteS3Folder(s3Bucket , `__outputs/${project.subDomain}`);

    // Delete project from database
    await prisma.project.delete({ where: { id } });
    console.log("---> Project Deleted:", id);
    return res.status(200).json({ message: "Project deleted successfully" });
  } catch (error) {
    console.error("Error deleting project:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// Deploy a project
const deployProject = async (req, res) => {
  const { projectId } = req.body;

  try {
    if (!projectId) return res.status(400).json({ error: "Project ID is required" });

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) return res.status(404).json({ error: "Project not found" });

    await prisma.project.update({ where: { id: projectId }, data: { status: "READY" } });

    const command = new RunTaskCommand({
      cluster: config.CLUSTER,
      taskDefinition: config.TASK,
      launchType: "FARGATE",
      count: 1,
      networkConfiguration: {
        awsvpcConfiguration: {
          assignPublicIp: "ENABLED",
          subnets: ["subnet-08bb459dcd26272bf", "subnet-0747f33d1851c9717", "subnet-0d247f9c1733b8002", "subnet-0180450fbdf5f8bfd", "subnet-02775f734f184a11a", "subnet-0a3724490b0cd222a"],
          securityGroups: ["sg-0acde93107a6636a9"],
        },
      },
      overrides: {
        containerOverrides: [
          {
            name: "builder-image",
            environment: [
              { name: "GIT_REPOSITORY__URL", value: project.gitURL },
              { name: "PROJECT_ID", value: project.subDomain },
            ],
          },
        ],
      },
    });

    await ecsClient.send(command);
    return res.json({ status: "queued", data: { url: `http://${project.subDomain}.localhost:8000` } });
  } catch (error) {
    console.error("Error processing deployment:", error);
    return res.status(500).json({ error: "Failed to process deployment" });
  }
};

module.exports = {
  getProjects,
  getProjectById,
  createProject,
  deleteProject,
  deployProject,
};
