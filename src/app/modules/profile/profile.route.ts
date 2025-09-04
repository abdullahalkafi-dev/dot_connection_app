import express, { Router } from "express";
import { ProfileController } from "./profile.controller";
import validateRequest from "../../middlewares/validateRequest";
import auth from "../../middlewares/auth";
import { USER_ROLES } from "../user/user.constant";
import { ProfileValidations } from "./profile.validation";


const router = express.Router();

// Profile management routes
router.post(
  "/",
  auth(USER_ROLES.USER, USER_ROLES.ADMIN),
  validateRequest(ProfileValidations.createProfileValidation),
  ProfileController.createProfile
);

router.get("/", ProfileController.getAllProfiles);

router.get(
  "/my-profile",
  auth(USER_ROLES.USER, USER_ROLES.ADMIN),
  ProfileController.getMyProfile
);

router.get("/search", ProfileController.searchProfiles);

// Get profile by userId (public endpoint)
router.get("/user/:userId", 
  validateRequest(ProfileValidations.getUserIdValidation),
  ProfileController.getProfileByUserId
);

router.patch(
  "/",
  auth(USER_ROLES.USER, USER_ROLES.ADMIN),
  validateRequest(ProfileValidations.updateProfileValidation),
  ProfileController.updateProfile
);

router.delete(
  "/",
  auth(USER_ROLES.USER, USER_ROLES.ADMIN),
  ProfileController.deleteProfile
);

// Preferences route
router.patch(
  "/preferences",
  auth(USER_ROLES.USER, USER_ROLES.ADMIN),
  validateRequest(ProfileValidations.updateProfileValidation),
  ProfileController.updatePreferences
);

export const ProfileRoutes: Router = router;
