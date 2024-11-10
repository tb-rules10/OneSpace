const { S3Client } = require("@aws-sdk/client-s3");

const s3Bucket = process.env.S3_BUCKET;

const s3Client = new S3Client({
  region: "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

module.exports = {
  s3Bucket,
  s3Client
}
