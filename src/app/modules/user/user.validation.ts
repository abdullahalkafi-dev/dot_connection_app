import { z } from "zod";

const createUser = z.object({
  body: z
    .object({
      email: z.string().email("Invalid email address").trim().toLowerCase(),
    })
    .strict(),
});

const updateUserProfile = z.object({
  body: z
    .object({
      firstName: z
        .string()
        .min(2, "First name is required")
        .max(50, "First name cannot exceed 50 characters")
        .trim()
        .regex(/^[A-Za-z\s.'-]+$/, "First name contains invalid characters")
        .optional(),
      lastName: z
        .string()
        .min(2, "Last name is required")
        .max(50, "Last name cannot exceed 50 characters")
        .trim()
        .regex(/^[A-Za-z\s.'-]+$/, "Last name contains invalid characters")
        .optional(),
      phoneNumber: z.string().optional(),
      address: z.string().optional(),
      dateOfBirth: z.string().or(z.date()).optional(),
      image: z.string().optional(),
      pushNotification: z.boolean().optional(),
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
      address: z.string().optional(),
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

export const UserValidation = {
  createUser,
  updateUser,
  updateUserActivationStatus,
  updateUserRole,
  loginRequest,
  verifyOTP,
  signin,
  updateUserProfile,
};
