import dotenv from "dotenv";
dotenv.config();

export const BACKEND = {
  HOST: process.env.HOST,
  PORT: process.env.PORT,
  SECRET: {
    TOKEN: process.env.TOKENSECRETKEY,
    EMAIL: process.env.EMAILSECRET,
  },
  PASSWORD: {
    SALT: 10,
  },
  EMAIL: {
    SALT: "HOLA MY FRIEND",
  },
  PUBLIC: {
    LOCATION: {
      _: process.env.PUBLICDEST, // /public
      IMAGES: process.env.IMAGEUPLOADDEST, // /public/images
    },
  },
};

const MYSQL = {
  HOST: process.env.MYSQLHOST,
  USER: process.env.MYSQLUSER,
  PASS: process.env.MYSQLPASSWORD,
  DB: process.env.MYSQLDATABASE,
  DIALECT: "mysql",
};

const POSTGRESQL = {
  HOST: process.env.POSTGRESERVER,
  USER: process.env.POSTGREUSERNAME,
  PASS: process.env.POSTGREPASSWORD,
  DB: process.env.POSTGREDATABASE,
  DIALECT: "postgres",
};

export const DATABASE = POSTGRESQL;

export const MONGODB = {
  URL: process.env.MONGO_URL,
};

export const NODEMAILER = {
  // TODO: Add Google OAuth Credentials for access.
  EMAIL: process.env.GOOGLE_EMAIL,
  TOKEN: {
    REFRESH: process.env.GOOGLE_REFRESH_TOKEN,
  },
  CLIENT: {
    ID: process.env.GOOGLE_CLIENT_ID,
    SECRET: process.env.GOOGLE_CLIENT_SECRET,
  },
  URL: "https://developers.google.com/oauthplayground",
};

export const APPURL = `http://${BACKEND.HOST}:${BACKEND.PORT}`;

const env = {
  backend: BACKEND,
  db: DATABASE,
  mongodb: MONGODB,
  nodemailer: NODEMAILER,
  url: APPURL,
};

export default env;
