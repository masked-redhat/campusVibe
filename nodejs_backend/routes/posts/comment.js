import { Router } from "express";
import PostComment from "../../models/ORM/post/post_comments.js";
import { simpleOrder } from "./route.js";
import { serve } from "../../utils/response.js";
import checks from "../../utils/checks.js";
import codes from "../../utils/codes.js";
import MESSAGES from "../../constants/messages/global.js";
import { MESSAGES as m } from "../../constants/messages/posts.js";
import { ForeignKeyConstraintError, literal, ValidationError } from "sequelize";
import User from "../../models/ORM/user.js";
import PostCommentVote from "../../models/ORM/post/post_comments_votes.js";
import limits from "../../constants/limits.js";
import transaction from "../../db/sql/transaction.js";

const router = Router();

const LIMIT = limits.POST.COMMENT;

router.get("/", async (req, res) => {
  // postId can be array too [id1, id2, id3]

  const { postId: rawPostId, offset: rawOffset, filter } = req.query;
  const offset = checks.isNuldefined(rawOffset) ? 0 : parseInt(rawOffset);
  let postId;
  try {
    postId = JSON.parse(rawPostId);
  } catch (err) {
    console.log(err);

    postId = rawPostId;

    serve(res, codes.BAD_REQUEST, m.NO_PROPER_FORMAT);
    return;
  }

  if (checks.isNuldefined(postId)) {
    serve(res, codes.BAD_REQUEST, m.NO_POST_ID);
    return;
  }

  let order = simpleOrder("createdAt");
  if (filter === "HIGHEST_VOTE")
    order = simpleOrder(literal("(upvotes - downvotes)"));

  let comments;
  try {
    comments = await PostComment.findAll({
      attributes: { exclude: ["replyId", "votes"] },
      where: {
        postId: postId,
        replyId: null,
      },
      limit: LIMIT,
      offset,
      order,
      include: [
        {
          model: User,
          foreignKey: "userId",
          attributes: ["username"], // Only fetch username from the User table
        },
      ],
    });
  } catch (err) {
    console.log(err);

    serve(res, codes.INTERNAL_SERVER_ERROR, MESSAGES.SERVER_ERROR);
    return;
  }

  serve(res, codes.OK, "Comments", {
    comments,
    offsetNext: comments.length + offset,
  });
});

// if commentId given, will be treated as a reply
router.post("/", async (req, res) => {
  const { postId, comment, commentId } = req.body;
  const images = req.files?.map((val) => val.filename) ?? [];
  const replyId = checks.isNuldefined(commentId) ? null : commentId;

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

    serve(res, codes.CREATED, m.COMMENTED);
  } catch (err) {
    console.log(err);
    await t.rollback();

    if (err instanceof ValidationError) {
      serve(res, codes.BAD_REQUEST, m.INVALID_VALUES);
      return;
    }

    if (err instanceof ForeignKeyConstraintError) {
      serve(res, codes.BAD_REQUEST, m.INVALID_VALUES);
      return;
    }

    serve(res, codes.INTERNAL_SERVER_ERROR, MESSAGES.SERVER_ERROR);
  }
});

router.patch("/", async (req, res) => {
  const { commentId, comment } = req.body;
  const images = req.files?.map((val) => val.filename) ?? [];

  const updateData = Object.fromEntries(
    Object.entries({
      comment,
      images,
    }).filter(([_, value]) => !checks.isNuldefined(value))
  );

  try {
    const postComment = await PostComment.update(updateData, {
      where: { id: commentId, userId: req.user.id },
    });

    if (postComment === 0) {
      serve(res, codes.BAD_REQUEST, m.INVALID_VALUES);
      return;
    }
  } catch (err) {
    console.log(err);

    serve(res, codes.INTERNAL_SERVER_ERROR, MESSAGES.SERVER_ERROR);
    return;
  }

  serve(res, codes.OK, m.COMMENT_UPDATED);
});

