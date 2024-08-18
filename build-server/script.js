const { exec } = require("child_process");
const s3Client = require("./s3Client");
const { PutObjectCommand } = require("@aws-sdk/client-s3");
const fs = require("fs");
const path = require("path");
const Redis = require("ioredis");
const mime = require("mime-types");
const getBuildCommand = require("./buildCommand");
// const publisher = new Redis('')


const PROJECT_ID = process.env.PROJECT_ID;
const FRAMEWORK = process.env.FRAMEWORK;


// function publishLog(log) {
//   publisher.publish(`logs:${PROJECT_ID}`, JSON.stringify({ log }))
// }

async function init() {
  console.log("Executing - script.js");
  const outDirPath = path.join(__dirname, "output");
  console.log(outDirPath);

  const buildCommand = getBuildCommand(FRAMEWORK, outDirPath);
  console.log(`---> ${buildCommand} <---`)
  const p = exec(buildCommand);

  // const p = exec(`cd ${outDirPath} && npm install && npm run build`)

  p.stdout.on("data", function (data) {
    console.log(">", data.toString());
  });

  p.stdout.on("error", function (data) {
    console.log("Error : ", data.toString());
  });

  p.on("close", async function () {
    console.log("---> Build Complete <---");

    const distFolderPath = path.join(outDirPath, "dist");
    const distFolderContents = fs.readdirSync(distFolderPath, {
      recursive: true,
    });

    for (const file of distFolderContents) {
      const filePath = path.join(distFolderPath, file);
      if (fs.lstatSync(filePath).isDirectory()) continue;

      console.log("uploading", filePath);

      const command = new PutObjectCommand({
        Bucket: "tb-vercel-clone",
        Key: `__outputs/${PROJECT_ID}/${file}`,
        Body: fs.createReadStream(filePath),
        ContentType: mime.lookup(filePath),
      });

      await s3Client.send(command);
      console.log("--> Uploaded : ", filePath);
    }
    console.log("--> Process Successful <--");
  });
}

init();
