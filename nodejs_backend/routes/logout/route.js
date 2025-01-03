import { Router } from "express";
import Tokens from "../../models/ODM/tokens.js";
import codes from "../../utils/codes.js";
import { serve } from "../../utils/response.js";
import MESSAGES from "../../constants/messages/global.js";
import TokenUsers from "../../models/ODM/token_user.js";

const router = Router();

router.get("/", async (req, res) => {
  const token = req.token;
  try {
    await Tokens.deleteOne({ token });
    await TokenUsers.deleteOne({ token });

    serve(res, codes.OK, "Logged out successfully");
  } catch (err) {
    console.log(err);

    serve(res, codes.INTERNAL_SERVER_ERROR, MESSAGES.SERVER_ERROR);
  }
});

router.all("*", (_, res) => {
  res.sendStatus(405);
});

export const LogoutRouter = router;
