import express from "express";
import env from "./constants/env.js";
import { connectToMysql } from "./db/sql/connection.js";
import { connectToMongo } from "./db/mongodb/connection.js";

// Define application params
const app = express();
const port = env.backend.PORT;

// Connect databases
await connectToMysql();
await connectToMongo();

app.get("/", (_, res) => {
  res.send("Let's create the application");
});

app.listen(port, () => {
  console.log(`Application at http://localhost:${port}`);
});
