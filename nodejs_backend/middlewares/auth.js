// JWT token creation and validation

// User Auth setup and Validation

import auth from "../controllers/jwt_auth.js";
import checks from "../utils/checks.js";
import { COOKIE } from "../constants/auth.js";
import User from "../models/ORM/user.js";
import codes from "../utils/codes.js";
import { MESSAGES as m } from "../constants/messages/auth.js";

const REFRESHTOKEN = "refreshToken",
  USERNAME = "username";

const setupAuth = (userData, res) => {
  const tokenizer = new auth.JwtTokenizer(userData);
  const tokens = tokenizer.getTokens();

  // set refresh token in cookies
  res.cookie(REFRESHTOKEN, tokens.refreshToken, {
    httpOnly: COOKIE.HTTPONLY,
    secure: COOKIE.SECURE,
    maxAge: COOKIE.MAXAGE,
  });

  return tokens.refreshToken;
};

const getTokensFromRequest = (req) => {
  const tokens = {
    accessToken: getAccessToken(req),
    refreshToken: getRefreshToken(req),
  };

  return tokens;
};

const getAccessToken = (req) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (checks.isNuldefined(token)) return null;
  return token;
};

const getRefreshToken = (req) => {
  const cookies = req.cookies;
  const token = cookies[REFRESHTOKEN];

  if (checks.isNuldefined(token)) return null;
  return token;
};

const verifyUser = async (entity) => {
  if (checks.isNuldefined(entity)) return false;

  const user = await User.findOne({ where: entity });
  if (checks.isNuldefined(user)) return false;
  if (user.blacklisted === true) return false;
  return true;
};

const validateUser = async (req, res, next) => {
  const tokens = getTokensFromRequest(req);

  // first check access token
  const validator = new auth.JwtValidator(tokens.accessToken, verifyUser);
  await validator.validate();

  if (validator.getVerificationStatus() === true) {
    req.USERNAME = validator.getEntityInfo()[USERNAME];
    next();
  }

  // then check the refresh token
  validator.token = tokens.refreshToken;
  await validator.validate();

  if (validator.getVerificationStatus() === true) {
    // set the access token
    const accessToken = new auth.JwtTokenizer({
      USERNAME: validator.getEntityInfo()[USERNAME],
    }).createAccessToken();

    req.accessToken = accessToken;
    req.USERNAME = validator.getEntityInfo()[USERNAME];
    next();
  }

  res
    .status(validator.getStatusCode())
    .json({ message: validator.getMessage() });
};

const authorization = {
  setupAuth,
  validateUser,
};

export default authorization;
