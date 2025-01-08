// JWT token creation and validation

// User Auth setup and Validation

import auth from "../controllers/jwt_auth.js";
import checks from "../utils/checks.js";
import { COOKIE } from "../constants/auth.js";
import User from "../models/ORM/user.js";
import Tokens from "../models/ODM/tokens.js";
import codes from "../utils/codes.js";
import { MESSAGES as m } from "../constants/messages/auth.js";
import crypto from "crypto";
import { getUserData } from "../db/commands/userdata.js";

// token's string
const TOKEN = {
  _: "token",
  REFRESH: "refreshToken",
  ACCESS: "accessToken",
};
// characters to be used in generating token
const CHARS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789$%^&!@#*";

// generates a random token on length 'length'
const generateRandomToken = (length = 32) => {
  return crypto.randomBytes(length).toString("base64url");
};

// TODO: fingerprint then hash the token, for even better authentication
const setupAuth = async (userData, res) => {
  // find a token that is not already given
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

    return res.serverError();
  }

  // set token in cookies
  res.cookie(TOKEN._, token, {
    httpOnly: COOKIE.HTTPONLY,
    secure: COOKIE.SECURE,
    maxAge: COOKIE.MAXAGE.REFRESH,
  });

  return token;
};

// verification function for JWT Validator
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
  // check access token first
  const validator = new auth.JwtValidator(jwtTokens.accessToken, verifyFunc);

  await validator.validate();

  // if valid, then get the entity info from the token
  if (validator.getVerificationStatus() === true)
    return [true, validator.getEntityInfo()];

  // check refresh token then
  validator.token = jwtTokens.refreshToken;
  await validator.validate();

  // if not valid, then verification failed
  if (validator.getVerificationStatus() === false) return [false, null];

  // if valid, then create new access token
  const username = validator.getEntityInfo().username;

  const userData = await getUserData(username);

  // FIX: we are throwing away the refresh token, think of a way
  // to not waste that token, such that it can be reused
  const newTokens = new auth.JwtTokenizer(userData).getTokens();

  // slide the expiry window for the random token
  await Tokens.updateOne(
    { token },
    { jwtTokens: newTokens, expiry: Date.now() + COOKIE.MAXAGE.REFRESH }
  );

  return [true, userData];
};

const getUserDataFromToken = async (req, res) => {
  // try getting the token from headers
  const authHeader = req.headers["authorization"];
  let token = authHeader && authHeader.split(" ")[1];

  // if not in authorization, then try in cookies
  if (checks.isNuldefined(token)) token = req.cookies[TOKEN._];

  if (checks.isNuldefined(token))
    return res.failure(codes.BAD_REQUEST, m.NO_TOKEN);

  // set the request.token as token
  req.token = token;

  try {
    // get the token object with jwtTokens and expiry fields
    const tokenObj = await Tokens.findOne({ token }).select("jwtTokens expiry");

    if (checks.isNuldefined(tokenObj) || Date.now() > tokenObj.expiry)
      return res.failure(codes.BAD_REQUEST, m.TOKEN_INVALID);

    // verify jwtTokens
    const [verified, userData] = await verifyJwtTokens(
      token,
      tokenObj.jwtTokens
    );

    // if jwt tokens not verified
    if (verified === false) return res.forbidden(m.TOKEN_INVALID);

    // if no user data in token, somehow
    if (checks.isNuldefined(userData))
      return res.failure(codes.BAD_REQUEST, m.NO_USERDATA);

    return userData;
  } catch (err) {
    console.log(err);

    res.serverError();
    return;
  }
};

// verify if the user data is correct and valid and in database
const verifyUser = async (userData, res) => {
  try {
    // find the user
    const user = await User.findOne({
      attributes: ["email_verified", "blacklisted"],
      where: { id: userData.id, username: userData.username },
    });

    // message on the basis of checks below
    let verified = false,
      message;
    if (checks.isNuldefined(user)) message = m.TOKEN_INVALID;
    if (user.blacklisted === true) message = m.BLACKLISTED;
    else verified = true;

    if (verified === false) {
      res.forbidden(message);
      return false;
    }

    return true;
  } catch (err) {
    console.log(err);

    res.serverError();
    return false;
  }
};

const validateUser = async (req, res, next) => {
  // get user data from the request token
  const userData = await getUserDataFromToken(req, res);

  // if no user data then return, the response was already sent if no user data
  if (checks.isNuldefined(userData)) return;

  // check if the user data is valid and in database
  const verified = await verifyUser(userData, res);

  // if valid then next, else response was already sent
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
