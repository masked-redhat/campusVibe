const MESSAGES = {
  NO_TOKEN: "No token found in the request",
  VERIFICATION_FAILED:
    "Token is not verified, possible cause is either the user is blacklisted or the signature is invalid. Try logging out and see if it works, if not then user is blacklisted",
  TOKEN_INVALID: "Token is not valid anymore",
  OK: "Token Validation and Verification successful",
};

export default MESSAGES;
