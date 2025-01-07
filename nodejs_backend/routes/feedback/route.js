import { Router } from "express";
import codes from "../../utils/codes.js";
import MESSAGES from "../../constants/messages/global.js";
import { serve } from "../../utils/response.js";
import checks from "../../utils/checks.js";
import Feedbacks, { STATUS } from "../../models/ODM/feedback.js";
import limits from "../../constants/limits.js";

const router = Router();

const LIMIT = limits.FEEDBACK._;

router.get("/", async (req, res) => {
  const username = req.user.username;
  const { offset: rawOffset } = req.query;
  const offset = checks.isNuldefined(rawOffset) ? 0 : parseInt(rawOffset);

  let filter = {};
  if (username === "admin") filter = { status: { $ne: STATUS.RESOLVED } };
  else filter = { userId: req.user.id };

  try {
    const feedbacks = await Feedbacks.find(filter, null, { limit: LIMIT })
      .skip(offset)
      .sort([["updatedAt", "desc"]])
      .select("-userId -__v");

    serve(res, codes.OK, "Feedbacks", {
      feedbacks,
      offsetNext: offset + feedbacks.length,
    });
  } catch (err) {
    console.log(err);

    serve(res, codes.INTERNAL_SERVER_ERROR, MESSAGES.SERVER_ERROR);
  }
});

router.post("/", async (req, res) => {
  const uid = req.user.id;
  const { content = null, otherDetails = null } = req.body;
  const images = req.files?.map((val) => val.filename) ?? [];

  if (checks.isNuldefined(content) && checks.isNuldefined(otherDetails)) {
    serve(
      res,
      codes.BAD_REQUEST,
      "Please add description or details for your feedback or report"
    );
    return;
  }

  try {
    const feedback = await Feedbacks.create({
      userId: uid,
      content,
      otherDetails,
      images,
    });

    serve(res, codes.CREATED, "Feedback sent");
  } catch (err) {
    console.log(err);

    serve(res, codes.INTERNAL_SERVER_ERROR, MESSAGES.SERVER_ERROR);
  }
});

router.patch("/resolving", async (req, res) => {
  const { feedbackId } = req.body;

  if (req.user.username !== "admin") {
    serve(res, codes.BAD_REQUEST, "Only admins are allowed");
    return;
  }

  if (checks.isNuldefined(feedbackId)) {
    serve(res, codes.BAD_REQUEST, "No feedback Id given in request");
    return;
  }

  try {
    await Feedbacks.updateOne(
      { _id: feedbackId },
      {
        status: STATUS.RESOLVING,
        adminMessage: "We are currently looking in your request",
      }
    );
    serve(res, codes.OK, "Set status to resolving");
  } catch (err) {
    console.log(err);

    serve(res, codes.INTERNAL_SERVER_ERROR, MESSAGES.SERVER_ERROR);
  }
});

router.patch("/resolved", async (req, res) => {
  const { feedbackId, message } = req.body;

  if (req.user.username !== "admin") {
    serve(res, codes.BAD_REQUEST, "Only admins are allowed");
    return;
  }

  if (checks.isNuldefined(feedbackId) || checks.isNuldefined(message)) {
    serve(
      res,
      codes.BAD_REQUEST,
      "Please give all the appropriate parameters with request"
    );
    return;
  }

  try {
    await Feedbacks.updateOne(
      { _id: feedbackId },
      {
        status: STATUS.RESOLVED,
        adminMessage: message,
      }
    );
    serve(res, codes.OK, "Feedback resolved");
  } catch (err) {
    console.log(err);

    serve(res, codes.INTERNAL_SERVER_ERROR, MESSAGES.SERVER_ERROR);
  }
});

router.patch("/rejected", async (req, res) => {
  const { feedbackId, message } = req.body;

  if (req.user.username !== "admin") {
    serve(res, codes.BAD_REQUEST, "Only admins are allowed");
    return;
  }

  if (checks.isNuldefined(feedbackId) || checks.isNuldefined(message)) {
    serve(
      res,
      codes.BAD_REQUEST,
      "Please give all the appropriate parameters with request"
    );
    return;
  }

  try {
    await Feedbacks.updateOne(
      { _id: feedbackId },
      {
        status: STATUS.REJECTED,
        adminMessage: message,
      }
    );
    serve(res, codes.OK, "Feedback rejected");
  } catch (err) {
    console.log(err);

    serve(res, codes.INTERNAL_SERVER_ERROR, MESSAGES.SERVER_ERROR);
  }
});

router.all("*", (_, res) => {
  res.sendStatus(405);
});

export const FeedbackRouter = router;
