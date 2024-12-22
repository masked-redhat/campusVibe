import nodemailer from "nodemailer";
import { NODEMAILER } from "../constants/env.js";

const transporter = nodemailer.createTransport({
  service: "Gmail",
  host: "smtp.gmail.com",
  port: NODEMAILER.GOOGLE.PORT,
  secure: true,
  auth: {
    user: NODEMAILER.GOOGLE.EMAIL,
    pass: NODEMAILER.GOOGLE.PASS,
  },
});

const sendVerificationEmail = (
  recipient,
  subject = "Verify Email",
  text = "Click on this link to verify your email"
) => {
  const mailOptions = {
    from: NODEMAILER.GOOGLE.EMAIL,
    to: recipient,
    subject: subject,
    text: text,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error("Error sending email: ", error);
    } else {
      console.log("Email sent: ", info.response);
    }
  });
};

const email = {
  verify: sendVerificationEmail,
};

export default email;
