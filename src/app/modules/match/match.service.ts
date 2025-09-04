import { StatusCodes } from "http-status-codes";
import { QueryBuilder } from "../../builder/QueryBuilder";
import AppError from "../../errors/AppError";
import { TReturnMatch, TMatch, TConnectionRequest, TMatchAction } from "./match.interface";
import { Match, ConnectionRequest, Connection } from "./match.model";
import { User } from "../user/user.model";
import mongoose from "mongoose";

// Get potential matches for user (users they haven't interacted with)
const getPotentialMatches = async (
  userId: string,
  query: Record<string, unknown>
): Promise<TReturnMatch.getPotentialMatches> => {
  // Get users this user has already interacted with
  const interactedUsers = await Match.find({ fromUserId: userId }).select("toUserId");
  const interactedUserIds = interactedUsers.map(match => match.toUserId);
  
  // Add current user to exclude list
  interactedUserIds.push(new mongoose.Types.ObjectId(userId));
  
  // Find potential matches (verified users with complete profiles, excluding interacted ones)
  const matchQuery = new QueryBuilder(
    User.find({
      _id: { $nin: interactedUserIds },
      verified: true,
      allFieldsFilled: true,
      status: "active"
    }),
    query
  )
    .filter()
    .sort()
    .paginate()
    .fields();

  const result = await matchQuery.modelQuery.select("-authentication");
  const meta = await matchQuery.countTotal();
  
  return { result, meta };
};

// Perform action on a user (skip, love, map)
const performAction = async (
  fromUserId: string,
  toUserId: string,
  action: TMatchAction
): Promise<{ message: string; isMatch?: boolean; connectionRequest?: TConnectionRequest }> => {
  // Check if target user exists and is valid for matching
  const targetUser = await User.findById(toUserId);
  if (!targetUser || !targetUser.verified || !targetUser.allFieldsFilled) {
    throw new AppError(StatusCodes.NOT_FOUND, "User not found or not available for matching");
  }

  // Check if user is trying to match with themselves
  if (fromUserId === toUserId) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Cannot perform action on yourself");
  }

  // Check if already interacted with this user
  const existingMatch = await Match.findOne({ fromUserId, toUserId });
  if (existingMatch) {
    throw new AppError(StatusCodes.BAD_REQUEST, "You have already interacted with this user");
  }

  // Create match record
  await Match.create({
    fromUserId,
    toUserId,
    action,
  });

  let responseData: any = { message: `Action '${action}' performed successfully` };

  // If action is 'love', check for mutual love and create connection request
  if (action === "love") {
    const isMutualLove = await Match.checkMutualLove(fromUserId, toUserId);
    
    if (isMutualLove) {
      // Create connection (they matched!)
      await Connection.create({
        userIds: [fromUserId, toUserId],
      });
      
      responseData.isMatch = true;
      responseData.message = "It's a match! 🎉";
    } else {
      // Create connection request
      const connectionRequest = await ConnectionRequest.create({
        fromUserId,
        toUserId,
        status: "pending",
      });
      
      responseData.connectionRequest = connectionRequest;
      responseData.message = "Love sent! Waiting for their response ❤️";
    }
  }

  return responseData;
};

// Get connection requests received by user
const getConnectionRequests = async (
  userId: string,
  query: Record<string, unknown>
): Promise<TReturnMatch.getConnectionRequests> => {
  const requestQuery = new QueryBuilder(
    ConnectionRequest.find({ toUserId: userId, status: "pending" }),
    query
  )
    .sort()
    .paginate();

  const result = await requestQuery.modelQuery.populate("fromUserId", "firstName lastName image verified");
  const meta = await requestQuery.countTotal();
  
  return { result, meta };
};

// Respond to connection request (accept/reject)
const respondToConnectionRequest = async (
  requestId: string,
  userId: string,
  action: "accept" | "reject"
): Promise<{ message: string; connection?: any }> => {
  const request = await ConnectionRequest.findById(requestId);
  
  if (!request) {
    throw new AppError(StatusCodes.NOT_FOUND, "Connection request not found");
  }

  if (request.toUserId.toString() !== userId) {
    throw new AppError(StatusCodes.FORBIDDEN, "You can only respond to your own requests");
  }

  if (request.status !== "pending") {
    throw new AppError(StatusCodes.BAD_REQUEST, "Request has already been responded to");
  }

  // Update request status
  request.status = action === "accept" ? "accepted" : "rejected";
  await request.save();

  let responseData: any = { 
    message: action === "accept" ? "Connection request accepted! 🎉" : "Connection request rejected" 
  };

  // If accepted, create connection
  if (action === "accept") {
    const connection = await Connection.create({
      userIds: [request.fromUserId, request.toUserId],
    });
    
    responseData.connection = connection;
  }

  return responseData;
};

// Get user's connections
const getConnections = async (
  userId: string,
  query: Record<string, unknown>
): Promise<TReturnMatch.getConnections> => {
  const connectionQuery = new QueryBuilder(
    Connection.find({ userIds: userId }),
    query
  )
    .sort()
    .paginate();

  const result = await connectionQuery.modelQuery.populate("userIds", "firstName lastName image verified");
  const meta = await connectionQuery.countTotal();
  
  return { result, meta };
};

// Get user's match history
const getMatchHistory = async (
  userId: string,
  query: Record<string, unknown>
): Promise<TReturnMatch.getAllMatches> => {
  const matchQuery = new QueryBuilder(
    Match.find({ fromUserId: userId }),
    query
  )
    .sort()
    .paginate();

  const result = await matchQuery.modelQuery.populate("toUserId", "firstName lastName image verified");
  const meta = await matchQuery.countTotal();
  
  return { result, meta };
};

// Get sent connection requests
const getSentRequests = async (
  userId: string,
  query: Record<string, unknown>
): Promise<TReturnMatch.getConnectionRequests> => {
  const requestQuery = new QueryBuilder(
    ConnectionRequest.find({ fromUserId: userId }),
    query
  )
    .sort()
    .paginate();

  const result = await requestQuery.modelQuery.populate("toUserId", "firstName lastName image verified");
  const meta = await requestQuery.countTotal();
  
  return { result, meta };
};

// Get user location for map view (this would integrate with your profile/location data)
const getUserLocation = async (userId: string): Promise<any> => {
  const user = await User.findById(userId).select("firstName lastName image address");
  
  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, "User not found");
  }

  // This is a placeholder - you would integrate with your profile's location data
  return {
    user: {
      _id: userId,
      firstName: user.firstName,
      lastName: user.lastName,
      image: user.image,
      address: user.address,
    },
    // You would add actual coordinates here from profile
    location: {
      latitude: null,
      longitude: null,
      address: user.address,
    }
  };
};

export const MatchServices = {
  getPotentialMatches,
  performAction,
  getConnectionRequests,
  respondToConnectionRequest,
  getConnections,
  getMatchHistory,
  getSentRequests,
  getUserLocation,
};
