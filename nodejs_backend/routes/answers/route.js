import { Router } from "express";
import limits from "../../constants/limits.js";
import { userInfoInclusion } from "../../db/sql/commands.js";
import checks from "../../utils/checks.js";
import { MESSAGES as m } from "../../constants/messages/answer.js";
import codes from "../../utils/codes.js";
import transaction from "../../db/sql/transaction.js";
import Answer from "../../models/ORM/forum/answers.js";
import { literal, ValidationError } from "sequelize";
import { CommentRouter } from "./comment.js";
import AnswerVote from "../../models/ORM/forum/answer_votes.js";
import Forum from "../../models/ORM/forum/forums.js";
import { postVoteForAnswers } from "../../utils/comment.js";

const LIMIT = limits.FORUM.ANSWER._;

const router = Router();

router.get("/", async (req, res) => {
  // get the offset and forumId from request query
  const { offset: rawOffset, forumId } = req.query;
  const offset = checks.isNuldefined(rawOffset) ? 0 : parseInt(rawOffset);

  // forum Id is required
  if (checks.isNuldefined(forumId)) return res.noParams();

  try {
    const answers = await Answer.findAll({
      attributes: { exclude: ["userId"] },
      where: { forumId },
      offset,
      limit: LIMIT,
      order: [
        [literal("upvotes - downvotes"), "desc"],
        ["updatedAt", "desc"],
      ],
      include: [userInfoInclusion]
    });

    res.ok(m.SUCCESS, { answers, offsetNext: offset + answers.length });
  } catch (err) {
    console.log(err);

    res.serverError();
  }
});

router.post("/", async (req, res) => {
  const userId = req.user.id;

  // get content, images and forumId to post an answer
  const { content = null, forumId = null, images = [] } = req.body;

  if (checks.isAnyValueNull([content, forumId])) return res.noParams();

  const t = await transaction();
  try {
    // create answer for the forum
    const ans = await Answer.create(
      { userId, forumId, content, images },
      { transaction: t }
    );

    await t.commit();

    res.created(m.ANSWERED, { answerId: ans.id });
  } catch (err) {
    console.log(err);
    await t.rollback();

    if (err instanceof ValidationError) return res.invalidParams();

    res.serverError();
  }
});

router.patch("/", async (req, res) => {
  const userId = req.user.id;

  // get parameters from request body
  const { content, answerId, images = [] } = req.body;

  // answerId is required
  if (checks.isNuldefined(answerId)) return res.noParams();

  // only update data that is provided
  const updateData = Object.fromEntries(
    Object.entries({ content, images }).filter(
      ([_, value]) => !checks.isNuldefined(value)
    )
  );

  try {
    await Answer.update(updateData, { where: { userId, id: answerId } });

    res.ok(m.ANSWER_UPDATED);
  } catch (err) {
    console.log(err);

    if (err instanceof ValidationError) return res.invalidParams();

    res.serverError();
  }
});

router.put("/", async (req, res) => {
  const userId = req.user.id;

  // get parameters from request body
  const { content, answerId, images = [] } = req.body;

  // answerId and content is required
  if (checks.isAnyValueNull([content, answerId])) return res.noParams();

  // update all data
  const updateData = { content, images };

  try {
    await Answer.update(updateData, { where: { userId, id: answerId } });

    res.ok(m.ANSWER_UPDATED);
  } catch (err) {
    console.log(err);

    if (err instanceof ValidationError) return res.invalidParams();

    res.serverError();
  }
});

router.delete("/", async (req, res) => {
  const userId = req.user.id;

  // get answerId from request query
  const { answerId } = req.query;

  if (checks.isNuldefined(answerId)) return res.noParams();

  const t = await transaction();
  try {
    await Answer.destroy({
      where: { userId, id: answerId },
      transaction: t,
      individualHooks: true,
    });

    await t.commit();

    res.deleted();
  } catch (err) {
    console.log(err);
    await t.rollback();

    res.serverError();
  }
});

