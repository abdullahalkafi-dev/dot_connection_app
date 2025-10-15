import { StatusCodes } from "http-status-codes";
import { QueryBuilder } from "../../builder/QueryBuilder";
import AppError from "../../errors/AppError";
import {
  TReturnMatch,
  TConnectionRequest,
  TMatchAction,
} from "./match.interface";
import { Match, ConnectionRequest, Connection } from "./match.model";
import { User } from "../user/user.model";
import { Profile } from "../profile/profile.model";
import mongoose from "mongoose";

// Get potential matches for user (users they haven't interacted with and match preferences)
const getPotentialMatches = async (
  userId: string,
  query: Record<string, unknown>
): Promise<TReturnMatch.getPotentialMatches> => {
  // Get current user's profile to access their preferences
  const currentUserProfile = await Profile.findOne({ userId });

  if (!currentUserProfile) {
    throw new AppError(StatusCodes.NOT_FOUND, "User profile not found");
  }

  // Get current user's location for distance calculation
  const currentUserLocation = currentUserProfile.location?.coordinates;

  // Get users this user has already interacted with
  const interactedUsers = await Match.find({ fromUserId: userId }).select(
    "toUserId"
  );
  const interactedUserIds = interactedUsers.map((match) => match.toUserId);
  // Add current user to exclude list
  interactedUserIds.push(new mongoose.Types.ObjectId(userId));

  // Use aggregation to properly join with profiles and filter
  const aggregationPipeline: any[] = [
    // Match basic user criteria first
    {
      $match: {
        _id: { $nin: interactedUserIds },
        verified: true,
        allProfileFieldsFilled: true,
        allUserFieldsFilled: true,
        status: "active",
      },
    },
    // Lookup profile data
    {
      $lookup: {
        from: "profiles",
        localField: "_id",
        foreignField: "userId",
        as: "profile",
      },
    },
    // Unwind profile (should be only one)
    {
      $unwind: "$profile",
    },
    // Apply gender and mutual interest filters
    {
      $match: {
        $and: [
          // Current user's gender preference
          currentUserProfile.interestedIn === "everyone"
            ? {}
            : { "profile.gender": currentUserProfile.interestedIn },
          // Mutual interest - target user must be interested in current user's gender
          {
            $or: [
              { "profile.interestedIn": "everyone" },
              { "profile.interestedIn": currentUserProfile.gender },
            ],
          },
        ],
      },
    },
    // Add calculated fields (age and distance)
    {
      $addFields: {
        // Calculate age from date of birth
        age: {
          $floor: {
            $divide: [
              { $subtract: [new Date(), "$dateOfBirth"] },
              365.25 * 24 * 60 * 60 * 1000, // milliseconds in a year
            ],
          },
        },
        // Calculate distance if both users have location (Haversine formula)
        distance: currentUserLocation
          ? {
              $cond: {
                if: { $ifNull: ["$profile.location.coordinates", false] },
                then: {
                  $round: [
                    {
                      $multiply: [
                        {
                          $acos: {
                            $add: [
                              {
                                $multiply: [
                                  { $sin: { $degreesToRadians: currentUserLocation[1] } },
                                  { $sin: { $degreesToRadians: { $arrayElemAt: ["$profile.location.coordinates", 1] } } },
                                ],
                              },
                              {
                                $multiply: [
                                  { $cos: { $degreesToRadians: currentUserLocation[1] } },
                                  { $cos: { $degreesToRadians: { $arrayElemAt: ["$profile.location.coordinates", 1] } } },
                                  { $cos: {
                                      $degreesToRadians: {
                                        $subtract: [
                                          { $arrayElemAt: ["$profile.location.coordinates", 0] },
                                          currentUserLocation[0],
                                        ],
                                      },
                                    },
                                  },
                                ],
                              },
                            ],
                          },
                        },
                        6371, // Earth's radius in kilometers
                      ],
                    },
                    2, // Round to 2 decimal places
                  ],
                },
                else: null,
              },
            }
          : null,
      },
    },
    // Project only required fields
    {
      $project: {
        _id: 1,
        email: 1,
        image: 1,
        phoneNumber: 1,
        dateOfBirth: 1,
        firstName: 1,
        lastName: 1,
        lastLoginAt: 1,
        age: 1, // Calculated age
        distance: 1, // Calculated distance in km
        // Only include specific profile fields
        "profile._id": 1,
        "profile.userId": 1,
        "profile.bio": 1,
        "profile.gender": 1,
        "profile.interests": 1,
        "profile.jobTitle": 1,
        "profile.hiddenFields": 1,
      },
    },
  ];

  // Add pagination if specified
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const skip = (page - 1) * limit;

  // Get total count for pagination
  const totalCountPipeline = [...aggregationPipeline, { $count: "total" }];
  const totalResult = await User.aggregate(totalCountPipeline);
  const total = totalResult[0]?.total || 0;

  // Calculate total pages
  const totalPage = Math.ceil(total / limit);

  // Validate page number - if page is beyond available pages, return empty results
  if (page > totalPage && total > 0) {
    console.log(
      `Requested page ${page} is beyond available pages (${totalPage}). Returning empty results.`
    );
    return {
      result: [],
      meta: {
        page,
        limit,
        total,
        totalPage,
      },
    };
  }

  // Add pagination to main pipeline
  if (query.page || query.limit) {
    aggregationPipeline.push({ $skip: skip });
    aggregationPipeline.push({ $limit: limit });
  }

  // Execute the aggregation
  let result = await User.aggregate(aggregationPipeline);
  console.log(
    `Page ${page}: Found ${result.length} results out of ${total} total`
  );

  // Filter out hidden fields from profiles (only check fields we're returning)
  result = result.map((user) => {
    if (user.profile && user.profile.hiddenFields) {
      const hiddenFields = user.profile.hiddenFields;
      
      // Remove fields that are marked as hidden (only the ones we're returning)
      if (hiddenFields.gender === true) delete user.profile.gender;
      if (hiddenFields.jobTitle === true) delete user.profile.jobTitle;
    }
    return user;
  });

  const meta = {
    page,
    limit,
    total,
    totalPage,
  };

  return { result, meta };
};

