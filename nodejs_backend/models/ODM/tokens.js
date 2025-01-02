import { Schema, model } from "mongoose";
import { COOKIE } from "../../constants/auth.js";

const tokenSchema = new Schema({
  token: { type: String, required: true },
  userData: {
    type: Object,
    required: true,
  },
  expiry: {
    type: Date,
    default: Date.now() + COOKIE.MAXAGE.REFRESH,
    required: true,
  },
});

const Tokens = model("Tokens", tokenSchema);

export default Tokens;
