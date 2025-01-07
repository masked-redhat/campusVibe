import { Router } from "express";
import Tokens from "../../models/ODM/tokens.js";
import { MESSAGES as m } from "../../constants/messages/logout.js";
import checks from "../../utils/checks.js";

const router = Router();

router.get("/", async (req, res) => {
  const token = req.token;

  if (checks.isAnyValueNull([token])) return res.noParams();

  try {
    await Tokens.deleteOne({ token });

    res.ok(m.SUCCESS);
  } catch (err) {
    console.log(err);

    res.serverError();
  }
});

export const LogoutRouter = router;
