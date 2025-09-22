import { Model } from "mongoose";
import { USER_ROLES } from "./user.constant";

export type TUser = {
  _id?: string;
  firstName?: string;
  lastName?: string;
  email: string;
  image?: string;
  role?: keyof typeof USER_ROLES;
  phoneNumber?: string;
  fcmToken?: string;
  status?: "active" | "delete";
  verified?: boolean;
  authentication?: {
    oneTimeCode?: string;
    expireAt?: Date;
    loginAttempts?: number;
    lastLoginAttempt?: Date;
  };
  allProfileFieldsFilled: boolean;
  allUserFieldsFilled: boolean;
  pushNotification: boolean;
  lastLoginAt?: Date;
  dateOfBirth?: Date;
  createdAt?: Date;
  updatedAt?: Date;
};
export type UserModal = {
  isExistUserById(id: string): Promise<TUser | null>;
  isExistUserByEmail(email: string): Promise<TUser | null>;
  isValidOTP(email: string, otp: string): Promise<boolean>;
  generateOTP(email: string): Promise<string>;
  isOTPExpired(user: TUser): boolean;
  canAttemptLogin(user: TUser): boolean;
} & Model<TUser>;

export namespace TReturnUser {
  export type Meta = {
    page: number;
    limit: number;
    totalPage: number;
    total: number;
  };
  export type getAllUser = {
    result: TUser[];
    meta?: Meta;
  };
  export type getSingleUser = TUser;
  export type updateUser = TUser;
  export type updateUserActivationStatus = TUser;
  export type updateUserRole = TUser;
  export type deleteUser = TUser;
}
