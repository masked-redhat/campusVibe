import { Router } from "express";
import Post from "../../models/ORM/post/posts.js";
import codes from "../../utils/codes.js";
import MESSAGES from "../../constants/messages/global.js";
import { MESSAGES as m } from "../../constants/messages/posts.js";
import { serve } from "../../utils/response.js";
import checks from "../../utils/checks.js";
import { ValidationError } from "sequelize";
import { LikeRouter } from "./like.js";
import { CommentRouter } from "./comment.js";
import limits from "../../constants/limits.js";
import { userInfoInclusion } from "../../db/sql/commands.js";
import transaction from "../../db/sql/transaction.js";
import User from "../../models/ORM/user.js";

const router = Router();

const LIMIT = limits.POST._;
export const simpleOrder = (field) => [[field, "desc"]];

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

    const posts = await Post.findAll({
      attributes: { exclude: ["userId"] },
      where: { userId },
      offset,
      limit: LIMIT,
      order: simpleOrder("createdAt"),
      include: [userInfoInclusion],
    });

    serve(res, codes.OK, m.POSTS_FOUND, {
      posts,
      offsetNext: posts.length + offset,
    });
    return;
  } catch (err) {
    console.log(err);

    serve(res, codes.INTERNAL_SERVER_ERROR, MESSAGES.SERVER_ERROR);
    return;
  }
});

router.post("/", async (req, res) => {
  const { title, content, reposts } = req.body;
  const images = req.files?.map((val) => val.filename) ?? [];

  let post;
  const t = await transaction();
  try {
    post = await Post.create(
      {
        userId: req.user.id,
        title: title ?? null,
        content: content ?? null,
        images: images ?? [],
        reposts: reposts ?? [],
      },
      { transaction: t }
    );

    await t.commit();
  } catch (err) {
    console.log(err);
    await t.rollback();

    if (err instanceof ValidationError) {
      serve(res, codes.BAD_REQUEST, m.INVALID_VALUES);
      return;
    }

    serve(res, codes.INTERNAL_SERVER_ERROR, MESSAGES.SERVER_ERROR);
    return;
  }

  serve(res, codes.CREATED, m.CREATED, { postId: post.id });
});

router.use("/like", LikeRouter);

router.patch("/", async (req, res) => {
  const { title, content, reposts, postId } = req.body;
  const images = req.files?.map((val) => val.filename) ?? [];

  const updateData = Object.fromEntries(
    Object.entries({
      title,
      content,
      images,
      reposts,
    }).filter(([_, value]) => !checks.isNuldefined(value))
  );

  try {
    const [post] = await Post.update(updateData, {
      where: { id: postId, userId: req.user.id },
    });

    if (post === 0) {
      serve(res, codes.BAD_REQUEST, m.ID_WRONG_NO_ACCESS);
      return;
    }
  } catch (err) {
    console.log(err);

    serve(res, codes.INTERNAL_SERVER_ERROR, MESSAGES.SERVER_ERROR);
    return;
  }

  serve(res, codes.OK, m.POST_UPDATED);
});

router.put("/", async (req, res) => {
  const { title, content, reposts, postId } = req.body;
  const images = req.files?.map((val) => val.filename) ?? [];

  const updateData = { title, content, images, reposts };

  try {
    const [post] = await Post.update(updateData, {
      where: { id: postId, userId: req.user.id },
    });

    if (post === 0) {
      serve(res, codes.BAD_REQUEST, m.ID_WRONG_NO_ACCESS);
      return;
    }
  } catch (err) {
    console.log(err);

    if (err instanceof ValidationError) {
      serve(res, codes.BAD_REQUEST, m.INVALID_VALUES);
      return;
    }

    serve(res, codes.INTERNAL_SERVER_ERROR, MESSAGES.SERVER_ERROR);
    return;
  }

  serve(res, codes.OK, m.POST_UPDATED);
});

router.delete("/", async (req, res) => {
  const { postId } = req.query;

  const t = await transaction();
  try {
    const post = await Post.destroy({
      where: { id: postId, userId: req.user.id },
      individualHooks: true,
      transaction: t,
    });

    await t.commit();

    if (post === 0) {
      serve(res, codes.BAD_REQUEST, m.ID_WRONG_NO_ACCESS);
      return;
    }
  } catch (err) {
    console.log(err);
    await t.rollback();

    serve(res, codes.INTERNAL_SERVER_ERROR, MESSAGES.SERVER_ERROR);
    return;
  }

  serve(res, codes.NO_CONTENT);
});

router.use("/comment", CommentRouter);

router.all("*", (_, res) => {
  res.sendStatus(405);
});

export const PostsRouter = router;
