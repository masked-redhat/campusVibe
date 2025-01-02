import { Schema, model } from "mongoose";
import { Expiry } from "../../constants/db.js";

const EmailTokensSchema = new Schema({
  username: String,
  otp: Number,
  expiry: {
    type: Date,
    default: Date.now() + Expiry.EmailTokens,
    required: true,
  },
});

const EmailTokens = model("EmailTokens", EmailTokensSchema);

export default EmailTokens;
