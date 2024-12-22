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

export const MYSQL = {
  HOST: process.env.MYSQLHOST,
  USER: process.env.MYSQLUSER,
  PASS: process.env.MYSQLPASSWORD,
  DB: process.env.MYSQLDATABASE,
  DIALECT: "mysql",
};

export const MONGODB = {
  URL: process.env.MONGO_URL,
};

const env = { backend: BACKEND, mysql: MYSQL, mongodb: MONGODB };

export default env;
