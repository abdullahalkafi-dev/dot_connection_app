import { z } from "zod";

const performAction = z.object({
  body: z.object({
    toUserId: z.string().min(1, "User ID is required"),
    action: z.enum(["skip", "love", "map"], {
      errorMap: () => ({ message: "Action must be skip, love, or map" }),
    }),
  }).strict(),
});

const respondToRequest = z.object({
  body: z.object({
    action: z.enum(["accept", "reject"], {
      errorMap: () => ({ message: "Action must be accept or reject" }),
    }),
  }).strict(),
});

const getUserLocation = z.object({
  params: z.object({
    userId: z.string().min(1, "User ID is required"),
  }),
});

export const MatchValidation = {
  performAction,
  respondToRequest,
  getUserLocation,
};