router.get("/vote", async (req, res) => {
  const { answerId, offset: rawOffset } = req.query;
  const offset = checks.isNuldefined(rawOffset) ? 0 : parseInt(rawOffset);

  // answerId is required
  if (checks.isNuldefined(commentId)) return res.noParams();

  try {
    // get votes of which they are not zero
    const votes = await AnswerVote.findAll({
      where: { answerId, vote: { $ne: 0 } },
      limit: LIMIT,
      offset,
      order: [["updatedAt", "desc"]],
      include: [userInfoInclusion]
    });

    res.ok(m.VOTES, { votes, offsetNext: offset + votes.length });
  } catch (err) {
    console.log(err);

    res.serverError();
  }
});

router.post("/upvote", async (req, res) => {
  // get the answerId from the request body
  const { answerId } = req.body;
  const voteVal = 1;

  postVoteForAnswers(answerId, voteVal, req.user.id, res, AnswerVote);
});

router.post("/downvote", async (req, res) => {
  // get the answerId from the request body
  const { answerId } = req.body;
  const voteVal = -1;

  postVoteForAnswers(answerId, voteVal, req.user.id, res, AnswerVote);
});

router.post("/vote/reset", async (req, res) => {
  // get the answerId from the request body
  const { answerId } = req.body;
  const voteVal = 0;

  postVoteForAnswers(answerId, voteVal, req.user.id, res, AnswerVote);
});

router.post("/accept", async (req, res) => {
  const userId = req.user.id;

  // get the answerId and forumId from request body
  const { answerId, forumId } = req.body;

  if (checks.isAnyValueNull([answerId, forumId])) return res.noParams();

  const t = await transaction();
  try {
    // find if there exists a forum with given forumId
    const forumFound = await Forum.findOne({
      where: { userId, id: forumId },
      transaction: t,
    });

    if (checks.isNuldefined(forumFound)) {
      await t.rollback();
      return res.failure(codes.BAD_REQUEST, m.FORUM_ID_INVALID);
    }

    // try updating the answer data: accepted = false -> true
    const [updated] = await Answer.update(
      { accepted: true },
      {
        where: { id: answerId, forumId, accepted: false },
        transaction: t,
        individualHooks: true,
      }
    );

    // if nothing updated
    if (updated === 0) {
      await t.rollback();
      return res.failure(codes.BAD_REQUEST, m.IDS_INVALID);
    }

    await t.commit();

    res.ok(m.ACCEPTED.SET);
  } catch (err) {
    console.log(err);
    await t.rollback();

    if (err instanceof ValidationError) return res.invalidParams();

    res.serverError();
  }
});

router.delete("/accept", async (req, res) => {
  const userId = req.user.id;

  // get the answerId and forumId from request body
  const { answerId, forumId } = req.body;

  if (checks.isAnyValueNull([answerId, forumId])) return res.noParams();

  const t = await transaction();
  try {
    // find if there exists a forum with given forumId
    const forumFound = await Forum.findOne({
      where: { userId, id: forumId },
      transaction: t,
    });

    if (checks.isNuldefined(forumFound)) {
      await t.rollback();
      return res.failure(codes.BAD_REQUEST, m.FORUM_ID_INVALID);
    }

    // try updating the answer data: accepted = true -> false
    const [updated] = await Answer.update(
      { accepted: false },
      {
        where: { id: answerId, forumId, accepted: false },
        transaction: t,
        individualHooks: true,
      }
    );

    // if nothing updated
    if (updated === 0) {
      await t.rollback();
      return res.failure(codes.BAD_REQUEST, m.IDS_INVALID);
    }

    await t.commit();

    res.ok(m.ACCEPTED.REMOVE);
  } catch (err) {
    console.log(err);
    await t.rollback();

    if (err instanceof ValidationError) return res.invalidParams();

    res.serverError();
  }
});

router.use("/comment", CommentRouter);

export const AnswersRouter = router;
