import { Router } from "express";
import AnswerComment from "../../models/ORM/forum/answer_comments.js";
import checks from "../../utils/checks.js";
import codes from "../../utils/codes.js";
import { MESSAGES as m } from "../../constants/messages/comments.js";
import { ForeignKeyConstraintError, literal, ValidationError } from "sequelize";
import AnswerCommentVote from "../../models/ORM/forum/answer_comment_votes.js";
import limits from "../../constants/limits.js";
import transaction from "../../db/sql/transaction.js";
import { userInfoInclusion } from "../../db/sql/commands.js";
import postVote from "../../utils/comment.js";

const LIMIT = limits.FORUM.ANSWER.COMMENT;

const router = Router();

router.get("/", async (req, res) => {
  // answerId can be array too [id1, id2, id3]

  const { answerId: rawAnswerId, offset: rawOffset, filter } = req.query;
  const offset = checks.isNuldefined(rawOffset) ? 0 : parseInt(rawOffset);
  let answerId;
  try {
    answerId = JSON.parse(answerId);
  } catch {}

  if (checks.isNuldefined(answerId)) res.noParams();

  let order = [["createdAt", "desc"]];
  if (filter === "HIGHEST_VOTE")
    order = [[literal("(upvotes - downvotes)"), "desc"]];

  try {
    const comments = await AnswerComment.findAll({
      attributes: { exclude: ["replyId", "votes"] },
      where: { answerId, replyId: null },
      limit: LIMIT,
      offset,
      order,
      include: [userInfoInclusion]
    });

    res.ok(m.SUCCESS.COMMENTS, {
      comments,
      offsetNext: comments.length + offset,
    });
  } catch (err) {
    console.log(err);

    res.serverError();
  }
});

// if commentId given, will be treated as a reply
router.post("/", async (req, res) => {
  const { answerId, comment = null, commentId = null, images = [] } = req.body;
  const replyId = checks.isNuldefined(commentId) ? null : commentId;

  // if no answerId or no comment which are required, then send error message
  if (checks.isAnyValueNull(answerId, comment)) return res.noParams();

  const t = await transaction();
  try {
    const answerComment = await AnswerComment.create(
      { answerId, userId: req.user.id, images, comment, replyId },
      { transaction: t }
    );

    await t.commit();

    res.created(m.COMMENTED, { commentId: answerComment.id });
  } catch (err) {
    console.log(err);
    await t.rollback();

    if (err instanceof (ValidationError || ForeignKeyConstraintError))
      return res.invalidParams();

    res.serverError();
  }
});

router.patch("/", async (req, res) => {
  const { commentId, comment = null, images = [] } = req.body;

  // commentId is required to update the comment data
  if (checks.isNuldefined(commentId)) return res.noParams();

  // only update data that is requested
  const updateData = Object.fromEntries(
    Object.entries({ comment, images }).filter(
      ([_, value]) => !checks.isNuldefined(value)
    )
  );

  try {
    const [answerComment] = await AnswerComment.update(updateData, {
      where: { id: commentId, userId: req.user.id },
    });

    if (answerComment === 0)
      return res.failure(codes.BAD_REQUEST, m.ID_WRONG_NO_ACCESS);

    res.ok(m.UPDATED);
  } catch (err) {
    console.log(err);

    if (err instanceof ValidationError) return res.invalidParams();

    res.serverError();
  }
});

router.put("/", async (req, res) => {
  const { commentId, comment = null, images = [] } = req.body;

  // commentId is required to update the comment data
  if (checks.isNuldefined(commentId)) return res.noParams();

  // replace all data with the given data
  const updateData = { comment, images };

  try {
    const [answerComment] = await AnswerComment.update(updateData, {
      where: { id: commentId, userId: req.user.id },
    });

    if (answerComment === 0)
      return res.failure(codes.BAD_REQUEST, m.ID_WRONG_NO_ACCESS);

    res.ok(m.UPDATED);
  } catch (err) {
    console.log(err);

    if (err instanceof ValidationError) return res.invalidParams();

    res.serverError();
  }
});

router.delete("/", async (req, res) => {
  // get comment Id from request query
  const { commentId } = req.query;

  // comment Id is required to delete the comment
  if (checks.isNuldefined(commentId)) return res.noParams();

  const t = await transaction();
  try {
    const deleted = await AnswerComment.destroy({
      where: { id: commentId },
      individualHooks: true,
      transaction: t,
    });

    await t.commit();

    if (deleted === 0)
      return res.failure(codes.BAD_REQUEST, m.ID_WRONG_NO_ACCESS);

    res.deleted();
  } catch (err) {
    console.log(err);
    await t.rollback();

    res.serverError();
  }
});

router.get("/reply", async (req, res) => {
  // get comment Id from the request query which to get replies of
  const { commentId, offset: rawOffset } = req.query;
  const offset = checks.isNuldefined(rawOffset) ? 0 : parseInt(rawOffset);

  if (checks.isNuldefined(commentId)) return res.noParams();

  try {
    // get the replies of the comment with commentId as id
    const replies = await AnswerComment.findAll({
      attributes: { exclude: ["replyId", "votes"] },
      where: { replyId: commentId },
      limit: LIMIT,
      offset,
      order: [["updatedAt", "desc"]],
      include: [userInfoInclusion]
    });

    res.ok(m.SUCCESS.REPLIES, { replies, offsetNext: offset + replies.length });
  } catch (err) {
    console.log(err);

    res.serverError();
  }
});

router.get("/vote", async (req, res) => {
  const { commentId, offset: rawOffset } = req.query;
  const offset = checks.isNuldefined(rawOffset) ? 0 : parseInt(rawOffset);

  // commentId is required
  if (checks.isNuldefined(commentId)) return res.noParams();

  try {
    // get votes of which they are not zero
    const votes = await AnswerCommentVote.findAll({
      where: { commentId, vote: { $ne: 0 } },
      limit: LIMIT,
      offset,
      order: [["createdAt", "desc"]],
      include: [userInfoInclusion]
    });

    res.ok(m.SUCCESS.VOTES, { votes, offsetNext: offset + votes.length });
  } catch (err) {
    console.log(err);

    res.serverError();
  }
});

router.post("/upvote", async (req, res) => {
  // get the commentId from the request body
  const { commentId } = req.body;
  const voteVal = 1;

  postVote(commentId, voteVal, req.user.id, res, AnswerCommentVote);
});

router.post("/downvote", async (req, res) => {
  // get the commentId from the request body
  const { commentId } = req.body;
  const voteVal = -1;

  postVote(commentId, voteVal, req.user.id, res, AnswerCommentVote);
});

router.post("/vote/reset", async (req, res) => {
  // get the commentId from the request body
  const { commentId } = req.body;
  const voteVal = 0;

  postVote(commentId, voteVal, req.user.id, res, AnswerCommentVote);
});

// votes will never get deleted

export const CommentRouter = router;
