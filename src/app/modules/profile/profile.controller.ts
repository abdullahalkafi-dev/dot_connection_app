import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { ProfileServices } from "./profile.service";

const createProfile = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user._id;
  const profile = await ProfileServices.createProfile(userId, req.body);

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Profile created successfully",
    data: profile,
  });
});

const getAllProfiles = catchAsync(async (req: Request, res: Response) => {
  const profilesRes = await ProfileServices.getAllProfiles(req.query);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Profiles retrieved successfully",
    data: profilesRes.result,
    meta: profilesRes.meta,
  });
});

const getProfileByUserId = catchAsync(async (req: Request, res: Response) => {
  const profile = await ProfileServices.getProfileByUserId(req.params.userId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Profile retrieved successfully",
    data: profile,
  });
});

const getMyProfile = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user._id;
  const profile = await ProfileServices.getMyProfile(userId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Profile retrieved successfully",
    data: profile,
  });
});

const updateProfile = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user._id;
  const profile = await ProfileServices.updateProfile(userId, req.body);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Profile updated successfully",
    data: profile,
  });
});

const deleteProfile = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user._id;
  await ProfileServices.deleteProfile(userId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Profile deleted successfully",
    data: null,
  });
});

// Search profiles
const searchProfiles = catchAsync(async (req: Request, res: Response) => {
  const profilesRes = await ProfileServices.searchProfiles(req.query);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Profiles found successfully",
    data: profilesRes.result,
    meta: profilesRes.meta,
  });
});

// Update preferences
const updatePreferences = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user._id;
  const profile = await ProfileServices.updatePreferences(userId, req.body);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Preferences updated successfully",
    data: profile,
  });
});

export const ProfileController = {
  createProfile,
  getAllProfiles,
  getProfileByUserId,
  getMyProfile,
  updateProfile,
  deleteProfile,
  searchProfiles,
  updatePreferences,
};
