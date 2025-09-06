import { z } from "zod";
import {
  PROFILE_DRINKING_STATUS,
  PROFILE_INTERESTS,
  PROFILE_RELIGION,
  PROFILE_SMOKING_STATUS,
  PROFILE_STUDY_LEVEL,
} from "../profile/profile.constant";
const locationSchema = z
  .object({
    type: z.literal("Point").default("Point"),
    coordinates: z
      .array(z.number())
      .length(
        2,
        "Coordinates must have exactly 2 numbers [longitude, latitude]"
      ),
    address: z.string().trim().optional(),
  })
  .optional();

const createUser = z.object({
  body: z
    .object({
      email: z.string().email("Invalid email address").trim().toLowerCase(),
    })
    .strict(),
});

const loginRequest = z.object({
  body: z
    .object({
      email: z.string().email("Invalid email address").trim().toLowerCase(),
    })
    .strict(),
});

const verifyOTP = z.object({
  body: z
    .object({
      email: z.string().email("Invalid email address").trim().toLowerCase(),
      otp: z
        .string()
        .min(6, "OTP must be 6 digits")
        .max(6, "OTP must be 6 digits")
        .regex(/^\d{6}$/, "OTP must be 6 digits"),
    })
    .strict(),
});

const updateUser = z.object({
  data: z
    .object({
      firstName: z
        .string()
        .min(2, "First name must be at least 2 characters long")
        .max(50, "First name can't be more than 50 characters")
        .regex(
          /^[a-zA-ZÀ-ÿ\u00f1\u00d1'-\s]+$/,
          "First name contains invalid characters"
        )
        .trim()
        .optional(),
      lastName: z
        .string()
        .min(2, "Last name must be at least 2 characters long")
        .max(50, "Last name can't be more than 50 characters")
        .regex(
          /^[a-zA-ZÀ-ÿ\u00f1\u00d1'-\s]+$/,
          "Last name contains invalid characters"
        )
        .trim()
        .optional(),
      phoneNumber: z.string().trim().optional(),
      fcmToken: z.string().nullable().optional(),
      pushNotification: z.boolean().optional(),
      dateOfBirth: z.string().or(z.date()).optional(),
    })
    .strict()
    .nullable(), // Allow data to be null
});

const updateUserActivationStatus = z.object({
  body: z
    .object({
      status: z.enum(["active", "delete"]),
    })
    .strict(),
});

const updateUserRole = z.object({
  body: z
    .object({
      role: z.enum(["ADMIN", "USER"]),
    })
    .strict(),
});

const signin = z.object({
  body: z
    .object({
      email: z.string().email("Invalid email address").trim().toLowerCase(),
      otp: z
        .string()
        .min(6, "OTP must be 6 digits")
        .max(6, "OTP must be 6 digits")
        .regex(/^\d{6}$/, "OTP must be 6 digits")
        .optional(),
    })
    .strict(),
});
const addUserFields = z.object({
  body: z
    .object({
      firstName: z
        .string()
        .min(2, "First name must be at least 2 characters long")
        .max(50, "First name can't be more than 50 characters")
        .regex(
          /^[a-zA-ZÀ-ÿ\u00f1\u00d1'-\s]+$/,
          "First name contains invalid characters"
        )
        .trim(),
      lastName: z
        .string()
        .min(2, "Last name must be at least 2 characters long")
        .max(50, "Last name can't be more than 50 characters")
        .regex(
          /^[a-zA-ZÀ-ÿ\u00f1\u00d1'-\s]+$/,
          "Last name contains invalid characters"
        )
        .trim(),
      dateOfBirth: z.string().or(z.date()).optional(),
      pushNotification: z.boolean().optional(),
    })
    .strict(),
});
const addProfileFields = z.object({
  body: z
    .object({
      location: locationSchema,
      gender: z.string().min(1, "Gender is required"),
      interestedIn: z.string().min(1, "Interested in is required"),
      height: z.number().min(1, "Height is required"),
      interests: z
        .array(
          z.enum(Object.values(PROFILE_INTERESTS) as [string, ...string[]])
        )
        .max(11, "Cannot have more than 11 interests")
        .optional(),
      lookingFor: z.string().min(1, "Looking for is required"),
      ageRangeMin: z.number().min(14, "Minimum age must be 14"),
      ageRangeMax: z.number().max(130, "Maximum age cannot exceed 130"),
      maxDistance: z.number().min(1, "Maximum distance must be at least 1"),
      hometown: z.string().min(1, "Hometown is required"),
      workplace: z.string().min(1, "Workplace is required"),
      jobTitle: z.string().min(1, "Job title is required"),
      school: z.string().min(1, "School is required"),
      studyLevel: z
        .enum(Object.values(PROFILE_STUDY_LEVEL) as [string, ...string[]])
        .optional(),
      religious: z
        .enum(Object.values(PROFILE_RELIGION) as [string, ...string[]])
        .optional(),
      smokingStatus: z
        .enum(Object.values(PROFILE_SMOKING_STATUS) as [string, ...string[]])
        .optional(),
      drinkingStatus: z
        .enum(Object.values(PROFILE_DRINKING_STATUS) as [string, ...string[]])
        .optional(),
      bio: z.string().min(1, "Bio is required"),
    })
    .strict(),
});
const updateProfileFields = z.object({
  data: z
    .object({
      location: locationSchema,
      gender: z.string().min(1, "Gender is required").optional(),
      interestedIn: z.string().min(1, "Interested in is required").optional(),
      height: z.number().min(1, "Height is required").optional(),
      interests: z
        .array(
          z.enum(Object.values(PROFILE_INTERESTS) as [string, ...string[]])
        )
        .max(11, "Cannot have more than 11 interests")
        .optional(),
      lookingFor: z.string().min(1, "Looking for is required").optional(),
      ageRangeMin: z.number().min(14, "Minimum age must be 14").optional(),
      ageRangeMax: z
        .number()
        .max(130, "Maximum age cannot exceed 130")
        .optional(),
      maxDistance: z
        .number()
        .min(1, "Maximum distance must be at least 1")
        .optional(),
      hometown: z.string().min(1, "Hometown is required").optional(),
      workplace: z.string().min(1, "Workplace is required").optional(),
      jobTitle: z.string().min(1, "Job title is required").optional(),
      school: z.string().min(1, "School is required").optional(),
      studyLevel: z
        .enum(Object.values(PROFILE_STUDY_LEVEL) as [string, ...string[]])
        .optional(),
      religious: z
        .enum(Object.values(PROFILE_RELIGION) as [string, ...string[]])
        .optional(),
      smokingStatus: z
        .enum(Object.values(PROFILE_SMOKING_STATUS) as [string, ...string[]])
        .optional(),
      drinkingStatus: z
        .enum(Object.values(PROFILE_DRINKING_STATUS) as [string, ...string[]])
        .optional(),
      bio: z.string().min(1, "Bio is required").optional(),
    })
    .strict(),

});

export const UserValidation = {
  createUser,
  updateUser,
  updateUserActivationStatus,
  updateUserRole,
  loginRequest,
  verifyOTP,
  signin,
  addUserFields,
  addProfileFields,
  updateProfileFields,
};
