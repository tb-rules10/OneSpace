const express = require("express");
const cors = require("cors");
const { generateSlug } = require("random-word-slugs");
const { ECSClient, RunTaskCommand } = require("@aws-sdk/client-ecs");
const { Server } = require("socket.io");
const Redis = require("ioredis");
const { PrismaClient } = require("@prisma/client");
const { requireAuth } = require("@clerk/clerk-sdk-node");
const { z } = require('zod')

const PORT = 9000;
const app = express();

app.use(express.json());
app.use(cors()); 
require("dotenv").config();

/////////////////////////////////////////////////////////////////////////////

const prisma = new PrismaClient();

app.post("/user", async (req, res) => {
  const { id, email, username } = req.body;

  try {
    const existingUser = await prisma.user.findUnique({ where: { id } });

    if (!existingUser) {
      const newUser = await prisma.user.create({
        data: {
          id,
          email,
          username,
        },
      });
      console.log("---> New User Created :", email);
      return res.status(200).json(newUser);
    } else {
      console.log("---> User Login :", email);
      return res.status(200).json(existingUser);
    }
  } catch (error) {
    console.error("---> Login Failed :", email);
    console.error("Error processing user info:", error);

    if (error.code === 'P2002') {
      return res.status(409).json({ message: "User with this email already exists" });
    }

    return res.status(500).json({ message: "Internal server error" });
  }
});



app.get('/projects', async (req, res) => {
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  try {
    const projects = await prisma.project.findMany({
      where: { userID: userId },
    });

    return res.status(200).json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});


app.get('/projects/:id', async (req, res) => {
  const { id } = req.params;
  console.log("---> Fetching project : ", id);

  try {
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        user: true,  
      },
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

  console.log("new req project");
  const { userId } = req.body;

  const schema = z.object({
    name: z.string().min(3, 'Project name should have at least 3 characters'),
    gitURL: z.string().url('Invalid URL format')
  });

  const safeParseResult = schema.safeParse(req.body);

  if (!safeParseResult.success) {
    return res.status(400).json({ error: safeParseResult.error.errors });
  }

  const { name, gitURL } = safeParseResult.data;
  data = {
    name,
    gitURL,
    subDomain: generateSlug(),
    userID: userId
  }
  console.log("----");
  console.log(data);

  try {
    await prisma.project.create({
      data: {
        name,
        gitURL,
        subDomain: generateSlug(),
        userID: userId
      }
    }); 

    return res.status(201).json({ status: 'success' });
  } catch (error) {
    if (error.meta.target.includes('name')) {
      return res.status(409).json({ error: 'Choose a different project name.' });
    }
    
    console.error('Error creating project:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// app.post("/signin", (req, res) => {
//   console.log("Sign-in request received:", req.body);
//   return res.json({ status: "success", message: "Sign-in request received" });
// });

// app.post("/signup", (req, res) => {
//   console.log("creating new acc:", req.body);
//   return res.json({ status: "success", message: "creating new acc" });
// });


//////////////////////////////////////////////////////////////////////////

const ecsClient = new ECSClient({
  region: "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const config = {
  CLUSTER: process.env.ECS_CLUSTER_ARN,
  TASK: process.env.ECS_TASK_DEFINITION_ARN,
};


const subscriber = new Redis(process.env.REDIS_URL);

const io = new Server({ cors: "*" });

io.on("connection", (socket) => {
  socket.on("subscribe", (channel) => {
    socket.join(channel);
    socket.emit("message", `Joined ${channel}`);
  });
});

io.listen(9002, () => console.log("Socket Server 9002"));

app.post("/deploy", async (req, res) => {
  const { projectId } = req.body;

  try {
    if (!projectId) {
      return res.status(400).json({ error: 'Project ID is required' });
    }

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    await prisma.project.update({
      where: { id: projectId },
      data: { status: 'READY' },
    });
    console.log(project);

    const command = new RunTaskCommand({
      cluster: config.CLUSTER,
      taskDefinition: config.TASK,
      launchType: "FARGATE",
      count: 1,
      networkConfiguration: {
        awsvpcConfiguration: {
          assignPublicIp: "ENABLED",
          subnets: [
            "subnet-0f3075b6903410ab3",
            "subnet-09eab8f3171203894",
            "subnet-05bd72b5d63350c31",
            "subnet-0a024ca22e3368327",
            "subnet-0755a23fb9cd7a31c",
            "subnet-0203bc345405fcb84",
          ],
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

    try {
      await ecsClient.send(command);
      return res.json({
        status: "queued",
        data: { url: `http://${project.subDomain}.localhost:8000` },
      });
    } catch (error) {
      console.error("Error running ECS task:", error);
      return res.status(500).json({ status: "error", message: "Failed to queue the project" });
    }

  } catch (error) {
    console.error("Error processing deployment:", error);
    return res.status(500).json({ error: 'Failed to process deployment' });
  }
});

// app.post("/deploy", async (req, res) => {
//   const { gitURL, slug, framework, installCommand, buildCommand } = req.body;
//   const projectSlug = slug ? slug : generateSlug();

//   const environmentVariables = [
//     { name: "GIT_REPOSITORY__URL", value: gitURL },
//     { name: "PROJECT_ID", value: projectSlug },
//     framework ? { name: "FRAMEWORK", value: framework } : null,
//     installCommand ? { name: "INSTALL_COMMAND", value: installCommand } : null,
//     buildCommand ? { name: "BUILD_COMMAND", value: buildCommand } : null,
//   ].filter(Boolean);

//   // Spin the container
//   const command = new RunTaskCommand({
//     cluster: config.CLUSTER,
//     taskDefinition: config.TASK,
//     launchType: "FARGATE",
//     count: 1,
//     networkConfiguration: {
//       awsvpcConfiguration: {
//         assignPublicIp: "ENABLED",
//         subnets: [
//           "subnet-0f3075b6903410ab3",
//           "subnet-09eab8f3171203894",
//           "subnet-05bd72b5d63350c31",
//           "subnet-0a024ca22e3368327",
//           "subnet-0755a23fb9cd7a31c",
//           "subnet-0203bc345405fcb84",
//         ],
//         securityGroups: ["sg-0afae1a5fcc78f6fe"],
//       },
//     },
//     overrides: {
//       containerOverrides: [
//         {
//           name: "builder-image",
//           environment: environmentVariables,
//         },
//       ],
//     },
//   });
//   //   console.log(environmentVariables)

//   try {
//     await ecsClient.send(command);
//     return res.json({
//       status: "queued",
//       data: { projectSlug, url: `http://${projectSlug}.localhost:8000` },
//     });
//   } catch (error) {
//     console.error("Error running ECS task:", error);
//     return res
//       .status(500)
//       .json({ status: "error", message: "Failed to queue the project" });
//   }
// });

async function initRedisSubscribe() {
  console.log("---> Redis Logs Running");
  subscriber.psubscribe("logs:*");
  subscriber.on("pmessage", (pattern, channel, message) => {
    io.to(channel).emit("message", message);
  });
}

initRedisSubscribe();

app.listen(PORT, () => console.log(`API SERVER Running - ${PORT}`));
