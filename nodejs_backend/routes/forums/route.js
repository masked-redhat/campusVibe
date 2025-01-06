import { Router } from "express";
import limits from "../../constants/limits.js";
import checks from "../../utils/checks.js";
import Forum from "../../models/ORM/forum/forums.js";
import { userInfoInclusion } from "../../db/sql/commands.js";
import { simpleOrder } from "../posts/route.js";
import codes from "../../utils/codes.js";
import MESSAGES from "../../constants/messages/global.js";
import { serve } from "../../utils/response.js";
import User from "../../models/ORM/user.js";
import transaction from "../../db/sql/transaction.js";
import { VoteRouter } from "./forum_vote.js";
import { AnswerRouter } from "./answer.js";

const router = Router();

const LIMIT = limits.FORUM._;

router.get("/", async (req, res) => {
  const { offset: rawOffset, username } = req.query;
  const offset = checks.isNuldefined(rawOffset) ? 0 : parseInt(rawOffset);

  try {
    const userId = username
      ? (
          await User.findOne({
            attributes: ["id"],
            where: { username },
          })
        )?.id
      : req.user.id;

    if (checks.isNuldefined(userId)) {
      serve(res, codes.BAD_REQUEST, "No user with that username");
      return;
    }

    const forums = await Forum.findAll({
      attributes: { exclude: "userId" },
      where: { userId },
      offset,
      limit: LIMIT,
      order: simpleOrder("updatedAt"),
      include: [userInfoInclusion],
    });

    serve(res, codes.OK, "Forums", {
      forums,
      offsetNext: offset + forums.length,
    });
  } catch (err) {
    console.log(err);

    serve(res, codes.INTERNAL_SERVER_ERROR, MESSAGES.SERVER_ERROR);
  }
});

router.post("/", async (req, res) => {
  const userId = req.user.id;
  const { question, content } = req.body;
  const images = req.files?.map((val) => val.filename) ?? [];

  if (checks.isNuldefined(question)) {
    serve(res, codes.BAD_REQUEST, "No question given");
    return;
  }

  const t = await transaction();
  try {
    const forum = await Forum.create(
      { userId, question, content, images },
      { attributes: ["id"], transaction: t }
    );

    await t.commit();
    serve(res, codes.CREATED, "Forum Created", { forumId: forum.id });
  } catch (err) {
    console.log(err);
    await t.rollback();

    serve(res, codes.INTERNAL_SERVER_ERROR, MESSAGES.SERVER_ERROR);
  }
});

router.patch("/", async (req, res) => {
  const userId = req.user.id;
  const { question, content, forumId } = req.body;
  const images = req.files?.map((val) => val.filename) ?? [];

  const updateData = {
    ...(question ? { question } : {}),
    ...(content ? { content } : {}),
    ...(checks.isNuldefined(images) ? { images } : {}),
  };

  if (checks.isNuldefined(updateData)) {
    serve(res, codes.BAD_REQUEST, "Nothing to patch");
    return;
  }

  try {
    await Forum.update(updateData, { where: { userId, id: forumId } });
    serve(res, codes.OK, "Forum Updated");
  } catch (err) {
    console.log(err);

    serve(res, codes.INTERNAL_SERVER_ERROR, MESSAGES.SERVER_ERROR);
  }
});

router.put("/", async (req, res) => {
  const userId = req.user.id;
  const { question = null, content = null, forumId } = req.body;
  const images = req.files?.map((val) => val.filename) ?? [];

  const updateData = { question, content, images };

  if (checks.isNuldefined(updateData)) {
    serve(res, codes.BAD_REQUEST, "Nothing to patch");
    return;
  }

  try {
    await Forum.update(updateData, { where: { userId, id: forumId } });
    serve(res, codes.OK, "Forum Updated");
  } catch (err) {
    console.log(err);

    serve(res, codes.INTERNAL_SERVER_ERROR, MESSAGES.SERVER_ERROR);
  }
});

router.delete("/", async (req, res) => {
  const userId = req.user.id;
  const { forumId } = req.query;

  const t = await transaction();
  try {
    await Forum.destroy(
      { userId, id: forumId },
      { transaction: t, individualHooks: true }
    );

    await t.commit();

    serve(res, codes.NO_CONTENT);
  } catch (err) {
    console.log(err);
    await t.rollback();

    serve(res, codes.INTERNAL_SERVER_ERROR, MESSAGES.SERVER_ERROR);
  }
});

router.use("/vote", VoteRouter);

router.use("/answer", AnswerRouter);

router.all("*", (_, res) => {
  res.sendStatus(405);
});

export const ForumsRouter = router;
