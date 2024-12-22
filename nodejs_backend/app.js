import express from "express";
import env from "./constants/env.js";

const app = express();
const port = env.backend.PORT;

app.get("/", (_, res) => {
  res.send("Let's create the application");
});

app.listen(port, () => {
  console.log(`Application at http://localhost:${port}`);
});
