// import { Request, Response, NextFunction } from "express";
// import fs from "fs";
// import { StatusCodes } from "http-status-codes";
// import multer, { FileFilterCallback } from "multer";
// import path from "path";
// import AppError from "../errors/AppError";

// import { awsUpload } from "../../util/S3-Uploads";

// // Helper Functions
// const createDir = (dirPath: string) => {
//   if (!fs.existsSync(dirPath)) {
//     fs.mkdirSync(dirPath);
//   }
// };

// const generateRandomCode = (length: number = 6): string => {
//   const characters =
//     "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
//   return Array.from(
//     { length },
//     () => characters[Math.floor(Math.random() * characters.length)]
//   ).join("");
// };

// // Multer Configuration
// const configureMulter = (baseUploadDir: string) => {
//   const storage = multer.diskStorage({
//     destination: (req, file, cb) => {
//       let uploadDir;
//       console.log(file.fieldname);

//       switch (file.fieldname) {
//         case "image":
//           uploadDir = path.join(baseUploadDir, "images");
//           break;
//         case "media":
//           uploadDir = path.join(baseUploadDir, "medias");
//           break;
//         case "doc":
//         case "docs":
//           uploadDir = path.join(baseUploadDir, "docs");
//           break;
//         default:
//           throw new AppError(StatusCodes.BAD_REQUEST, "File is not supported");
//       }

//       createDir(uploadDir);
//       cb(null, uploadDir);
//     },

//     filename: (req, file, cb) => {
//       let fileExt: string;

//       if (file.fieldname === "doc" || file.fieldname === "docs") {
//         fileExt = ".pdf";
//       } else if (file.fieldname === "image") {
//         fileExt = ".tmp"; // will be converted to .webp later
//       } else {
//         fileExt = path.extname(file.originalname);
//       }

//       const date = new Date();
//       const formattedDate = `${date.getDate()}-${
//         date.getMonth() + 1
//       }-${date.getFullYear()}`;

//       const originalNameWithoutExt =
//         path.parse(file.originalname).name + "-" + generateRandomCode();

//       const fileName =
//         req?.user?.id &&
//         req.url === "/update-profile" &&
//         file.fieldname == "image"
//           ? req.user.id + originalNameWithoutExt
//           : originalNameWithoutExt.toLowerCase().split(" ").join("-") +
//             "-" +
//             formattedDate;

//       cb(null, fileName + fileExt);
//     },
//   });

//   const fileFilter = (req: Request, file: any, cb: FileFilterCallback) => {
//     if (file.fieldname === "image") {
//       const supportedImageTypes = [
//         "image/jpeg",
//         "image/png",
//         "image/jpg",
//         "image/heif",
//         "image/heic",
//         "image/tiff",
//         "image/webp",
//         "image/avif",
//       ];

//       if (supportedImageTypes.includes(file.mimetype)) {
//         cb(null, true);
//       } else {
//         console.log(file.fieldname);
//         console.log(file.mimetype);
//         cb(
//           new AppError(
//             StatusCodes.BAD_REQUEST,
//             "Only .jpeg, .png, .jpg, .heif, .heic, .tiff, .webp, .avif files supported"
//           )
//         );
//       }
//     } else if (file.fieldname === "media") {
//       if (file.mimetype === "video/mp4" || file.mimetype === "audio/mpeg") {
//         cb(null, true);
//       } else {
//         cb(
//           new AppError(
//             StatusCodes.BAD_REQUEST,
//             "Only .mp4, .mp3, file supported"
//           )
//         );
//       }
//     } else if (file.fieldname === "doc" || file.fieldname === "docs") {
//       if (file.mimetype === "application/pdf") {
//         cb(null, true);
//       } else {
//         cb(new AppError(StatusCodes.BAD_REQUEST, "Only pdf supported"));
//       }
//     } else {
//       throw new AppError(StatusCodes.BAD_REQUEST, "This file is not supported");
//     }
//   };

//   return multer({
//     storage: storage,
//     fileFilter: fileFilter,
//   });
// };

// // Main File Upload Handler
// const fileUploadHandler = (req: Request, res: Response, next: NextFunction) => {
//   // Create upload folder
//   const baseUploadDir = path.join(process.cwd(), "uploads");
//   createDir(baseUploadDir);

//   // Configure and execute multer
//   const upload = configureMulter(baseUploadDir).fields([
//     { name: "image", maxCount: 10 },
//     { name: "media", maxCount: 10 },
//     { name: "doc", maxCount: 10 },
//     { name: "docs", maxCount: 10 },
//   ]);

//   // Execute the multer middleware
//   upload(req, res, async (err: any) => {
//     if (err) {
//       return next(err);
//     }
//     const uploaders = {
//       doc: awsUpload.uploadDocToS3,
//       docs: awsUpload.uploadDocToS3,
//       image: awsUpload.uploadImageToS3,
//       media: awsUpload.uploadMediaToS3,
//     };

