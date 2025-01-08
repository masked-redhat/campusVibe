import { Router } from "express";
import PostComment from "../../models/ORM/post/post_comments.js";
import checks from "../../utils/checks.js";
import codes from "../../utils/codes.js";
import { MESSAGES as m } from "../../constants/messages/comments.js";
import { ForeignKeyConstraintError, literal, ValidationError } from "sequelize";
import PostCommentVote from "../../models/ORM/post/post_comments_votes.js";
import limits from "../../constants/limits.js";
import transaction from "../../db/sql/transaction.js";
import { userInfoInclusion } from "../../db/sql/commands.js";
import postVote from "../../utils/comment.js";

const LIMIT = limits.POST.COMMENT;

const router = Router();

router.get("/", async (req, res) => {
  // postId can be array too [id1, id2, id3]
  const { postId = null, offset: rawOffset, filter } = req.query;
  const offset = checks.isNuldefined(rawOffset) ? 0 : parseInt(rawOffset);
  try {
    postId = JSON.parse(postId);
  } catch {}

  if (checks.isNuldefined(postId)) res.noParams();

  let order = [["createdAt", "desc"]];
  if (filter === "HIGHEST_VOTE")
    order = [[literal("(upvotes - downvotes)"), "desc"]];

  try {
    const comments = await PostComment.findAll({
      attributes: { exclude: ["replyId", "votes"] },
      where: { postId, replyId: null },
      offset,
      limit: LIMIT,
      order,
      ...userInfoInclusion,
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
  const { postId, comment = null, commentId = null, images = [] } = req.body;
  const replyId = checks.isNuldefined(commentId) ? null : commentId;

  // if no postId or no comment which are required, then send error message
  if (checks.isAnyValueNull(postId, comment)) return res.noParams();

  const t = await transaction();
  try {
    const postComment = await PostComment.create(
      {
        postId,
        userId: req.user.id,
        images,
        comment,
        replyId,
      },
      { transaction: t }
    );

    await t.commit();

    res.created(m.COMMENTED, { commentId: postComment.id });
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
    const [postComment] = await PostComment.update(updateData, {
      where: { id: commentId, userId: req.user.id },
    });

    if (postComment === 0)
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
  if (checks.isAnyValueNull([commentId, comment])) return res.noParams();

  // replace all data with the given data
  const updateData = { comment, images };

  try {
    const [postComment] = await PostComment.update(updateData, {
      where: { id: commentId, userId: req.user.id },
    });

    if (postComment === 0)
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
    const deleted = await PostComment.destroy({
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
    const replies = await PostComment.findAll({
      attributes: { exclude: ["replyId", "votes"] },
      where: { replyId: commentId },
      limit: LIMIT,
      offset,
      order: [["updatedAt", "desc"]],
      ...userInfoInclusion,
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
    const votes = await PostCommentVote.findAll({
      where: { commentId, vote: { $ne: 0 } },
      limit: LIMIT,
      offset,
      order: [["createdAt", "desc"]],
      ...userInfoInclusion,
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

  postVote(commentId, voteVal, req.user.id, res);
});

router.post("/downvote", async (req, res) => {
  // get the commentId from the request body
  const { commentId } = req.body;
  const voteVal = -1;

  postVote(commentId, voteVal, req.user.id, res);
});

router.post("/vote/reset", async (req, res) => {
  // get the commentId from the request body
  const { commentId } = req.body;
  const voteVal = 0;

  postVote(commentId, voteVal, req.user.id, res);
});

// votes will never get deleted

export const CommentRouter = router;
