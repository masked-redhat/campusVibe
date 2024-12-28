import { Router } from "express";
import authorization from "../../middlewares/auth.js";
import Tokens from "../../models/ODM/tokens.js";
import codes from "../../utils/codes.js";
import { serve } from "../../utils/response.js";
import MESSAGES from "../../constants/messages/global.js";
import checks from "../../utils/checks.js";

const router = Router();

router.get("/", async (req, res) => {
  const username = req.username;

  const tokens = authorization.getTokens(req);

  const accessToken = new Tokens({
      username,
      token: tokens.accessToken,
      tokenType: "access",
    }),
    refreshToken = new Tokens({
      username,
      token: tokens.refreshToken,
      tokenType: "refresh",
    });

  try {
    if (!checks.isNuldefined(tokens.accessToken)) await accessToken.save();
    if (!checks.isNuldefined(tokens.refreshToken)) await refreshToken.save();

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
