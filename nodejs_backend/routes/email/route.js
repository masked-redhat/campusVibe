import { Router } from "express";
import codes from "../../utils/codes.js";
import { serve } from "../../utils/response.js";
import User from "../../models/ORM/user.js";
import checks from "../../utils/checks.js";
import { MESSAGES as m } from "../../constants/messages/login.js";
import MESSAGES from "../../constants/messages/global.js";
import emailVerifier from "../../utils/email.js";
import EmailTokens from "../../models/ODM/email_verification_tokens.js";

const router = Router();

router.post("/verify", async (req, res) => {
  const { username, otp } = req.body;

  // check if content are not null
  {
    if (checks.isNuldefined(username) || checks.isNuldefined(otp)) {
      serve(res, codes.BAD_REQUEST, m.NO_CONTENT);
      return;
    }
  }

  try {
    let user = await User.findOne({
      attributes: ["email_verified"],
      where: { username },
    });
    if (checks.isTrue(user.email_verified)) {
      serve(res, codes.OK, m.EMAIL_VERIFIED);
      return;
    }

    let email = await EmailTokens.findOne({ username, otp });

    if (checks.isNuldefined(email)) {
      serve(res, codes.BAD_REQUEST, m.OTP_INVALID);
      return;
    }

    if (Date.now() > email.expiry) {
      serve(res, codes.BAD_REQUEST, m.OTP_TIMEOUT);
      return;
    }

    if (checks.isNuldefined(email)) {
      serve(res, codes.BAD_REQUEST, m.OTP_INVALID);
      return;
    }

    user = await User.update(
      { email_verified: true },
      { where: { username: email.username } }
    );

    if (checks.isNuldefined(user)) {
      serve(res, codes.BAD_REQUEST, m.USER_NOT_FOUND);
      return;
    }

    await EmailTokens.deleteOne({
      _id: email._id,
    });

    serve(res, codes.OK, m.EMAIL_VERIFIED);
  } catch (err) {
    console.log(err);

    serve(res, codes.INTERNAL_SERVER_ERROR, MESSAGES.SERVER_ERROR);
  }
});

router.get("/resend", async (req, res) => {
  const { username } = req.query;

  if (checks.isNuldefined(username)) {
    serve(res, codes.BAD_REQUEST, m.USER_NOT_FOUND);
    return;
  }

  try {
    const user = await User.findOne({ where: { username } });

    if (user.email_verified === true) {
      serve(res, codes.BAD_REQUEST, m.EMAIL_VERIFIED);
      return;
    }

    await EmailTokens.deleteMany({ username });

    const emailOtp = emailVerifier.generateOtp();
    const emailObj = new EmailTokens({ username, otp: emailOtp });

    const email = await emailObj.save();

    await emailVerifier.verify(
      user.email,
      "CampusVibe Application Email Verification",
      `OTP : ${email.otp}`
    );

    serve(res, codes.OK, m.EMAIL_SENT);
  } catch (err) {
    console.log(err);

    serve(res, codes.INTERNAL_SERVER_ERROR, MESSAGES.SERVER_ERROR);
  }
});

router.all("*", (_, res) => {
  res.sendStatus(405);
});

export const EmailRouter = router;
