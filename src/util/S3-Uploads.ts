import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import AppError from "../app/errors/AppError";
import fs from "fs";
import sharp from "sharp";

// S3 Configuration
const s3 = new S3Client({
  region: process.env.AWS_REGION || "ap-south-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
  },
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME || "your-bucket-name";

// S3 Upload Functions
const uploadImageToS3 = async (file: Express.Multer.File): Promise<string> => {
  try {
    // Convert the image to WebP format with sharp
    const webpBuffer = await sharp(file.path).webp({ quality: 70 }).toBuffer();

    // S3 upload parameters
    const s3Params = {
      Bucket: BUCKET_NAME,
      Key: `images/${file.filename.replace(/\.tmp$/, ".webp")}`,
      Body: webpBuffer,
      ContentType: "image/webp",
    };
    //   console.log("Uploading to S3 with params:", s3Params);

    // Upload to S3
    const command = new PutObjectCommand(s3Params);
    await s3.send(command);

    const url = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Params.Key}`;

    fs.unlinkSync(file.path);
    console.log("S3 Response:", url);

    return url;
  } catch (error: any) {
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
    console.error("Error during S3 upload:", error);
    throw new AppError(
      500,
      `Image processing and upload to S3 failed: ${error.message}`
    );
  }
};

const uploadDocToS3 = async (file: Express.Multer.File): Promise<string> => {
  try {
    const s3Params = {
      Bucket: BUCKET_NAME,
      Key: `docs/${file.filename}`,
      Body: fs.createReadStream(file.path),
      ContentType: "application/pdf",
    };
    //   console.log("Uploading to S3 with params:", s3Params);

    const command = new PutObjectCommand(s3Params);
    await s3.send(command);
    fs.unlinkSync(file.path);

    const url = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Params.Key}`;
    return url;
  } catch (error: any) {
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
    console.error("Error during S3 upload:", error);
    throw new AppError(
      500,
      `Image processing and upload to S3 failed: ${error.message}`
    );
  }
};

const uploadMediaToS3 = async (file: Express.Multer.File): Promise<string> => {
  try {
    const s3Params = {
      Bucket: BUCKET_NAME,
      Key: `medias/${file.filename}`,
      Body: fs.createReadStream(file.path),
      ContentType: file.mimetype,
    };
    //   console.log("Uploading to S3 with params:", s3Params);

    const command = new PutObjectCommand(s3Params);
    await s3.send(command);
    fs.unlinkSync(file.path);

    const url = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Params.Key}`;
    return url;
  } catch (error: any) {
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
    console.error("Error during S3 upload:", error);
    throw new AppError(
      500,
      `Image processing and upload to S3 failed: ${error.message}`
    );
  }
};

export const awsUpload = {
  uploadImageToS3,
  uploadDocToS3,
  uploadMediaToS3,
};
