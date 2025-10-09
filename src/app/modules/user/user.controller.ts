import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import { UserServices } from "./user.service";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { logger } from "../../../shared/logger";
//!mine
const createUser = catchAsync(async (req: Request, res: Response) => {
  const { message } = await UserServices.createUser(req.body);
  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: message,
    data: null,
  });
});

const getAllUsers = catchAsync(async (req: Request, res: Response) => {
  const usersRes = await UserServices.getAllUsers(req.query);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Users retrieved successfully",
    data: usersRes.result,
    meta: usersRes.meta,
  });
});

const getUserById = catchAsync(async (req: Request, res: Response) => {
  const user = await UserServices.getUserById(req.params.id);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "User retrieved successfully",
    data: user,
  });
});
//!mine
const getMe = catchAsync(async (req: Request, res: Response) => {
  logger.info(`GetMe called by user ID: ${req.user._id}`);
  const user = await UserServices.getMe(req.user._id);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "User retrieved successfully",
    data: user,
  });
});

//!mine - Get nearby users within specified radius
const getNearbyUsers = catchAsync(async (req: Request, res: Response) => {
  const { 
    radius = "25",
    latitude,
    longitude,
    gender,
    interests,
    interestedIn,
    lookingFor,
    religious,
    studyLevel
  } = req.query as {
    radius?: string;
    latitude?: string;
    longitude?: string;
    gender?: string;
    interests?: string;
    interestedIn?: string;
    lookingFor?: string;
    religious?: string;
    studyLevel?: string;
  };
  
  const currentUserId = req.user._id;
  
  // Parse numeric values
  const searchRadius = parseFloat(radius);
  const parsedLatitude = latitude ? parseFloat(latitude) : undefined;
  const parsedLongitude = longitude ? parseFloat(longitude) : undefined;
  
  // Parse array values (interests can be comma-separated)
  const parsedInterests = interests ? interests.split(',').map(i => i.trim()) : undefined;

  const filters = {
    radius: searchRadius,
    latitude: parsedLatitude,
    longitude: parsedLongitude,
    gender,
    interests: parsedInterests,
    interestedIn,
    lookingFor,
    religious,
    studyLevel
  };

  const result = await UserServices.getNearbyUsers(currentUserId, filters);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Nearby users retrieved successfully",
    data: result,
  });
});

//!mine
const updateUserByToken = catchAsync(async (req: Request, res: Response) => {
  const userdata = JSON.parse(req.body.data);
  let image = null;
  if (req.files && "image" in req.files && req.files.image[0]) {
    image = req.files.image[0].path.replace("/app/uploads", "");
  }
  const user = {
    ...userdata,
    image: image,
  };
  if (user.image === null) {
    delete user.image;
  }

  const id = req.user._id;
  const result = await UserServices.updateUserByToken(id, user);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "User updated successfully",
    data: result,
  });
});

const updateUserActivationStatus = catchAsync(
  async (req: Request, res: Response) => {
    const { status } = req.body;
    const user = await UserServices.updateUserActivationStatus(
      req.params.id,
      status
    );
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: `User ${
        status === "active" ? "activated" : "deleted"
      } successfully`,
      data: user,
    });
  }
);

const updateUserRole = catchAsync(async (req: Request, res: Response) => {
  const { role } = req.body;
  const user = await UserServices.updateUserRole(req.params.id, role);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "User role updated successfully",
    data: user,
  });
});

// Send OTP for login
const sendOTPForLogin = catchAsync(async (req: Request, res: Response) => {
  const result = await UserServices.sendOTPForLogin(req.body.email);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: result.message,
    data: null,
  });
});

//!mine
// Verify OTP and login
const verifyOTPAndLogin = catchAsync(async (req: Request, res: Response) => {
  const { email, otp } = req.body;
  const result = await UserServices.verifyOTPAndLogin(email, otp);

  // Set refresh token as httpOnly cookie
  res.cookie("refreshToken", result.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Login successful",
    data: {
      user: result.user,
      accessToken: result.accessToken,
    },
  });
});

// Resend OTP
const resendOTP = catchAsync(async (req: Request, res: Response) => {
  const result = await UserServices.resendOTP(req.body.email);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: result.message,
    data: null,
  });
});

const changeUserStatus = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user._id;
  const user = await UserServices.changeUserStatus(userId);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "User status changed successfully",
    data: user,
  });
});



// Unified signin - handles both OTP request and verification
const signin = catchAsync(async (req: Request, res: Response) => {
  const { email, otp } = req.body;

  // If OTP is provided, verify and login
  if (otp) {
    const result = await UserServices.verifyOTPAndLogin(email, otp);

    // Set refresh token as httpOnly cookie
    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Login successful",
      data: {
        user: result.user,
        accessToken: result.accessToken,
      },
    });
  } else {
    // If no OTP provided, send OTP
    const result = await UserServices.sendOTPForLogin(email);
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: result.message,
      data: null,
    });
  }
});
//!mine
const addUserFields = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user._id;
  const result = await UserServices.addUserFields(userId, req.body);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "User fields added successfully",
    data: result,
  });
});
//!mine
const addProfileFields = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user._id;
  const result = await UserServices.addProfileFields(userId, req.body);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Profile fields added successfully",
    data: result,
  });
});
//!mine
const updateProfileByToken = catchAsync(async (req: Request, res: Response) => {
  const profileData = JSON.parse(req.body.data);
  let newImages: string[] = [];
  
  // Handle multiple image uploads
  if (req.files && "image" in req.files && Array.isArray(req.files.image)) {
    newImages = req.files.image.map((file: any) => 
      file.path.replace("/app/uploads", "")
    );
  }
  
  const profile = {
    ...profileData,
    newPhotos: newImages, // Send new images separately to service
  };
  
  const userId = req.user._id;
  const result = await UserServices.updateProfileByToken(userId, profile);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Profile updated successfully",
    data: result,
  });
});

//!mine
// Delete single profile image by index
const deleteProfileImage = catchAsync(async (req: Request, res: Response) => {
  const { imageIndex } = req.params;
  const userId = req.user._id;
  
  const result = await UserServices.deleteProfileImage(userId, parseInt(imageIndex));
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Image deleted successfully",
    data: result,
  });
});

//!mine - Update hidden fields for user profile
const updateHiddenFields = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user._id;
  const { hiddenFields } = req.body;

  const result = await UserServices.updateHiddenFields(userId, hiddenFields);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Hidden fields updated successfully",
    data: result,
  });
});

export const UserController = {
  createUser,
  getAllUsers,
  getUserById,
  updateUserActivationStatus,
  updateUserRole,
  getMe,
  getNearbyUsers,
  updateUserByToken,
  changeUserStatus,
  signin,
  sendOTPForLogin,
  verifyOTPAndLogin,
  resendOTP,
  addUserFields,
  addProfileFields,
  updateProfileByToken,
  deleteProfileImage,
  updateHiddenFields,
};
