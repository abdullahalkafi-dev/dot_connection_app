export type TVerifyEmail = {
  email: string;
  oneTimeCode: string;
};

export type TLoginData = {
  email: string;
  password: string;
  phnNum: string;
  loginStatus?: string;
};



export type TAuthResetPassword = {
  newPassword: string;
  confirmPassword: string;
};

export type TChangePassword = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};
