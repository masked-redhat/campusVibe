// Import Modules
import express from "express";
import env from "./constants/env.js";
import { connectToSqlDatabase } from "./db/sql/connection.js";
import { connectToMongo } from "./db/mongodb/connection.js";
import Routes from "./routes/router.js";
import cookieParser from "cookie-parser";
import authorization from "./middlewares/auth.js";
const r = Routes,
  validate = authorization.validateUser;

// Define application params
const app = express();
const port = env.backend.PORT;

// Connect databases
await connectToSqlDatabase();
await connectToMongo();

// Global Middlewares
app.use(express.json());
app.use(cookieParser());

// Routes
app.use("/login", r.LoginRouter);
app.use("/logout", validate, r.LogoutRouter);
app.use("/posts", validate, r.PostsRouter);
app.use("/news", validate, r.NewsRouter);
app.use("/jobs", validate, r.JobsRouter);
app.use("/forums", validate, r.ForumsRouter);
app.use("/comments", validate, r.CommentsRouter);
app.use("/replies", validate, r.RepliesRouter);
app.use("/answers", validate, r.AnswersRouter);
app.use("/feed", validate, r.FeedRouter);
app.use("/articles", validate, r.ArticlesRouter);
app.use("/profile", validate, r.ProfileRouter);
app.use("/feedback", validate, r.FeedbackRouter);

// Start the application
app.listen(port, () => {
  console.log(`Application at http://localhost:${port}`);
});
