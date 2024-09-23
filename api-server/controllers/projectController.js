const { PrismaClient } = require("@prisma/client");
const { generateSlug } = require("random-word-slugs");
const { RunTaskCommand } = require("@aws-sdk/client-ecs");
const s3Client = require("../utils/s3Client");
const { ListObjectsV2Command, DeleteObjectsCommand } = require("@aws-sdk/client-s3");
const { z } = require('zod');

const prisma = new PrismaClient();

const deleteS3Folder = async (Bucket, folderPath) => {
  try {
    const listParams = {
      Bucket,
      Prefix: folderPath.endsWith('/') ? folderPath : folderPath + '/',
    };
    const listResponse = await s3Client.send(new ListObjectsV2Command(listParams));

    if (listResponse.Contents.length === 0) {
      return;
    }

    const deleteParams = {
      Bucket,
      Delete: {
        Objects: listResponse.Contents.map(item => ({ Key: item.Key })),
      },
    };

    await s3Client.send(new DeleteObjectsCommand(deleteParams));
  } catch (error) {
    console.error("Error deleting folder:", error);
  }
};

exports.getProjects = async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: 'User ID is required' });

  try {
    const projects = await prisma.project.findMany({ where: { userID: userId } });
    return res.status(200).json(projects);
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getProjectById = async (req, res) => {
  const { id } = req.params;

  try {
    const project = await prisma.project.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    return res.status(200).json(project);
  } catch (error) {
    console.error('Error fetching project:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

exports.createProject = async (req, res) => {
  const { userId } = req.body;
  const schema = z.object({
    name: z.string().min(3, 'Project name should have at least 3 characters'),
    gitURL: z.string().url('Invalid URL format')
  });

  const safeParseResult = schema.safeParse(req.body);
  if (!safeParseResult.success) return res.status(400).json({ error: safeParseResult.error.errors });

  const { name, gitURL } = safeParseResult.data;

  try {
    await prisma.project.create({
      data: { name, gitURL, subDomain: generateSlug(), userID: userId }
    });
    return res.status(201).json({ status: 'success' });
  } catch (error) {
    if (error.meta?.target?.includes('name')) {
      return res.status(409).json({ error: 'Choose a different project name.' });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
};

exports.deleteProject = async (req, res) => {
  const { id } = req.params;

  try {
    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) return res.status(404).json({ error: 'Project not found' });

    await deleteS3Folder("tb-vercel-clone", `__outputs/${project.subDomain}`);
    await prisma.project.delete({ where: { id } });
    return res.status(200).json({ message: 'Project deleted successfully' });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
};

exports.deployProject = async (req, res) => {
  const { projectId } = req.body;

  try {
    if (!projectId) return res.status(400).json({ error: 'Project ID is required' });

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) return res.status(404).json({ error: 'Project not found' });

    await prisma.project.update({ where: { id: projectId }, data: { status: 'READY' } });

    const command = new RunTaskCommand({
      cluster: config.CLUSTER,
      taskDefinition: config.TASK,
      launchType: "FARGATE",
      count: 1,
      networkConfiguration: {
        awsvpcConfiguration: {
          assignPublicIp: "ENABLED",
          subnets: ["subnet-0f3075b6903410ab3", "subnet-09eab8f3171203894"],
          securityGroups: ["sg-0afae1a5fcc78f6fe"],
        },
      },
      overrides: {
        containerOverrides: [
          {
            name: "builder-image",
            environment: [
              { name: 'GIT_REPOSITORY__URL', value: project.gitURL },
              { name: 'PROJECT_ID', value: project.subDomain },
            ],
          },
        ],
      },
    });

    await ecsClient.send(command);
    return res.json({ status: "queued", data: { url: `http://${project.subDomain}.localhost:8000` } });

  } catch (error) {
    return res.status(500).json({ error: 'Failed to process deployment' });
  }
};
