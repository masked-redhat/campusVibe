import { Schema, model } from "mongoose";

const tokenSchema = new Schema({
  username: String,
  token: String,
  tokenType: {
    type: String,
    enum: ["access", "refresh"],
  },
});

const Tokens = model("Tokens", tokenSchema);

export default Tokens;
