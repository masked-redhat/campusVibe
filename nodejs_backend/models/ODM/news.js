import { Schema, model } from "mongoose";

const NewsSchema = new Schema(
  {
    title: {
      type: String,
      trim: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    images: [String],
  },
  {
    timestamps: true,
  }
);

const News = model("News", NewsSchema);

export default News;
