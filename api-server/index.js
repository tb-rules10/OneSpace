const express = require("express");
const { generateSlug } = require("random-word-slugs");
const { ECSClient, RunTaskCommand } = require("@aws-sdk/client-ecs");
const { Server } = require("socket.io");
const Redis = require("ioredis");

const PORT = 9000;
const app = express();

app.use(express.json());
require('dotenv').config();

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

app.post("/project", async (req, res) => {
  const { gitURL, slug, framework, installCommand, buildCommand } = req.body;
  const projectSlug = slug ? slug : generateSlug();

  const environmentVariables = [
    { name: "GIT_REPOSITORY__URL", value: gitURL },
    { name: "PROJECT_ID", value: projectSlug },
    framework ? { name: "FRAMEWORK", value: framework } : null,
    installCommand ? { name: "INSTALL_COMMAND", value: installCommand } : null,
    buildCommand ? { name: "BUILD_COMMAND", value: buildCommand } : null,
  ].filter(Boolean);

  // Spin the container
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
          environment: environmentVariables,
        },
      ],
    },
  });

//   console.log(environmentVariables)
  try {
    await ecsClient.send(command);
    return res.json({
      status: "queued",
      data: { projectSlug, url: `http://${projectSlug}.localhost:8000` },
    });
  } catch (error) {
    console.error("Error running ECS task:", error);
    return res
      .status(500)
      .json({ status: "error", message: "Failed to queue the project" });
  }
});

app.listen(PORT, () => console.log(`Reverse Proxy Running - ${PORT}`));