router.put("/", async (req, res) => {
  const { commentId, comment } = req.body;
  const images = req.files?.map((val) => val.filename) ?? [];

  try {
    const postComment = await PostComment.update(
      { comment, images },
      { where: { id: commentId, userId: req.user.id } }
    );

    if (postComment === 0) {
      serve(res, codes.BAD_REQUEST, m.INVALID_VALUES);
      return;
    }
  } catch (err) {
    console.log(err);

    serve(res, codes.INTERNAL_SERVER_ERROR, MESSAGES.SERVER_ERROR);
    return;
  }

  serve(res, codes.OK, m.COMMENT_UPDATED);
});

router.delete("/", async (req, res) => {
  const { commentId } = req.query;

  if (checks.isNuldefined(commentId)) {
    serve(res, codes.BAD_REQUEST, m.INVALID_VALUES);
    return;
  }

  const t = await transaction();
  try {
    const deleted = await PostComment.destroy({
      where: { id: commentId },
      individualHooks: true,
      transaction: t,
    });

    await t.commit();

    serve(res, codes.NO_CONTENT);
  } catch (err) {
    console.log(err);
    await t.rollback();

    serve(res, codes.INTERNAL_SERVER_ERROR, MESSAGES.SERVER_ERROR);
    return;
  }
});

router.get("/reply", async (req, res) => {
  const { commentId, offset: rawOffset } = req.query;
  const offset = checks.isNuldefined(rawOffset) ? 0 : parseInt(rawOffset);

  if (checks.isNuldefined(commentId)) {
    serve(res, codes.BAD_REQUEST, m.NO_COMMENT_ID);
    return;
  }

  try {
    const comments = await PostComment.findAll({
      attributes: { exclude: ["replyId", "votes"] },
      where: { replyId: commentId },
      limit: LIMIT,
      offset,
      order: simpleOrder("updatedAt"),
      include: [
        {
          model: User,
          foreignKey: "userId",
          attributes: ["username"], // Only fetch username from the User table
        },
      ],
    });

    serve(res, codes.OK, "Replies", {
      replies: comments,
      offsetNext: offset + comments.length,
    });
  } catch (err) {
    console.log(err);

    serve(res, codes.INTERNAL_SERVER_ERROR, MESSAGES.SERVER_ERROR);
  }
});

router.get("/vote", async (req, res) => {
  const { commentId, offset: rawOffset } = req.query;
  const offset = checks.isNuldefined(rawOffset) ? 0 : parseInt(rawOffset);

  try {
    const votes = await PostCommentVote.findAll({
      where: { commentId },
      limit: LIMIT,
      offset,
      order: simpleOrder("createdAt"),
      include: [
        {
          model: User,
          foreignKey: "userId",
          attributes: ["username"], // Only fetch username from the User table
        },
      ],
    });

    serve(res, codes.OK, "Votes", { votes, offsetNext: offset + votes.length });
  } catch (err) {
    console.log(err);

    serve(res, codes.INTERNAL_SERVER_ERROR, MESSAGES.SERVER_ERROR);
  }
});

router.post("/vote", async (req, res) => {
  let { commentId, voteVal: num } = req.body;

  try {
    num = parseInt(num);
  } catch (err) {
    console.log(err);

    serve(res, codes.BAD_REQUEST, m.INVALID_VALUES);
    return;
  }

  const voteVal = num;

  if (![-1, 0, 1].includes(voteVal)) {
    serve(res, codes.BAD_REQUEST, m.INVALID_VALUES);
    return;
  }

  let vote;
  try {
    const find = await PostCommentVote.findOne({
      where: { commentId, userId: req.user.id },
    });

    if (checks.isNuldefined(find))
      vote = await PostCommentVote.create({
        vote: voteVal,
        commentId,
        userId: req.user.id,
      });
    else
      vote = await PostCommentVote.update(
        { vote: voteVal },
        { where: { commentId, userId: req.user.id }, individualHooks: true }
      );

    serve(res, codes.OK, m.VOTED);
  } catch (err) {
    console.log(err);

    serve(res, codes.INTERNAL_SERVER_ERROR, MESSAGES.SERVER_ERROR);
  }
});

export const CommentRouter = router;
