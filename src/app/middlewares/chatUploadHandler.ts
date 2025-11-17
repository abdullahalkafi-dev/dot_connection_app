import fs from "fs";
import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import multer, { FileFilterCallback } from "multer";
import path from "path";
import AppError from "../errors/AppError";
import sharp from "sharp";

const randomCode = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz123456789";
  let result = "";
  for (let i = 0; i < 5; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Create upload folder
const baseUploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(baseUploadDir)) {
  fs.mkdirSync(baseUploadDir);
}

// Folder create for different file
const createDir = (dirPath: string) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath);
  }
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadDir;
    console.log(file.fieldname);
    switch (file.fieldname) {
      case "image":
      case "images":
        uploadDir = path.join(baseUploadDir, "images");
        break;
      case "audio":
        uploadDir = path.join(baseUploadDir, "audio");
        break;
      default:
        throw new AppError(StatusCodes.BAD_REQUEST, "File type is not supported");
    }
    createDir(uploadDir);
    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {
    let fileExt: string;
    if (file.fieldname === "audio") {
      fileExt = path.extname(file.originalname);
    } else if (file.fieldname === "image" || file.fieldname === "images") {
      fileExt = ".tmp"; // will be converted to .webp later
    } else {
      fileExt = path.extname(file.originalname);
    }

    const originalNameWithoutExt =
      path.parse(file.originalname).name + "-" + randomCode();
    const fileName = req?.user?.userId 
      ? req.user.userId + "-" + originalNameWithoutExt
      : originalNameWithoutExt.toLowerCase().split(" ").join("-");

    cb(null, fileName + fileExt);
  },
});

// File filter
const fileFilter = (req: Request, file: any, cb: FileFilterCallback) => {
  if (file.fieldname === "image" || file.fieldname === "images") {
    if (
      file.mimetype === "image/jpeg" ||
      file.mimetype === "image/png" ||
      file.mimetype === "image/jpg" ||
      file.mimetype === "image/heif" ||
      file.mimetype === "image/heic" ||
      file.mimetype === "image/tiff" ||
      file.mimetype === "image/webp" ||
      file.mimetype === "image/avif"
    ) {
      cb(null, true);
    } else {
      cb(
        new AppError(
          StatusCodes.BAD_REQUEST,
          "Only image files are allowed for image upload"
        )
      );
    }
  } else if (file.fieldname === "audio") {
    console.log("Audio file received - MIME type:", file.mimetype);
    if (
      file.mimetype === "audio/mpeg" ||
      file.mimetype === "audio/mp3" ||
      file.mimetype === "audio/wav" ||
      file.mimetype === "audio/m4a" ||
      file.mimetype === "audio/aac" ||
      file.mimetype === "audio/ogg" ||
      file.mimetype === "audio/mp4" ||
      file.mimetype === "audio/x-m4a" ||
      file.mimetype === "audio/3gpp" ||
      file.mimetype === "audio/amr"
    ) {
      cb(null, true);
    } else {
      console.error("Unsupported audio MIME type:", file.mimetype);
      cb(
        new AppError(
          StatusCodes.BAD_REQUEST,
          `Only audio files are allowed for audio upload. Received: ${file.mimetype}`
        )
      );
    }
  } else {
    cb(
      new AppError(
        StatusCodes.BAD_REQUEST,
        "Unsupported file type"
      )
    );
  }
};

const chatUpload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
});

// Middleware to process uploaded images
const processChatImages = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.files) {
    return next();
  }

  const files = req.files as { [fieldname: string]: Express.Multer.File[] };
  
  // Process all image fields
  const imageFields = ['image', 'images'];
  const processingPromises: Promise<void>[] = [];
  
  for (const fieldName of imageFields) {
    if (files[fieldName]) {
      for (const file of files[fieldName]) {
        if (file.fieldname === 'image' || file.fieldname === 'images') {
          const inputFilePath = file.path;
          const outputFileName = file.filename.replace('.tmp', '.webp');
          const newFilePath = path.join(path.dirname(inputFilePath), outputFileName);

          // Convert and compress image to WebP
          const processingPromise = sharp(inputFilePath)
            .toFormat('webp', { quality: 80 })
            .toFile(newFilePath)
            .then(() => {
              // Remove the temporary file
              fs.unlinkSync(inputFilePath);
              
              // Update file metadata
              file.path = newFilePath;
              file.filename = outputFileName;
            })
            .catch((error) => {
              console.error('Image processing error:', error);
              throw new AppError(StatusCodes.INTERNAL_SERVER_ERROR, "Image processing failed");
            });
            
          processingPromises.push(processingPromise);
        }
      }
    }
  }

  try {
    // Wait for all images to be processed
    await Promise.all(processingPromises);
    next();
  } catch (error) {
    next(error);
  }
};

export { chatUpload, processChatImages };
