import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import { UserServices } from "./user.service";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";

const createUser = catchAsync(async (req: Request, res: Response) => {
  const user = await UserServices.createUser(req.body);
  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "User created successfully",
    data: user,
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
const getMe = catchAsync(async (req: Request, res: Response) => {
  const user = await UserServices.getUserById(req.user.id);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "User retrieved successfully",
    data: user,
  });
});
const updateUser = catchAsync(async (req: Request, res: Response) => {
  const userdata = JSON.parse(req.body.data);
  let image = null;
  if (req.files && "image" in req.files && req.files.image[0]) {
    image = req.files.image[0].path;
  }
  const user = {
    ...userdata,
    image: image,
  };
  if (user.image === null) {
    delete user.image;
  }

  const id = req.params.id;
  const result = await UserServices.updateUser(id, user);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "User updated successfully",
    data: result,
  });
});
const updateUserByToken = catchAsync(async (req: Request, res: Response) => {
  const userdata = JSON.parse(req.body.data);
  let image = null;
  if (req.files && "image" in req.files && req.files.image[0]) {
    image = req.files.image[0].path;
  }
  const user = {
    ...userdata,
    image: image,
  };
  if (user.image === null) {
    delete user.image;
  }

  const id = req.user.id;
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

// Update user profile with all fields check
const updateUserProfile = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user._id;
  const result = await UserServices.updateUserProfile(userId, req.body);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "User profile updated successfully",
    data: result,
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

export const UserController = {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  updateUserActivationStatus,
  updateUserRole,
  getMe,
  updateUserByToken,
  changeUserStatus,
  signin,
  sendOTPForLogin,
  verifyOTPAndLogin,
  resendOTP,
  updateUserProfile,
};
