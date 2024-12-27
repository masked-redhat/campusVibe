import { Schema, model } from "mongoose";

const EmailTokensSchema = new Schema({
  username: String,
  token: String,
});

const EmailTokens = model("EmailTokens", EmailTokensSchema);

export default EmailTokens;
