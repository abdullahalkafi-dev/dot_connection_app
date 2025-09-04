import express, { Router } from "express";
import { UserController } from "./user.controller";
import validateRequest from "../../middlewares/validateRequest";
import { UserValidation } from "./user.validation";
import fileUploadHandler from "../../middlewares/fileUploadHandler";
import auth from "../../middlewares/auth";
import { USER_ROLES } from "./user.constant";

const router = express.Router();

// User routes
router.post(
  "/",
  validateRequest(UserValidation.createUser),
  UserController.createUser
);
router.get(
  "/",
  auth(USER_ROLES.ADMIN, USER_ROLES.USER),
  UserController.getAllUsers
);

router.get("/getme", auth(), UserController.getMe);
router.patch(
  "/profile",
  auth(USER_ROLES.USER, USER_ROLES.ADMIN),
  validateRequest(UserValidation.updateUserProfile),
  UserController.updateUserProfile
);
router.get("/:id", UserController.getUserById);
router.patch(
  "/",
  auth(),
  fileUploadHandler,
  validateRequest(UserValidation.updateUser),
  UserController.updateUserByToken
);
router.patch(
  "/:id/status",
  validateRequest(UserValidation.updateUserActivationStatus),
  UserController.updateUserActivationStatus
);
router.patch(
  "/:id/role",
  validateRequest(UserValidation.updateUserRole),
  UserController.updateUserRole
);
router.patch(
  "/:id",
  auth(),
  fileUploadHandler,
  validateRequest(UserValidation.updateUser),
  UserController.updateUser
);

// Authentication routes - Signin flow
router.post(
  "/signin",
  validateRequest(UserValidation.signin),
  UserController.signin
);

// Legacy routes (for backward compatibility)
router.post(
  "/send-otp",
  validateRequest(UserValidation.loginRequest),
  UserController.sendOTPForLogin
);

router.post(
  "/verify-otp",
  validateRequest(UserValidation.verifyOTP),
  UserController.verifyOTPAndLogin
);

router.post(
  "/resend-otp",
  validateRequest(UserValidation.loginRequest),
  UserController.resendOTP
);

router.delete("/delete", auth(), UserController.changeUserStatus);

export const UserRoutes: Router = router;
