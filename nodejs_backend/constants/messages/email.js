import { MESSAGES as loginMessage } from "./login.js";

export const MESSAGES = {
  EMAIL_ALREADY_VERIFIED:
    "This email has already been verified, why are you....?",
  OTP_INVALID: "OTP invalid",
  EXPIRED: "OTP Expired",
  USERNAME_INVALID: loginMessage.USERNAME_INVALID,
  EMAIL_VERIFIED: "Your email has been verified, you can now login at /login",
  OTP_SENT: "Otp Sent",
};
