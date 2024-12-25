// Import Modules
import express from "express";
import env from "./constants/env.js";
import { connectToSqlDatabase } from "./db/sql/connection.js";
import { connectToMongo } from "./db/mongodb/connection.js";
import Routes from "./routes/router.js";
const r = Routes;

// Define application params
const app = express();
const port = env.backend.PORT;

// Connect databases
await connectToSqlDatabase();
await connectToMongo();

// Routes
app.use("/login", r.LoginRouter);
app.use("/logout", r.LogoutRouter);
app.use("/posts", r.PostsRouter);
app.use("/news", r.NewsRouter);
app.use("/jobs", r.JobsRouter);
app.use("/forums", r.ForumsRouter);
app.use("/comments", r.CommentsRouter);
app.use("/replies", r.RepliesRouter);
app.use("/answers", r.AnswersRouter);
app.use("/feed", r.FeedRouter);
app.use("/articles", r.ArticlesRouter);
app.use("/profile", r.ProfileRouter);
app.use("/feedback", r.FeedbackRouter);

// Start the application
app.listen(port, () => {
  console.log(`Application at http://localhost:${port}`);
});
