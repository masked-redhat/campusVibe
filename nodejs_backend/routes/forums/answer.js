import { Router } from "express";
import limits from "../../constants/limits.js";
import { simpleOrder } from "../posts/route.js";
import { userInfoInclusion } from "../../db/sql/commands.js";
import checks from "../../utils/checks.js";
import { serve } from "../../utils/response.js";
import MESSAGES from "../../constants/messages/global.js";
import codes from "../../utils/codes.js";
import transaction from "../../db/sql/transaction.js";
import Answer from "../../models/ORM/forum/answers.js";
import { literal } from "sequelize";
import { CommentRouter } from "./comment.js";
import AnswerVote from "../../models/ORM/forum/answer_votes.js";
import Forum from "../../models/ORM/forum/forums.js";

const router = Router();

const LIMIT = limits.FORUM.ANSWER._;

router.get("/", async (req, res) => {
  const { offset: rawOffset, forumId } = req.query;
  const offset = checks.isNuldefined(rawOffset) ? 0 : parseInt(rawOffset);

  if (checks.isNuldefined(forumId)) {
    serve(res, codes.BAD_REQUEST, "No forum Id in given parameters");
    return;
  }

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
      include: [userInfoInclusion],
    });

    serve(res, codes.OK, "Answers", {
      answers,
      offsetNext: offset + answers.length,
    });
  } catch (err) {
    console.log(err);

    serve(res, codes.INTERNAL_SERVER_ERROR, MESSAGES.SERVER_ERROR);
  }
});

router.post("/", async (req, res) => {
  const userId = req.user.id;
  const { content, forumId } = req.body;
  const images = req.files?.map((val) => val.filename) ?? [];

  if (checks.isNuldefined(content) && checks.isNuldefined(images)) {
    serve(res, codes.BAD_REQUEST, "There should be some content");
    return;
  }

  if (checks.isNuldefined(forumId)) {
    serve(res, codes.BAD_REQUEST, "No forum Id given");
    return;
  }

  const t = await transaction();
  try {
    const ans = await Answer.create(
      {
        userId,
        forumId,
        content,
        images,
      },
      { transaction: t }
    );

    await t.commit();
    serve(res, codes.CREATED, "Answered", { answerId: ans.id });
  } catch (err) {
    console.log(err);
    await t.rollback();

    serve(res, codes.INTERNAL_SERVER_ERROR, MESSAGES.SERVER_ERROR);
  }
});

router.put("/", async (req, res) => {
  const userId = req.user.id;
  const { content, answerId } = req.body;
  const images = req.files?.map((val) => val.filename) ?? [];

  const updateData = { content, images };

  try {
    await Answer.update(updateData, { where: { userId, id: answerId } });

    serve(res, codes.OK, "Answer Updated");
  } catch (err) {
    console.log(err);

    serve(res, codes.INTERNAL_SERVER_ERROR, MESSAGES.SERVER_ERROR);
  }
});

router.patch("/", async (req, res) => {
  const userId = req.user.id;
  const { content, answerId } = req.body;
  const images = req.files?.map((val) => val.filename) ?? [];

  const updateData = {
    ...(checks.isNuldefined(content) ? {} : { content }),
    ...(checks.isNuldefined(images) ? {} : { images }),
  };

  try {
    await Answer.update(updateData, { where: { userId, id: answerId } });

    serve(res, codes.OK, "Answer Updated");
  } catch (err) {
    console.log(err);

    serve(res, codes.INTERNAL_SERVER_ERROR, MESSAGES.SERVER_ERROR);
  }
});

router.delete("/", async (req, res) => {
  const userId = req.user.id;
  const { answerId } = req.query;

  if (checks.isNuldefined(answerId)) {
    serve(res, codes.BAD_REQUEST, "No answer id given");
    return;
  }

  const t = await transaction();
  try {
    await Answer.destroy({
      where: { userId, id: answerId },
      transaction: t,
      individualHooks: true,
    });

    await t.commit();
    serve(res, codes.NO_CONTENT);
  } catch (err) {
    console.log(err);
    await t.rollback();

    serve(res, codes.INTERNAL_SERVER_ERROR, MESSAGES.SERVER_ERROR);
  }
});

