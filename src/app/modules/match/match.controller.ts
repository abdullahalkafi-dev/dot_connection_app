import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { MatchServices } from "./match.service";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";

// Get potential matches for swiping
const getPotentialMatches = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const matchesRes = await MatchServices.getPotentialMatches(userId, req.query);
  
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Potential matches retrieved successfully",
    data: matchesRes.result,
    meta: matchesRes.meta,
  });
});

// Perform action on a user (skip, love, map)
const performAction = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const { toUserId, action } = req.body;
  
  const result = await MatchServices.performAction(userId, toUserId, action);
  
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: result.message,
    data: result,
  });
});

// Get connection requests received
const getConnectionRequests = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const requestsRes = await MatchServices.getConnectionRequests(userId, req.query);
  
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Connection requests retrieved successfully",
    data: requestsRes.result,
    meta: requestsRes.meta,
  });
});

// Respond to connection request
const respondToRequest = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const { requestId } = req.params;
  const { action } = req.body;
  
  const result = await MatchServices.respondToConnectionRequest(requestId, userId, action);
  
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: result.message,
    data: result,
  });
});

// Get user's connections (matches)
const getConnections = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const connectionsRes = await MatchServices.getConnections(userId, req.query);
  
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Connections retrieved successfully",
    data: connectionsRes.result,
    meta: connectionsRes.meta,
  });
});

// Get match history
const getMatchHistory = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const historyRes = await MatchServices.getMatchHistory(userId, req.query);
  
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Match history retrieved successfully",
    data: historyRes.result,
    meta: historyRes.meta,
  });
});

// Get sent requests
const getSentRequests = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const requestsRes = await MatchServices.getSentRequests(userId, req.query);
  
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Sent requests retrieved successfully",
    data: requestsRes.result,
    meta: requestsRes.meta,
  });
});

// Get user location for map view
const getUserLocation = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const location = await MatchServices.getUserLocation(userId);
  
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "User location retrieved successfully",
    data: location,
  });
});

export const MatchController = {
  getPotentialMatches,
  performAction,
  getConnectionRequests,
  respondToRequest,
  getConnections,
  getMatchHistory,
  getSentRequests,
  getUserLocation,
};
