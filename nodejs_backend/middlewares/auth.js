// JWT token creation and validation

// User Auth setup and Validation

import checks from "../utils/checks.js";
import { COOKIE } from "../constants/auth.js";
import User from "../models/ORM/user.js";
import Tokens from "../models/ODM/tokens.js";
import { serve } from "../utils/response.js";
import codes from "../utils/codes.js";
import { MESSAGES as loginM } from "../constants/messages/login.js";
import { MESSAGES as tokenM } from "../constants/messages/jwt_auth.js";
import MESSAGES from "../constants/messages/global.js";
import crypto from "crypto";

const m = { ...loginM, ...tokenM };

const TOKEN = {
  _: "token",
  REFRESH: "refreshToken",
  ACCESS: "accessToken",
};

const CHARS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789$%^&!@#*";

const generateRandomToken = (length = 32) => {
  let result = "";
  for (let i = 0; i < length; i++) {
    const randomByte = crypto.randomBytes(1); // Generate a single random byte
    const index = randomByte[0] % CHARS.length; // Use modulo to map to the character set
    result += CHARS[index];
  }
  return result;
};

const setupAuth = async (userData, res) => {
  const token = generateRandomToken();

  // create token
  try {
    await Tokens.create({ token, userData });
  } catch (err) {
    console.log(err);

    serve(res, codes.INTERNAL_SERVER_ERROR, MESSAGES.SERVER_ERROR);
    return;
  }

  // set token in cookies
  res.cookie(TOKEN._, token, {
    httpOnly: COOKIE.HTTPONLY,
    secure: COOKIE.SECURE,
    maxAge: COOKIE.MAXAGE.REFRESH,
  });

  return token;
};

const getUserData = async (req, res) => {
  const token = req.cookies[TOKEN._];

  if (checks.isNuldefined(token)) {
    serve(res, codes.BAD_REQUEST, m.NO_TOKEN);
    return;
  }

  try {
    const tokenObj = await Tokens.findOne({ token });

    if (checks.isNuldefined(tokenObj) || Date.now() > tokenObj.expiry) {
      serve(res, codes.BAD_REQUEST, m.TOKEN_INVALID);
      return;
    }

    const userData = tokenObj.userData;
    if (checks.isNuldefined(userData)) {
      serve(res, codes.BAD_REQUEST, m.NO_USERDATA);
      return;
    }

    return userData;
  } catch (err) {
    console.log(err);

    serve(res, codes.INTERNAL_SERVER_ERROR, MESSAGES.SERVER_ERROR);
    return;
  }
};

const verifyUser = async (userData, res) => {
  try {
    const user = await User.findOne({
      attributes: ["email_verified", "blacklisted"],
      where: { id: userData.id, username: userData.username },
    });

    let verified = false,
      message;
    if (checks.isNuldefined(user)) message = m.TOKEN_INVALID;
    if (user.email_verified === false) message = m.EMAIL_UNVERIFIED;
    if (user.blacklisted === true) message = m.BLACKLISTED;
    else verified = true;

    if (verified === false) {
      serve(res, codes.FORBIDDEN, message);
      return;
    }

    return true;
  } catch (err) {
    console.log(err);

    serve(res, codes.INTERNAL_SERVER_ERROR, MESSAGES.SERVER_ERROR);
    return;
  }
};

const validateUser = async (req, res, next) => {
  const userData = await getUserData(req, res);
  const verified = await verifyUser(userData, res);

  if (verified === true) {
    req.user = userData;
    next();
    return;
  }

  serve(res, codes.FORBIDDEN, m.TOKEN_INVALID);
};

const authorization = {
  setupAuth,
  validateUser,
  verifyUser,
};

export default authorization;