// Perform action on a user (skip, love)
const performAction = async (
  fromUserId: string,
  toUserId: string,
  action: TMatchAction
): Promise<{
  message: string;
  isMatch?: boolean;
  connectionRequest?: TConnectionRequest;
}> => {
  // Check if target user exists and is valid for matching
  const targetUser = await User.findById(toUserId);
  if (
    !targetUser ||
    !targetUser.verified ||
    !targetUser.allUserFieldsFilled ||
    !targetUser.allProfileFieldsFilled ||
    targetUser.status !== "active"
  ) {
    throw new AppError(
      StatusCodes.NOT_FOUND,
      "User not found or not available for matching"
    );
  }

  // Check if user is trying to match with themselves
  if (fromUserId === toUserId) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "Cannot perform action on yourself"
    );
  }

  // Check if already interacted with this user
  const existingMatch = await Match.findOne({ fromUserId, toUserId });
  if (existingMatch) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "You have already interacted with this user"
    );
  }

  // Create match record
  await Match.create({
    fromUserId,
    toUserId,
    action,
  });

  let responseData: any = {
    message: `Action '${action}' performed successfully`,
  };

  // If action is 'love', check for mutual love and handle accordingly
  if (action === "love") {
    const isMutualLove = await Match.checkMutualLove(fromUserId, toUserId);

    if (isMutualLove) {
      // AUTO-ACCEPT: Create connection immediately (they matched!)
      const connection = await Connection.create({
        userIds: [fromUserId, toUserId],
      });

      // Auto-accept any existing pending request
      await ConnectionRequest.findOneAndUpdate(
        { 
          fromUserId: toUserId, 
          toUserId: fromUserId, 
          status: "pending" 
        },
        { status: "accepted" }
      );

      responseData.isMatch = true;
      responseData.connection = connection;
      responseData.message = "It's a match! 🎉 Connection created automatically";
    } else {
      // Create connection request (one-sided love)
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

  const result = await requestQuery.modelQuery.populate(
    "fromUserId",
    "firstName lastName image verified"
  );
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
    throw new AppError(
      StatusCodes.FORBIDDEN,
      "You can only respond to your own requests"
    );
  }

  if (request.status !== "pending") {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "Request has already been responded to"
    );
  }

  // Update request status
  request.status = action === "accept" ? "accepted" : "rejected";
  await request.save();

  let responseData: any = {
    message:
      action === "accept"
        ? "Connection request accepted! 🎉"
        : "Connection request rejected",
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

  const result = await connectionQuery.modelQuery.populate(
    "userIds",
    "firstName lastName image verified"
  );
  const meta = await connectionQuery.countTotal();

  return { result, meta };
};

// Get user's match history
const getMatchHistory = async (
  userId: string,
  query: Record<string, unknown>
): Promise<TReturnMatch.getAllMatches> => {
  const matchQuery = new QueryBuilder(Match.find({ fromUserId: userId }), query)
    .sort()
    .paginate();

  const result = await matchQuery.modelQuery.populate(
    "toUserId",
    "firstName lastName image verified"
  );
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

  const result = await requestQuery.modelQuery.populate(
    "toUserId",
    "firstName lastName image verified"
  );
  const meta = await requestQuery.countTotal();

  return { result, meta };
};

export const MatchServices = {
  getPotentialMatches,
  performAction,
  getConnectionRequests,
  respondToConnectionRequest,
  getConnections,
  getMatchHistory,
  getSentRequests,
};
