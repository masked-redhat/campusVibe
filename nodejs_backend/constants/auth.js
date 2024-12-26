import { BACKEND } from "./env.js";

const JWT = {
  SECRET: BACKEND.SECRET.TOKEN,
  EXPIRY: {
    ACCESSTOKEN: 24 * 60 * 60 * 1000,
    REFRESHTOKEN: 7 * 24 * 60 * 60 * 1000,
  },
};

export const TOKEN = JWT;

export const COOKIE = {
  HTTPONLY: true,
  SECURE: true,
  MAXAGE: JWT.EXPIRY.REFRESHTOKEN,
};

const constantAuth = {
  token: TOKEN,
  cookies: COOKIE,
};

export default constantAuth;
