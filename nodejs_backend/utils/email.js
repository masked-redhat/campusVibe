import nodemailer from "nodemailer";
import { NODEMAILER } from "../constants/env.js";
import google from "googleapis";

const OAuth2 = google.Auth.OAuth2Client;

const oauth2Client = new OAuth2(
  NODEMAILER.CLIENT.ID,
  NODEMAILER.CLIENT.SECRET,
  NODEMAILER.URL
);

oauth2Client.setCredentials({
  refresh_token: NODEMAILER.TOKEN.REFRESH,
});

const createTransporter = async () => {
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
    text,
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

const createToken = () => {
  return Math.floor(Math.random() * 1000000)
    .toString()
    .padStart(6, "0");
};

const emailVerifier = {
  verify: sendVerificationEmail,
  generateOtp: createToken,
};

export default emailVerifier;
