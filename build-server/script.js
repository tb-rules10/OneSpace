const { exec } = require("child_process");
const s3Client = require("./utils/s3Client");
const { PutObjectCommand } = require("@aws-sdk/client-s3");
const fs = require("fs");
const path = require("path");
const mime = require("mime-types");
const getBuildCommand = require("./utils/buildCommand");
const { publishLog, publisher } = require("./utils/redis");

const PROJECT_ID = process.env.PROJECT_ID;

async function init() {
  console.log("Executing - script.js");
  publishLog("--> Build Started");

  const outDirPath = path.join(__dirname, "output");
  const buildCommand = getBuildCommand(outDirPath);

  // console.log(`---> ${buildCommand} <---`)
  const p = exec(buildCommand);

  p.stdout.on("data", function (data) {
    console.log("-->", data.toString());
    publishLog(data.toString());
  });

  p.stdout.on("error", function (data) {
    console.log("Error : ", data.toString());
    publishLog(`Error : ${data.toString()}`);
  });

  p.on("close", async function () {
    console.log("---> Build Complete <---");
    publishLog("---> Build Complete <---");

    const distFolderPath = path.join(outDirPath, "dist");
    const distFolderContents = fs.readdirSync(distFolderPath, {
      recursive: true,
    });

    for (const file of distFolderContents) {
      const filePath = path.join(distFolderPath, file);
      if (fs.lstatSync(filePath).isDirectory()) continue;

      console.log("uploading", filePath);
      publishLog(`uploading ${file}`);

      const command = new PutObjectCommand({
        Bucket: "tb-one-space",
        Key: `__outputs/${PROJECT_ID}/${file}`,
        Body: fs.createReadStream(filePath),
        ContentType: mime.lookup(filePath),
      });

      await s3Client.send(command);
      console.log("--> Uploaded : ", filePath);
      publishLog(`--> Uploaded : ${file}`);
    }
    console.log("--> Process Successful <--");
    publishLog("--> Process Successful <--");
    publishLog("--> Disconnecting from Redis <--");
    publisher.disconnect();
  });
}

init();
