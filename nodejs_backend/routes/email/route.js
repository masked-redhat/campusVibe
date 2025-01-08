import { Router } from "express";
import codes from "../../utils/codes.js";
import User from "../../models/ORM/user.js";
import checks from "../../utils/checks.js";
import { MESSAGES as m } from "../../constants/messages/email.js";
import Email from "../../utils/email.js";
import EmailTokens from "../../models/ODM/email_verification_tokens.js";
import { ValidationError } from "sequelize";
import { Error } from "mongoose";

const router = Router();

router.post("/verify", async (req, res) => {
  // get username and otp from the reques body
  const { username, otp } = req.body;

  // check if content are not null
  if (checks.isAnyValueNull([username, otp])) return res.noParams();

  try {
    const userEmailVerified = await User.findOne({
      attributes: ["email_verified"],
      where: { username },
    });

    if (checks.isTrue(userEmailVerified.email_verified))
      return res.failure(codes.BAD_REQUEST, m.EMAIL_ALREADY_VERIFIED);

    // find the email otp from the database and match it
    let email = await EmailTokens.findOne({ username, otp });

    // if no database match
    if (checks.isNuldefined(email))
      return res.failure(codes.BAD_REQUEST, m.OTP_INVALID);

    if (Date.now() > email.expiry)
      return res.failure(codes.clientError.GONE, m.EXPIRED);

    const [user] = await User.update(
      { email_verified: true },
      { where: { username: email.username } }
    );

    if (user === 0) return res.failure(codes.BAD_REQUEST, m.USERNAME_INVALID);

    // delete the otp
    await EmailTokens.deleteOne({
      _id: email._id,
    });

    res.ok(m.EMAIL_VERIFIED);
  } catch (err) {
    console.log(err);

    if (err instanceof ValidationError) return res.invalidParams();

    res.serverError();
  }
});

router.get("/resend", async (req, res) => {
  // get username from request query
  const { username } = req.query;

  if (checks.isNuldefined(username)) return res.noParams();

  try {
    const user = await User.findOne({
      attributes: ["email_verified", "email"],
      where: { username },
    });

    if (checks.isTrue(user.email_verified))
      return res.failure(codes.BAD_REQUEST, m.EMAIL_ALREADY_VERIFIED);

    // first delete all the otps issued for that username
    await EmailTokens.deleteMany({ username });

    const emailOtp = Email.generateOtp();
    new EmailTokens.create({ username, otp: emailOtp });

    await Email.sendOtp(user.email, otp);

    res.ok(m.OTP_SENT);
  } catch (err) {
    console.log(err);

    if (err instanceof (ValidationError || Error.ValidationError))
      return res.invalidParams();

    res.serverError();
  }
});

export const EmailRouter = router;
