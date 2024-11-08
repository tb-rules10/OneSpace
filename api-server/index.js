require("dotenv").config();
const express = require("express");
const cors = require("cors");
const s3Client = require("./utils/s3Client");
const { ecsClient, config } = require("./utils/ECSClient");
const { generateSlug } = require("random-word-slugs");
const { RunTaskCommand } = require("@aws-sdk/client-ecs");
const { ListObjectsV2Command, DeleteObjectsCommand } = require("@aws-sdk/client-s3");
const { Server } = require("socket.io");
const Redis = require("ioredis");
const { PrismaClient } = require("@prisma/client");
const { requireAuth } = require("@clerk/clerk-sdk-node");
const { z } = require('zod');

const PORT = 9000;
const app = express();
const prisma = new PrismaClient();
const subscriber = new Redis(process.env.REDIS_URL);
const io = new Server({ cors: "*" });

app.use(express.json());
app.use(cors());


const deleteS3Folder = async (Bucket, folderPath) => {
  try {
    const listParams = {
      Bucket,
      Prefix: folderPath.endsWith('/') ? folderPath : folderPath + '/',  // Ensure prefix ends with '/'
    };
    const listResponse = await s3Client.send(new ListObjectsV2Command(listParams));

    if (listResponse.Contents.length === 0) {
      console.log("No files found in folder.");
      return;
    }

    const deleteParams = {
      Bucket,
      Delete: {
        Objects: listResponse.Contents.map(item => ({ Key: item.Key })),
      },
    };

    const deleteResponse = await s3Client.send(new DeleteObjectsCommand(deleteParams));
    console.log("Deleted objects:", deleteResponse);
  } catch (error) {
    console.error("Error deleting folder:", error);
  }
};


app.post("/user", async (req, res) => {
  const { id, email, username } = req.body;

  try {
    const existingUser = await prisma.user.findUnique({ where: { id } });

    if (!existingUser) {
      const newUser = await prisma.user.create({ data: { id, email, username } });
      console.log("---> New User Created:", email);
      return res.status(200).json(newUser);
    } else {
      console.log("---> User Login:", email);
      return res.status(200).json(existingUser);
    }
  } catch (error) {
    console.error("---> Login Failed:", email);
    console.error("Error processing user info:", error);

    if (error.code === 'P2002') {
      return res.status(409).json({ message: "User with this email already exists" });
    }

    return res.status(500).json({ message: "Internal server error" });
  }
});


app.get('/projects', async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: 'User ID is required' });

  try {
    const projects = await prisma.project.findMany({ where: { userID: userId } });
    return res.status(200).json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});


app.get('/projects/:id', async (req, res) => {
  const { id } = req.params;
  console.log("---> Fetching project:", id);

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
});


app.post('/project', async (req, res) => {
  const { userId } = req.body;
  console.log(":::");
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
    console.error('Error creating project:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});


app.delete("/projects/:id", async (req, res) => {
  const { id } = req.params;
  console.log("---> Deleting project:", id);

  try {
    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) return res.status(404).json({ error: 'Project not found' });

    deleteS3Folder("tb-vercel-clone", `__outputs/${project.subDomain}`);

    await prisma.project.delete({ where: { id } });
    console.log("---> Project Deleted:", id);
    return res.status(200).json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Error deleting project:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// app.post("/develop", async (req, res) => {

// }

app.post("/deploy", async (req, res) => {
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
          subnets: ["subnet-08bb459dcd26272bf", "subnet-0747f33d1851c9717", "subnet-0d247f9c1733b8002", "subnet-0180450fbdf5f8bfd", "subnet-02775f734f184a11a", "subnet-0a3724490b0cd222a"],
          securityGroups: ["sg-0acde93107a6636a9"],
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
    console.error("Error processing deployment:", error);
    return res.status(500).json({ error: 'Failed to process deployment' });
  }
});


async function initRedisSubscribe() {
  console.log("---> Redis Logs Running");
  subscriber.psubscribe("logs:*");
  subscriber.on("pmessage", (pattern, channel, message) => {
    io.to(channel).emit("message", message);
  });
}

initRedisSubscribe();

io.on("connection", (socket) => {
  socket.on("subscribe", (channel) => {
    socket.join(channel);
    socket.emit("message", `Joined ${channel}`);
  });
});
io.listen(9002, () => console.log("Socket Server 9002"));

app.listen(PORT, () => console.log(`API SERVER Running - ${PORT}`));
