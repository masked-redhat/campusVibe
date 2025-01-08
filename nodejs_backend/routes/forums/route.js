import { Router } from "express";
import limits from "../../constants/limits.js";
import checks from "../../utils/checks.js";
import Forum from "../../models/ORM/forum/forums.js";
import { userInfoInclusion } from "../../db/sql/commands.js";
import codes from "../../utils/codes.js";
import { MESSAGES as m } from "../../constants/messages/forum.js";
import transaction from "../../db/sql/transaction.js";
import { VoteRouter } from "./forum_vote.js";
import { ValidationError } from "sequelize";

const LIMIT = limits.FORUM._;

const router = Router();

router.get("/", async (req, res) => {
  // get the username and offset, username if you want a specific
  // user's forums
  const { offset: rawOffset, username } = req.query;
  const offset = checks.isNuldefined(rawOffset) ? 0 : parseInt(rawOffset);

  try {
    const userId =
      username && username !== req.user.username
        ? await getUserIdFromUsername(username)
        : req.user.id;

    // if no user Id
    if (checks.isNuldefined(userId))
      return res.failure(codes.BAD_REQUEST, m.USERNAME_INVALID);

    const forums = await Forum.findAll({
      attributes: { exclude: "userId" },
      where: { userId },
      offset,
      limit: LIMIT,
      order: [["updatedAt", "desc"]],
      ...userInfoInclusion,
    });

    res.ok(m.SUCCESS.FORUMS, { forums, offsetNext: offset + forums.length });
  } catch (err) {
    console.log(err);

    res.serverError();
  }
});

router.post("/", async (req, res) => {
  const userId = req.user.id;

  // get the parameters from request body
  const { question = null, content, images = [] } = req.body;

  // question is required for a forum
  if (checks.isNuldefined(question)) return res.noParams();

  const t = await transaction();
  try {
    const forum = await Forum.create(
      { userId, question, content, images },
      { attributes: ["id"], transaction: t }
    );

    await t.commit();

    res.created(m.CREATED, { forumId: forum.id });
  } catch (err) {
    console.log(err);
    await t.rollback();

    if (err instanceof ValidationError) return res.invalidParams();

    res.serverError();
  }
});

router.patch("/", async (req, res) => {
  const userId = req.user.id;

  // get the parameters from request body
  const { question = null, content, forumId = null, images = [] } = req.body;

  // forum Id is required to update that forum
  if (checks.isNuldefined(forumId)) return res.noParams();

  // udpate only data that is provided
  const updateData = Object.fromEntries(
    Object.entries({ question, content, images }).filter(
      ([_, value]) => !checks.isNuldefined(value)
    )
  );

  // if no update data
  if (checks.isNuldefined(updateData)) return res.ok(m.NO_PARAMS);

  try {
    await Forum.update(updateData, { where: { userId, id: forumId } });

    res.ok(m.UPDATED);
  } catch (err) {
    console.log(err);

    if (err instanceof ValidationError) return res.invalidParams();

    res.serverError();
  }
});

router.put("/", async (req, res) => {
  const userId = req.user.id;

  // get the parameters from request body
  const { question = null, content, forumId = null, images = [] } = req.body;

  // forum Id is required to update that forum
  if (checks.isAnyValueNull([question, forumId])) return res.noParams();

  // udpate all
  const updateData = { question, content: content ?? null, images };

  try {
    await Forum.update(updateData, { where: { userId, id: forumId } });

    res.ok(m.UPDATED);
  } catch (err) {
    console.log(err);

    if (err instanceof ValidationError) return res.invalidParams();

    res.serverError();
  }
});

router.delete("/", async (req, res) => {
  const userId = req.user.id;

  // get forum id from request query
  const { forumId } = req.query;

  // forum Id is required to delete the forum
  if (checks.isNuldefined(forumId)) return res.noParams();

  const t = await transaction();
  try {
    await Forum.destroy(
      { userId, id: forumId },
      { transaction: t, individualHooks: true }
    );

    await t.commit();

    res.deleted();
  } catch (err) {
    console.log(err);
    await t.rollback();

    res.serverError();
  }
});

router.use("/vote", VoteRouter);

export const ForumsRouter = router;
