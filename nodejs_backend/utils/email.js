import nodemailer from "nodemailer";
import env, { BACKEND, NODEMAILER } from "../constants/env.js";
import bcryptjs from "bcryptjs";
import google from "googleapis";

const OAuth2 = google.Auth.OAuth2Client;

const createTransporter = async () => {
  const oauth2Client = new OAuth2(
    NODEMAILER.CLIENT.ID,
    NODEMAILER.CLIENT.SECRET,
    NODEMAILER.URL
  );

  oauth2Client.setCredentials({
    refresh_token: NODEMAILER.TOKEN.REFRESH,
  });

  const accessToken = await new Promise((resolve, reject) => {
    oauth2Client.getAccessToken((err, token) => {
      if (err) {
        reject("Failed to create access token :(");
      }
      resolve(token);
    });
  });

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      type: "OAuth2",
      user: NODEMAILER.EMAIL,
      accessToken,
      clientId: NODEMAILER.CLIENT.ID,
      clientSecret: NODEMAILER.CLIENT.SECRET,
      refreshToken: NODEMAILER.TOKEN.REFRESH,
    },
  });

  return transporter;
};

const sendVerificationEmail = async (
  recipient,
  subject = "Verify Email",
  text = ""
) => {
  const mailOptions = {
    from: NODEMAILER.EMAIL,
    to: recipient,
    subject: subject,
    text: `Click on this link to verify your email: ${env.url}${text}`,
  };

  const transporter = await createTransporter();

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error("Error sending email: ", error);
    } else {
      console.log("Email sent: ", info.response);
    }
  });
};

const createToken = (username) => {
  const token = bcryptjs.hashSync(
    BACKEND.SECRET.EMAIL + username,
    BACKEND.PASSWORD.SALT
  );

  return token;
};

const emailVerifier = {
  verify: sendVerificationEmail,
  tokenize: createToken,
};

export default emailVerifier;
