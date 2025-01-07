import { Schema, model } from "mongoose";

const FeedbackSchema = new Schema({
  userId: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  otherDetails: Object,
  images: [String]
});

const Feedbacks = model("Feedbacks", FeedbackSchema);

export default Feedbacks;
