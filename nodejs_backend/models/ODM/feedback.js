import { Schema, model } from "mongoose";

export const STATUS = {
  PENDING: "Pending",
  RESOLVING: "Resolving",
  RESOLVED: "Resolved",
  REJECTED: "Rejected",
};

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
  images: [String],
  status: {
    type: String,
    enum: [STATUS.PENDING, STATUS.RESOLVING, STATUS.RESOLVED, STATUS.REJECTED],
    default: STATUS.PENDING,
  },
  adminMessage: {
    type: String,
    default: "We will look into your problem",
  },
});

const Feedbacks = model("Feedbacks", FeedbackSchema);

export default Feedbacks;
