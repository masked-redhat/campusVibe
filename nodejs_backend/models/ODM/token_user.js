import { Schema, model } from "mongoose";

const tokenSchema = new Schema({
  token: { type: String, required: true },
  userData: {
    type: Object,
    required: true,
  },
});

const TokenUsers = model("TokenUsers", tokenSchema);

export default TokenUsers;
