import dotenv from "dotenv";
dotenv.config();

export const BACKEND = {
  PORT: process.env.PORT,
  SECRET: {
    TOKEN: process.env.TOKENSECRETKEY,
  },
  PASSWORD: {
    SALT: 10,
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
};

const env = {
  backend: BACKEND,
  db: DATABASE,
  mongodb: MONGODB,
  nodemailer: NODEMAILER,
};

export default env;
