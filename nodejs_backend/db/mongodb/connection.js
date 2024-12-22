import mongoose from "mongoose";
import { MONGODB } from "../../constants/env.js";
import restart from "../../utils/restart.js";

export const connectToMongo = async () => {
  try {
    await mongoose.connect(MONGODB.URL);

    console.log("Connected to Mongo!");
  } catch (err) {
    console.log(err);

    console.log("Not connected to Mongo");

    restart(connectToMongo);
  }
};
