import { Router } from "express";
import pass from "../../utils/password.js";
import usernameValidator from "../../utils/username.js";
import codes from "../../utils/codes.js";
import { serve } from "../../utils/response.js";
import User from "../../models/ORM/user.js";
import checks from "../../utils/checks.js";
import { MESSAGES as m } from "../../constants/messages/login.js";
import MESSAGES from "../../constants/messages/global.js";
import emailValidator from "deep-email-validator";
import emailVerifier from "../../utils/email.js";
import EmailTokens from "../../models/ODM/email_verification_tokens.js";
import authorization from "../../middlewares/auth.js";

const router = Router();

router.post("/", async (req, res) => {
  const { username, password } = req.body;

  // check if content are not null
  {
    if (checks.isNuldefined(username) || checks.isNuldefined(password)) {
      serve(res, codes.BAD_REQUEST, m.NO_CONTENT);
      return;
    }
  }

  let user;
  try {
    user = await User.findOne({ where: { username } });
    if (checks.isNuldefined(user)) {
      serve(res, codes.BAD_REQUEST, m.USER_NOT_FOUND);
      return;
    }

    if (pass.compare(password, user.password) === false) {
      serve(res, codes.UNAUTHORIZED, m.BAD_PASSWORD);
      return;
    }

    if (user.email_verified === false) {
      serve(res, codes.BAD_REQUEST, m.EMAIL_UNVERIFIED);
      return;
    }

    const accessToken = authorization.setupAuth({ username }, res);

    serve(res, codes.OK, m.LOGGED_IN, { accessToken });
  } catch (err) {
    console.log(err);

    serve(res, codes.INTERNAL_SERVER_ERROR, MESSAGES.SERVER_ERROR);
  }
});

router.post("/new", async (req, res) => {
  const { username, password, email } = req.body;

  // check if content are not null
  {
    if (
      checks.isNuldefined(username) ||
      checks.isNuldefined(password) ||
      checks.isNuldefined(email)
    ) {
      serve(res, codes.BAD_REQUEST, m.NO_CONTENT);
      return;
    }
  }

  // check if email is valid
  {
    const goodEmail = await emailValidator.validate(email);
    if (goodEmail.valid === false) {
      serve(res, codes.BAD_REQUEST, m.EMAIL_INVALID);
      return;
    }
  }

  // check if username and password in good format
  {
    const goodUsername = usernameValidator.validate(username);
    if (goodUsername[0] === false) {
      serve(res, codes.BAD_REQUEST, JSON.stringify(goodUsername[1]));
      return;
    }

    const goodPassword = pass.validate(password);
    if (goodPassword[0] === false) {
      serve(res, codes.BAD_REQUEST, JSON.stringify(goodPassword[1]));
      return;
    }
  }

  // check if a user with same username already exists
  {
    try {
      const user = await User.findOne({ where: { username } });
      if (!checks.isNuldefined(user)) {
        serve(res, codes.CONFLICT, m.USERNAME_CONFLICT);
        return;
      }
    } catch (err) {}
  }

  // check if a user with same email already exists
  {
    try {
      const user = await User.findOne({ where: { email } });
      if (!checks.isNuldefined(user)) {
        serve(res, codes.CONFLICT, m.EMAIL_CONFLICT);
        return;
      }
    } catch (err) {}
  }

  // hash the password
  const hashed = pass.hash(password);

  // create new user with these credentials
  const userData = {
    username,
    password: hashed,
    email,
  };
  const userObj = User.build(userData);

  // create the verification email token
  const emailToken = emailVerifier.tokenize(username);
  const emailObj = new EmailTokens({ username, token: emailToken });

  // save the email and the user and give response
  {
    let user, email;
    try {
      user = await userObj.save();
      email = await emailObj.save();

      await emailVerifier.verify(
        user.email,
        "Verify email",
        `/login/email?username=${email.username}&token=${email.token}`
      );

      serve(res, codes.CREATED, m.CREATED);
    } catch (err) {
      console.log(err);

      if (checks.isNuldefined(email)) await user.destroy();

      serve(res, codes.INTERNAL_SERVER_ERROR, MESSAGES.SERVER_ERROR);
    }
  }
});

router.get("/email", async (req, res) => {
  const { username, token } = req.query;

  // check if content are not null
  {
    if (checks.isNuldefined(username) || checks.isNuldefined(token)) {
      serve(res, codes.BAD_REQUEST, m.NO_CONTENT);
      return;
    }
  }

  try {
    let email = await EmailTokens.findOne({ username, token });

    if (checks.isNuldefined(email)) {
      serve(res, codes.BAD_REQUEST, m.TOKEN_INVALID);
      return;
    }

    let user = await User.update(
      { email_verified: true },
      { where: { username: email.username } }
    );

    console.log(user);

    if (checks.isNuldefined(user)) {
      serve(res, codes.BAD_REQUEST, m.USER_NOT_FOUND);
      return;
    }

    await EmailTokens.deleteOne({
      _id: email.id,
    });

    serve(res, codes.OK, m.EMAIL_VERIFIED);
  } catch (err) {
    console.log(err);

    serve(res, codes.INTERNAL_SERVER_ERROR, MESSAGES.SERVER_ERROR);
  }
});

router.get("/email/resend", async (req, res) => {
  const { username } = req.query;

  try {
    const user = await User.findOne({ where: { username } });

    if (user.email_verified === true) {
      serve(res, codes.BAD_REQUEST, m.EMAIL_VERIFIED);
      return;
    }

    await EmailTokens.deleteMany({ username });

    const emailToken = emailVerifier.tokenize(username);
    const emailObj = new EmailTokens({ username, token: emailToken });

    const email = await emailObj.save();

    await emailVerifier.verify(
      user.email,
      "Verify email",
      `/login/email?username=${email.username}&token=${email.token}`
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

export const LoginRouter = router;
