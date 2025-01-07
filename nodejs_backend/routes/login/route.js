import { Router } from "express";
import Password from "../../utils/password.js";
import codes from "../../utils/codes.js";
import User from "../../models/ORM/user.js";
import checks from "../../utils/checks.js";
import { MESSAGES as m } from "../../constants/messages/login.js";
import Email from "../../utils/email.js";
import EmailTokens from "../../models/ODM/email_verification_tokens.js";
import authorization from "../../middlewares/auth.js";
import { getUserData } from "../../db/commands/userdata.js";
import transaction from "../../db/sql/transaction.js";
import Username from "../../utils/username.js";
import { Op } from "sequelize";

const router = Router();

router.post("/", async (req, res) => {
  const { username, password } = req.body;

  // check if parameters are null
  if (checks.isAnyValueNull([username, password])) return res.noParams();

  try {
    const user = await User.findOne({
      attributes: ["id", "password", "email_verified", "blacklisted"],
      where: { username },
    });

    // if no user associated with that username
    if (checks.isNuldefined(user))
      return res.failure(codes.BAD_REQUEST, m.USERNAME_INVALID);

    // if password don't match
    if (Password.compare(password, user.password) === false)
      return res.failure(codes.UNAUTHORIZED, m.PASSWORD_WRONG);

    // if email is not verified
    if (!checks.isTrue(user.email_verified))
      return res.failure(codes.UNAUTHORIZED, m.EMAIL_UNVERIFIED);

    // if user is blacklisted
    if (user.blacklisted === true)
      return res.failure(codes.FORBIDDEN, m.BLACKLISTED);

    // get the user data
    const userData = await getUserData(username);

    const token = await authorization.setupAuth(userData, res);

    if (!checks.isNuldefined(token)) res.ok(m.LOGGED_IN, { token });
  } catch (err) {
    console.log(err);

    res.serverError();
  }
});

router.post("/new", async (req, res) => {
  const { username, password, email } = req.body;

  // check if content are not null
  if (checks.isAnyValueNull([username, password, email])) return res.noParams();

  // check if email is valid
  const validEmail = await Email.validate(email)?.valid;
  if (!checks.isTrue(validEmail))
    return res.failure(codes.BAD_REQUEST, m.EMAIL_INVALID);

  // check if username and password in good format
  {
    const checkUsername = Username.validate(username);
    if (!checks.isTrue(checkUsername.valid))
      return res.failure(codes.BAD_REQUEST, checkUsername.message);

    const checkPassword = Password.validate(password);
    if (!checks.isTrue(checkPassword.valid))
      return res.failure(codes.BAD_REQUEST, checkPassword.message);
  }

  // check if a user with same username or email already exists
  try {
    const user = await User.findOne({
      where: { [Op.or]: [{ username }, { email }] },
    });
    if (!checks.isNuldefined(user))
      return res.failure(
        codes.CONFLICT,
        user.email === email ? m.EMAIL_CONFLICT : m.USERNAME_CONFLICT
      );
  } catch (err) {
    return res.serverError();
  }

  // hash the password
  const hashed = Password.hash(password);

  // create new user with given credentials
  const userObj = User.build({ username, password: hashed, email });

  // generate otp and email obj
  const otp = Email.generateOtp();
  const emailTokenObj = new EmailTokens({ username, otp });

  let emailToken;
  const t = await transaction();
  try {
    // save user and email
    await userObj.save({ transaction: t });
    emailToken = await emailTokenObj.save();

    await Email.sendOtp(email, otp);

    await t.commit();

    res.ok(m.CREATED);
  } catch (err) {
    console.log(err);
    await t.rollback();

    // delete the created token silently
    EmailTokens.deleteOne(emailToken);

    res.serverError();
  }
});

router.all("*", (_, res) => {
  res.noMethod();
});

export const LoginRouter = router;
