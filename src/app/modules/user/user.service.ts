import { StatusCodes } from "http-status-codes";
import { QueryBuilder } from "../../builder/QueryBuilder";
import AppError from "../../errors/AppError";
import UserCacheManage from "./user.cacheManage";
import { TReturnUser, TUser } from "./user.interface";
import { User } from "./user.model";

import { emailTemplate } from "../../../mail/emailTemplate";
import { emailHelper } from "../../../mail/emailHelper";
import { jwtHelper } from "../../../helpers/jwtHelper";
import config from "../../../config";
import { Profile } from "../profile/profile.model";




const getUserById = async (
  id: string
): Promise<Partial<TReturnUser.getSingleUser>> => {
  // First, try to retrieve the user from cache.
  const cachedUser = await UserCacheManage.getCacheSingleUser(id);
  if (cachedUser) return cachedUser;
  // If not cached, query the database using lean with virtuals enabled.
  const user = await User.findById(id);
  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, "User not found");
  }
  // Cache the freshly retrieved user data.
  await UserCacheManage.setCacheSingleUser(id, user);
  return user;
};

const updateUser = async (
  id: string,
  updateData: Partial<TReturnUser.updateUser>
): Promise<Partial<TReturnUser.updateUser>> => {
  const user = await User.findByIdAndUpdate(id, updateData, {
    new: true,
  });
  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, "User not found");
  }
  //remove cache
  await UserCacheManage.updateUserCache(id);

  //set new cache
  UserCacheManage.setCacheSingleUser(id, user);
  return user;
};

const updateUserActivationStatus = async (
  id: string,
  status: "active" | "delete"
): Promise<TReturnUser.updateUserActivationStatus> => {
  // console.log(status);
  // console.log(id);

  const user = await User.findByIdAndUpdate(
    id,
    { status: status },
    { new: true }
  );
  // console.log(user);
  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, "User not found");
  }
  //remove cache
  await UserCacheManage.updateUserCache(id);

  //set new cache
  // UserCacheManage.setCacheSingleUser(id, user);
  return user;
};
const updateUserRole = async (
  id: string,
  role: "USER" | "ADMIN"
): Promise<Partial<TReturnUser.updateUserRole>> => {
  const user = await User.findByIdAndUpdate(
    id,
    { $set: { role } },
    { new: true }
  );
  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, "User not found");
  }
  //remove cache
  await UserCacheManage.updateUserCache(id);

  return user;
};

const changeUserStatus = async (userId: string) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, "User not found");
  }
  let status = user.status;
  if (user.role === "ADMIN") {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "You can't change admin status"
    );
  }
  if (user.status === "active") {
    status = "delete";
  } else {
    status = "active";
  }
  await User.findByIdAndUpdate(userId, { status }, { new: true });
  //remove cache
  await UserCacheManage.updateUserCache(userId);
  return user;
};

// Send OTP for login
const sendOTPForLogin = async (email: string) => {
  const user = await User.isExistUserByEmail(email);
  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, "User not found with this email");
  }

  // Check rate limiting
  if (!User.canAttemptLogin(user)) {
    throw new AppError(
      StatusCodes.TOO_MANY_REQUESTS,
      "Too many login attempts. Please try again later."
    );
  }

  // Generate and store OTP
  const otp = await User.generateOTP(email);
  console.log(otp);
  // Send email with OTP
  const emailContent = emailTemplate.createAccount({
    otp,
    email: user.email,
    name: user.firstName || "User",
    theme: "theme-blue",
  });

  await emailHelper.sendEmail({
    to: user.email,
    subject: "Your Sign-in Verification Code",
    html: emailContent.html,
  });

  return {
    message: "Verification code sent successfully to your email",
    email: user.email,
  };
};

