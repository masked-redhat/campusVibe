// JWT token creation and validation

// User Auth setup and Validation

import auth from "../controllers/jwt_auth.js";
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
import { getUserData } from "../db/commands/userdata.js";

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
  let token;
  do {
    token = generateRandomToken();
  } while (!checks.isNuldefined(await Tokens.findOne({ token })));

  // generate access and refresh tokens
  const tokenizer = new auth.JwtTokenizer(userData);
  const jwtTokens = tokenizer.getTokens();

  // create token
  try {
    await Tokens.create({ token, jwtTokens });
  } catch (err) {
    console.log(err);

    serve(res, codes.INTERNAL_SERVER_ERROR, MESSAGES.SERVER_ERROR);
    return;
  }

  token = userData.username + "~" + token;

  // set token in cookies
  res.cookie(TOKEN._, token, {
    httpOnly: COOKIE.HTTPONLY,
    secure: COOKIE.SECURE,
    maxAge: COOKIE.MAXAGE.REFRESH,
  });

  return token;
};

const verifyFunc = async (ent) => {
  try {
    await User.findOne({ where: { username: ent.username } });
  } catch (err) {
    console.log(err);
    return false;
  }
  return true;
};

const verifyJwtTokens = async (token, jwtTokens) => {
  const validator = new auth.JwtValidator(jwtTokens.accessToken, verifyFunc);

  await validator.validate();

  if (validator.getVerificationStatus() === true)
    return [true, validator.getEntityInfo()];

  validator.token = jwtTokens.refreshToken;
  await validator.validate();

  if (validator.getVerificationStatus() === false) return [false, null];

  const username = validator.getEntityInfo().username;

  const userData = await getUserData(username);

  const newTokens = new auth.JwtTokenizer(userData).getTokens();

  await Tokens.updateOne(
    { token },
    { jwtTokens: newTokens, expiry: Date.now() + COOKIE.MAXAGE.REFRESH }
  );

  return [true, userData];
};

const getUserDataFromToken = async (req, res) => {
  const authHeader = req.headers["authorization"];
  let token = authHeader && authHeader.split(" ")[1];

  if (checks.isNuldefined(token)) token = req.cookies[TOKEN._];

  if (checks.isNuldefined(token)) {
    serve(res, codes.BAD_REQUEST, m.NO_TOKEN);
    return;
  }

  let username;
  try {
    [username, token] = token.split("~");
  } catch (err) {
    console.log(err);

    serve(res, codes.FORBIDDEN, m.TOKEN_INVALID);
    return;
  }

  req.token = token;

  try {
    const tokenObj = await Tokens.findOne({ token }).select("jwtTokens expiry");

    if (checks.isNuldefined(tokenObj) || Date.now() > tokenObj.expiry) {
      serve(res, codes.BAD_REQUEST, m.TOKEN_INVALID);
      return;
    }

    const [verified, userData] = await verifyJwtTokens(
      token,
      tokenObj.jwtTokens
    );

    if (verified === false) {
      serve(res, codes.FORBIDDEN, m.TOKEN_INVALID);
      return;
    }

    if (checks.isNuldefined(userData)) {
      serve(res, codes.BAD_REQUEST, m.NO_USERDATA);
      return;
    }

    if (username !== userData.username) {
      serve(res, codes.BAD_REQUEST, m.TOKEN_INVALID);
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
      return false;
    }

    return true;
  } catch (err) {
    console.log(err);

    serve(res, codes.INTERNAL_SERVER_ERROR, MESSAGES.SERVER_ERROR);
    return false;
  }
};

const validateUser = async (req, res, next) => {
  const userData = await getUserDataFromToken(req, res);
  if (checks.isNuldefined(userData)) return;

  const verified = await verifyUser(userData, res);

  if (verified === true) {
    req.user = userData;
    next();
    return;
  }
};

const authorization = {
  setupAuth,
  validateUser,
  verifyUser,
};

export default authorization;
