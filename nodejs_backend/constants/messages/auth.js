import { MESSAGES as loginMessage } from "./login.js";

export const MESSAGES = {
  NO_TOKEN: "No token in the request, try to put the token in headers",
  TOKEN_INVALID: "Token is not valid anymore",
  NO_USERDATA: "No user data found in the token, token invalid",
  BLACKLISTED: loginMessage.BLACKLISTED,
};