// Verify OTP and login
const verifyOTPAndLogin = async (email: string, otp: string) => {
  const user = await User.isExistUserByEmail(email);
  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, "User not found with this email");
  }

  // Check rate limiting
  if (!User.canAttemptLogin(user)) {
    throw new AppError(
      StatusCodes.TOO_MANY_REQUESTS,
      "Too many login attempts. Please try again later."
    );
  }

  // Validate OTP
  const isValidOTP = await User.isValidOTP(email, otp);
  if (!isValidOTP) {
    // Increment failed attempts
    await User.findByIdAndUpdate(user._id, {
      $inc: { "authentication.loginAttempts": 1 },
      $set: { "authentication.lastLoginAttempt": new Date() },
    });

    throw new AppError(StatusCodes.BAD_REQUEST, "Invalid or expired OTP");
  }

  // Clear OTP completely and reset login attempts
  await User.findByIdAndUpdate(user._id, {
    $unset: {
      "authentication.oneTimeCode": 1,
      "authentication.expireAt": 1,
    },
    $set: {
      "authentication.loginAttempts": 0,
      lastLoginAt: new Date(),
      verified: true,
    },
  });

  // Generate JWT token
  const jwtPayload = {
    _id: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.role,
    image: user.image,
    verified: true,
    allProfileFieldsFilled: user.allProfileFieldsFilled || false,
    allUserFieldsFilled: user.allUserFieldsFilled || false,
  };

  const accessToken = jwtHelper.createToken(
    jwtPayload,
    config.jwt.jwt_secret as string,
    config.jwt.jwt_expire_in as string
  );

  const refreshToken = jwtHelper.createToken(
    jwtPayload,
    config.jwt.jwt_refresh_secret as string,
    config.jwt.jwt_refresh_expire_in as string
  );

  // Update user cache
  if (user._id) {
    await UserCacheManage.updateUserCache(user._id.toString());
  }

  return {
    user: jwtPayload,
    accessToken,
    refreshToken,
  };
};

// Request new OTP (resend)
const resendOTP = async (email: string) => {
  return await sendOTPForLogin(email);
};

// Check if all required fields are filled
const checkAllFieldsFilled = (user: TUser): boolean => {
  const requiredFields = [
    user.firstName,
    user.lastName,
    user.phoneNumber,
    user.dateOfBirth,
    user.address,
  ];

  return requiredFields.every(
    (field) => field && field.toString().trim().length > 0
  );
};

// Update user profile and check completeness
const updateUserProfile = async (
  userId: string,
  updateData: Partial<TUser>
): Promise<TUser> => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, "User not found");
  }

  // Update user data
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { $set: updateData },
    { new: true, runValidators: true }
  );
  console.log(updatedUser);

  if (!updatedUser) {
    throw new AppError(StatusCodes.BAD_REQUEST, "User update failed");
  }

  // Check if all fields are filled and update allFieldsFilled flag
  const allFieldsFilled = checkAllFieldsFilled(updatedUser);

  if (allFieldsFilled !== updatedUser.allFieldsFilled) {
    await User.findByIdAndUpdate(userId, {
      $set: { allFieldsFilled },
    });
    updatedUser.allFieldsFilled = allFieldsFilled;
  }

  // Update cache
  if (updatedUser._id) {
    await UserCacheManage.updateUserCache(updatedUser._id.toString());
  }

  return updatedUser;
};
//!!  admin routes
const getAllUsers = async (
  query: Record<string, unknown>
): Promise<TReturnUser.getAllUser> => {
  const cached = await UserCacheManage.getCacheListWithQuery(query);
  if (cached) return cached;

  const userQuery = new QueryBuilder(User.find(), query)
    .search(["firstName", "lastName", "email"])
    .filter()
    .sort()
    .paginate()
    .fields();
  const result = await userQuery.modelQuery;
  // console.log(result);
  const meta = await userQuery.countTotal();
  await UserCacheManage.setCacheListWithQuery(query, { result, meta });
  return { result, meta };
};