//     for (const field of Object.keys(req.files ?? {})) {
//       const files = (req.files as any)[field] as Express.Multer.File[];
//       const uploader = (uploaders as any)[field];
//       if (!uploader) continue;
//       // run uploads in parallel
//       await Promise.all(files.map(async file => {
//         file.path = await uploader(file);
//       }));
//     }

//     next();
//   });
// };

// export default fileUploadHandler;
import { Request, Response, NextFunction } from "express";
import fs from "fs";
import { StatusCodes } from "http-status-codes";
import multer, { FileFilterCallback } from "multer";
import path from "path";
import AppError from "../errors/AppError";
import { awsUpload } from "../../util/S3-Uploads";

// Helper Functions
const createDir = (dirPath: string) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath);
  }
};

const generateRandomCode = (length: number = 10): string => {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from(
    { length },
    () => characters[Math.floor(Math.random() * characters.length)]
  ).join("");
};

// File Type Configurations
const SUPPORTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/jpg",
  "image/heif",
  "image/heic",
  "image/tiff",
  "image/webp",
  "image/avif",
];
const SUPPORTED_MEDIA_TYPES = ["video/mp4", "audio/mpeg"];
const SUPPORTED_DOC_TYPES = ["application/pdf"];

// Multer Configuration
const configureMulter = (baseUploadDir: string) => {
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      let uploadDir = getUploadDir(file.fieldname, baseUploadDir);
      createDir(uploadDir);
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const fileExt = getFileExtension(file);
      const formattedDate = `${new Date().getDate()}-${
        new Date().getMonth() + 1
      }-${new Date().getFullYear()}`;
      const fileName = generateFileName(file, formattedDate, req);
      cb(null, `${fileName}${fileExt}`);
    },
  });

  const fileFilter = (req: Request, file: any, cb: FileFilterCallback) => {
    console.log(file.mimetype);
    if (
      file.fieldname === "image" &&
      !SUPPORTED_IMAGE_TYPES.includes(file.mimetype)
    ) {
      return cb(
        new AppError(
          StatusCodes.BAD_REQUEST,
          "Only .jpeg, .png, .jpg, .heif, .heic, .tiff, .webp, .avif files supported"
        )
      );
    }
    if (
      file.fieldname === "media" &&
      !SUPPORTED_MEDIA_TYPES.includes(file.mimetype)
    ) {
      return cb(
        new AppError(StatusCodes.BAD_REQUEST, "Only .mp4, .mp3 files supported")
      );
    }
    if (
      (file.fieldname === "doc" || file.fieldname === "docs") &&
      !SUPPORTED_DOC_TYPES.includes(file.mimetype)
    ) {
      return cb(
        new AppError(StatusCodes.BAD_REQUEST, "Only pdf files supported")
      );
    }
    cb(null, true);
  };

  return multer({ storage, fileFilter });
};

// File Upload Helper Functions
const getUploadDir = (fieldname: string, baseUploadDir: string) => {
  const uploadDirs: { [key: string]: string } = {
    image: "images",
    media: "medias",
    doc: "docs",
    docs: "docs",
  };

  const dir = uploadDirs[fieldname];
  if (!dir)
    throw new AppError(StatusCodes.BAD_REQUEST, "File is not supported");
  return path.join(baseUploadDir, dir);
};

const getFileExtension = (file: any) => {
  if (file.fieldname === "doc" || file.fieldname === "docs") return ".pdf";
  if (file.fieldname === "image") return ".tmp"; // Will be converted to .webp later
  return path.extname(file.originalname);
};

const generateFileName = (file: any, formattedDate: string, req: Request) => {
  const originalNameWithoutExt =
    path.parse(file.originalname).name + "-" + generateRandomCode();
  return req?.user?.id &&
    req.url === "/update-profile" &&
    file.fieldname === "image"
    ? req.user.id + originalNameWithoutExt
    : originalNameWithoutExt.toLowerCase().split(" ").join("-") +
        "-" +
        formattedDate;
};

// Main File Upload Handler
const fileUploadHandler = (req: Request, res: Response, next: NextFunction) => {
  // console.log(req?.body);
  // console.log(req?.files, "req.files");
  const baseUploadDir = path.join(process.cwd(), "uploads");
  createDir(baseUploadDir);

  const upload = configureMulter(baseUploadDir).fields([
    { name: "image", maxCount: 10 },
    { name: "media", maxCount: 10 },
    { name: "doc", maxCount: 10 },
    { name: "docs", maxCount: 10 },
  ]);

  upload(req, res, async (err: any) => {
    if (err) return next(err);

    const uploaders: { [key: string]: Function } = {
      doc: awsUpload.uploadDocToS3,
      docs: awsUpload.uploadDocToS3,
      image: awsUpload.uploadImageToS3,
      media: awsUpload.uploadMediaToS3,
    };

    try {
      for (const field of Object.keys(req.files ?? {})) {
        const files = (req.files as any)[field] as Express.Multer.File[];
        const uploader = uploaders[field];
        if (!uploader) continue;
        await Promise.all(
          files.map(async (file) => {
            file.path = await uploader(file);
          })
        );
      }
      next();
    } catch (err) {
      next(err);
    }
  });
};

export default fileUploadHandler;
