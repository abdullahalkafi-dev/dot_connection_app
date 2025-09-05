import express, { Router } from "express";
import { UserController } from "./user.controller";
import validateRequest from "../../middlewares/validateRequest";
import { UserValidation } from "./user.validation";
import fileUploadHandler from "../../middlewares/fileUploadHandler";
import auth from "../../middlewares/auth";
import { USER_ROLES } from "./user.constant";

const router = express.Router();

// User routes

//! both for login and create account
//!mine
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

//!mine
router.get("/getme", auth(), UserController.getMe);

router.patch(
  "/profile",
  auth(USER_ROLES.USER, USER_ROLES.ADMIN),
  validateRequest(UserValidation.updateUserProfile),
  UserController.updateUserProfile
);

//!mine
router.put(
  "/add-user-fields",
  auth(USER_ROLES.USER, USER_ROLES.ADMIN),
  validateRequest(UserValidation.addUserFields),
  UserController.addUserFields
);
//!mine
router.put(
  "/add-profile-fields",
  auth(USER_ROLES.USER, USER_ROLES.ADMIN),
  validateRequest(UserValidation.addProfileFields),
  UserController.addProfileFields
);



router.get("/:id", UserController.getUserById);
//!mine
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

//!mine
router.post(
  "/verify-otp",
  validateRequest(UserValidation.verifyOTP),
  UserController.verifyOTPAndLogin
);

router.delete("/delete", auth(), UserController.changeUserStatus);

export const UserRoutes: Router = router;