//! made by mine
const createUser = async (user: TUser): Promise<{ message: string }> => {
  let message = "";
  // Check if user exists
  const existingUser = await User.findOne({ email: user.email }).lean();

  if (existingUser) {
    // If user exists and is verified, just send OTP
    if (existingUser.verified) {
      await sendOTPForLogin(existingUser.email);
      message = "Verification code sent successfully to your email";
      return { message };
    }

    // If user exists but not verified, delete the old account
    await User.findByIdAndDelete(existingUser._id);
    await Profile.findOneAndDelete({ userId: existingUser._id });
  }

  // Create new user with only email
  const newUser = await User.create({ email: user.email });
  if (!newUser) {
    throw new AppError(StatusCodes.BAD_REQUEST, "User creation failed");
  }

  // Send OTP for verification
  await sendOTPForLogin(newUser.email);

  if (newUser._id) {
    await UserCacheManage.updateUserCache(newUser._id.toString());
  }
  message = "User created successfully. Verification code sent to your email";
  return { message };
};
const getMe = async (
  id: string
): Promise<Partial<TReturnUser.getSingleUser>> => {
  console.log(id);
  if (!id) {
    throw new AppError(StatusCodes.UNAUTHORIZED, "You are not authorized");
  }

  const user = await User.findById(id).lean();
  const profile = await Profile.findOne({ userId: id }).lean();
  if (profile) {
    (user as any).profile = profile || null;
  }

  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, "User not found");
  }

  return user;
};
const addUserFields = async (userId: string, fields: Partial<TUser>) => {
  // Check if all required user fields are provided
  const requiredUserFields = ["firstName", "lastName", "dateOfBirth"];
  const allFieldsFilled = requiredUserFields.every((field) => {
    const fieldValue = fields[field as keyof typeof fields];
    return fieldValue && fieldValue.toString().trim().length > 0;
  });
  if (allFieldsFilled) {
    fields.allUserFieldsFilled = true;
  } else {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "All user fields must be filled"
    );
  }
  console.log(fields);
  const user = await User.findByIdAndUpdate(
    userId,
    { $set: fields },
    { new: true, runValidators: true }
  );

  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, "User not found");
  }

  return user;
};

const addProfileFields = async (userId: string, fields: Partial<TUser>) => {
  // Check if all required profile fields are provided
  const requiredProfileFields = [
    "location",
    "gender",
    "interestedIn",
    "height",
    "interests",
    "lookingFor",
    "ageRangeMin",
    "ageRangeMax",
    "maxDistance",
    "hometown",
    "workplace",
    "jobTitle",
    "school",
    "studyLevel",
    "religious",
    "drinkingStatus",
    "smokingStatus",
    "bio",
  ];

  const allFieldsFilled = requiredProfileFields.every((field) => {
    const fieldValue = fields[field as keyof typeof fields];
    return fieldValue && fieldValue.toString().trim().length > 0;
  });

  if (allFieldsFilled) {
    fields.allProfileFieldsFilled = true;
  } else {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "All profile fields must be filled"
    );
  }

  const profile = await Profile.findOneAndUpdate(
    { userId },
    { $set: fields },
    { new: true, upsert: true, runValidators: true }
  );
  if (!profile) {
    throw new AppError(StatusCodes.NOT_FOUND, "Profile not found");
  }
  const user = await User.findByIdAndUpdate(
    userId,
    { $set: { allProfileFieldsFilled: true } },
    { new: true }
  );
  console.log(user);
  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, "User not found");
  }
  return user;
};

const updateUserByToken = async (
  id: string,
  updateData: Partial<TReturnUser.updateUser>
): Promise<Partial<TReturnUser.updateUser>> => {
  // console.log(updateData,"updateData");
  
  const user = await User.findByIdAndUpdate(id, updateData, {
    new: true,
  });
  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, "User not found");
  }
  //remove cache
  await UserCacheManage.updateUserCache(id);

  //set new cache
  UserCacheManage.setCacheSingleUser(id, user);
  return user;
};



export const UserServices = {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  updateUserActivationStatus,
  updateUserRole,
  getMe,
  updateUserByToken,
  changeUserStatus,
  sendOTPForLogin,
  verifyOTPAndLogin,
  resendOTP,
  updateUserProfile,
  checkAllFieldsFilled,
  //mine
  addUserFields,
  addProfileFields,
};
