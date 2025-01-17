import { LoginRouter } from "./login/route.js";
import { LogoutRouter } from "./logout/route.js";
import { PostsRouter } from "./posts/route.js";
import { NewsRouter } from "./news/route.js";
import { JobsRouter } from "./jobs/route.js";
import { ForumsRouter } from "./forums/route.js";
import { AnswersRouter } from "./answers/route.js";
import { FeedRouter } from "./feed/route.js";
import { ArticlesRouter } from "./articles/route.js";
import { ProfileRouter } from "./profile/route.js";
import { FeedbackRouter } from "./feedback/route.js";
import { FriendRouter } from "./friends/route.js";
import { EmailRouter } from "./email/route.js";
import { UploadRouter } from "./upload/route.js";

const Router = {
  LoginRouter,
  LogoutRouter,
  EmailRouter,
  PostsRouter,
  FriendRouter,
  NewsRouter,
  JobsRouter,
  ForumsRouter,
  AnswersRouter,
  FeedRouter,
  ArticlesRouter,
  ProfileRouter,
  FeedbackRouter,
  UploadRouter,
};

export default Router;