router.get("/vote", async (req, res) => {
  const { answerId, offset: rawOffset } = req.query;
  const offset = checks.isNuldefined(rawOffset) ? 0 : parseInt(rawOffset);

  try {
    const votes = await AnswerVote.findAll({
      where: { answerId },
      limit: LIMIT,
      offset,
      order: simpleOrder("updatedAt"),
      include: [userInfoInclusion],
    });

    serve(res, codes.OK, "Votes", { votes, offsetNext: offset + votes.length });
  } catch (err) {
    console.log(err);

    serve(res, codes.INTERNAL_SERVER_ERROR, MESSAGES.SERVER_ERROR);
  }
});

router.post("/vote", async (req, res) => {
  let { answerId, voteVal: num } = req.body;

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
  const t = await transaction();
  try {
    const find = await AnswerVote.findOne({
      where: { answerId, userId: req.user.id },
    });

    if (checks.isNuldefined(find))
      vote = await AnswerVote.create(
        {
          vote: voteVal,
          answerId,
          userId: req.user.id,
        },
        { transaction: t }
      );
    else
      vote = await AnswerVote.update(
        { vote: voteVal },
        {
          where: { commentId, userId: req.user.id },
          individualHooks: true,
          transaction: t,
        }
      );

    await t.commit();
    serve(res, codes.OK, "Voted");
  } catch (err) {
    console.log(err);
    await t.rollback();

    serve(res, codes.INTERNAL_SERVER_ERROR, MESSAGES.SERVER_ERROR);
  }
});

router.use("/comment", CommentRouter);

router.post("/accept", async (req, res) => {
  const userId = req.user.id;
  const { answerId, forumId } = req.body;

  if (checks.isNuldefined(answerId)) {
    serve(res, codes.BAD_REQUEST, "No answerId in given parameters");
    return;
  }
  if (checks.isNuldefined(forumId)) {
    serve(res, codes.BAD_REQUEST, "No forumId in given parameters");
    return;
  }

  const t = await transaction();
  try {
    const find = await Forum.findOne({
      where: { userId, id: forumId },
      transaction: t,
    });

    if (checks.isNuldefined(find)) {
      serve(res, codes.BAD_REQUEST, "No answer could be set");
      await t.rollback();
      return;
    }

    const [updated] = await Answer.update(
      { accepted: true },
      {
        where: { id: answerId, forumId, accepted: false },
        transaction: t,
        individualHooks: true,
      }
    );

    if (updated === 0) {
      serve(
        res,
        codes.BAD_REQUEST,
        "Give good answer Id which is valid AND not accepted"
      );
      await t.rollback();
      return;
    }

    await t.commit();
    serve(res, codes.OK, "Set as accepted answer");
  } catch (err) {
    console.log(err);
    await t.rollback();

    serve(res, codes.INTERNAL_SERVER_ERROR, MESSAGES.SERVER_ERROR);
  }
});

router.delete("/accept", async (req, res) => {
  const userId = req.user.id;
  const { answerId, forumId } = req.query;

  if (checks.isNuldefined(answerId)) {
    serve(res, codes.BAD_REQUEST, "No answerId in given parameters");
    return;
  }
  if (checks.isNuldefined(forumId)) {
    serve(res, codes.BAD_REQUEST, "No forumId in given parameters");
    return;
  }

  const t = await transaction();
  try {
    const find = await Forum.findOne({
      where: { userId, id: forumId },
      transaction: t,
    });

    if (checks.isNuldefined(find)) {
      serve(res, codes.BAD_REQUEST, "No answer could be set");
      await t.rollback();
      return;
    }

    const [updated] = await Answer.update(
      { accepted: false },
      {
        where: { id: answerId, forumId, accepted: true },
        transaction: t,
        individualHooks: true,
      }
    );

    if (updated === 0) {
      serve(
        res,
        codes.BAD_REQUEST,
        "Give good answer Id which is valid AND accepted"
      );
      await t.rollback();
      return;
    }

    await t.commit();
    serve(res, codes.OK, "Removed as accepted answer");
  } catch (err) {
    console.log(err);
    await t.rollback();

    serve(res, codes.INTERNAL_SERVER_ERROR, MESSAGES.SERVER_ERROR);
  }
});

router.all("*", (_, res) => {
  res.sendStatus(405);
});

export const AnswerRouter = router;
