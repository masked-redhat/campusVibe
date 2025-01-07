import { Router } from "express";
import codes from "../../utils/codes.js";
import MESSAGES from "../../constants/messages/global.js";
import { serve } from "../../utils/response.js";
import checks from "../../utils/checks.js";
import Feedbacks from "../../models/ODM/feedback.js";
import limits from "../../constants/limits.js";

const router = Router();

const LIMIT = limits.FEEDBACK._;

router.get("/", async (req, res) => {
  const username = req.user.username;
  const { offset: rawOffset } = req.query;
  const offset = checks.isNuldefined(rawOffset) ? 0 : parseInt(rawOffset);

  if (username !== "admin") {
    serve(res, codes.FORBIDDEN, "Only admins are allowed");
    return;
  }

  try {
    const feedbacks = await Feedbacks.find({}, null, { limit: LIMIT })
      .skip(offset)
      .sort([["updatedAt", "desc"]]);

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

router.all("*", (_, res) => {
  res.sendStatus(405);
});

export const FeedbackRouter = router;
