// Import Modules
import express from "express";
import env from "./constants/env.js";
import { connectToSqlDatabase } from "./db/sql/connection.js";
import { connectToMongo } from "./db/mongodb/connection.js";
import Routes from "./routes/router.js";
import cookieParser from "cookie-parser";
import authorization from "./middlewares/auth.js";
const r = Routes,
  auth = authorization.validateUser;

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
app.use("/logout", auth, r.LogoutRouter);
app.use("/posts", auth, r.PostsRouter);
app.use("/news", auth, r.NewsRouter);
app.use("/jobs", auth, r.JobsRouter);
app.use("/forums", auth, r.ForumsRouter);
app.use("/comments", auth, r.CommentsRouter);
app.use("/replies", auth, r.RepliesRouter);
app.use("/answers", auth, r.AnswersRouter);
app.use("/feed", auth, r.FeedRouter);
app.use("/articles", auth, r.ArticlesRouter);
app.use("/profile", auth, r.ProfileRouter);
app.use("/feedback", auth, r.FeedbackRouter);

// Start the application
app.listen(port, () => {
  console.log(`Application at ${env.url}`);
});
