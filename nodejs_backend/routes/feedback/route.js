import { Router } from "express";
import { MESSAGES as m } from "../../constants/messages/feedback.js";
import checks from "../../utils/checks.js";
import Feedbacks, { STATUS } from "../../models/ODM/feedback.js";
import limits from "../../constants/limits.js";
import { ADMIN } from "../../constants/env.js";
import { Error } from "mongoose";

const LIMIT = limits.FEEDBACK._;

const router = Router();

router.get("/", async (req, res) => {
  const username = req.user.username;

  // get/set offset from the request query
  const { offset: rawOffset } = req.query;
  const offset = checks.isNuldefined(rawOffset) ? 0 : parseInt(rawOffset);

  // set filter for searching from the database
  let filter = {};
  // if user is admin
  if (username === ADMIN) filter = { status: { $ne: STATUS.RESOLVED } };
  else filter = { userId: req.user.id };

  try {
    const feedbacks = await Feedbacks.find(filter, null, { limit: LIMIT })
      .skip(offset)
      .sort([["updatedAt", "desc"]])
      .select("-userId -__v");

    // change _id to id
    feedbacks.map((feedback) => {
      feedback.id = feedback._id;
      delete feedback._id;
    });

    res.ok(m.SUCCESS, { feedbacks, offsetNext: offset + feedbacks.length });
  } catch (err) {
    console.log(err);

    res.serverError();
  }
});

router.post("/", async (req, res) => {
  // set userId for further operations
  const userId = req.user.id;

  const { content = null, otherDetails = null, images = [] } = req.body;

  // content and otherDetails is required
  if (checks.isAnyValueNull([content, otherDetails])) return res.noParams();

  try {
    const feedback = await Feedbacks.create({
      userId,
      content,
      otherDetails,
      images,
    });

    res.created(m.SENT, { feedbackId: feedback._id });
  } catch (err) {
    console.log(err);

    if (err instanceof Error.ValidationError) return res.invalidParams();

    res.serverError();
  }
});

router.patch("/resolving", async (req, res) => {
  // get feedbackId from request body
  const { feedbackId } = req.body;

  // if user is not admin
  if (req.user.username !== ADMIN) return res.forbidden();

  // feedbackId is required
  if (checks.isNuldefined(feedbackId)) return res.noParams();

  try {
    await Feedbacks.updateOne(
      { _id: feedbackId },
      {
        status: STATUS.RESOLVING,
        adminMessage: "We are currently looking in your request",
      }
    );
    res.ok(m.TO.RESOLVING);
  } catch (err) {
    console.log(err);

    if (err instanceof Error.ValidationError) return res.invalidParams();

    res.serverError();
  }
});

router.patch("/resolved", async (req, res) => {
  // get feedbackId from request body
  const { feedbackId, message = null } = req.body;

  // if user is not admin
  if (req.user.username !== ADMIN) return res.forbidden();

  // feedbackId and message are required
  if (checks.isAnyValueNull([feedbackId, message])) return res.noParams();

  try {
    await Feedbacks.updateOne(
      { _id: feedbackId },
      {
        status: STATUS.RESOLVED,
        adminMessage: message,
      }
    );

    res.ok(m.TO.RESOLVED);
  } catch (err) {
    console.log(err);

    if (err instanceof Error.ValidationError) return res.invalidParams();

    res.serverError();
  }
});

router.patch("/rejected", async (req, res) => {
  // get feedbackId from request body
  const { feedbackId, message = null } = req.body;

  // if user is not admin
  if (req.user.username !== ADMIN) return res.forbidden();

  // feedbackId and message are required
  if (checks.isAnyValueNull([feedbackId, message])) return res.noParams();

  try {
    await Feedbacks.updateOne(
      { _id: feedbackId },
      {
        status: STATUS.REJECTED,
        adminMessage: message,
      }
    );

    res.ok(m.TO.REJECTED);
  } catch (err) {
    console.log(err);

    if (err instanceof Error.ValidationError) return res.invalidParams();

    res.serverError();
  }
});

export const FeedbackRouter = router;
