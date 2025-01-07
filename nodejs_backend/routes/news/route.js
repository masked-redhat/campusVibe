import { Router } from "express";
import codes from "../../utils/codes.js";
import { serve } from "../../utils/response.js";
import { MESSAGES as m } from "../../constants/messages/news.js";
import News from "../../models/ODM/news.js";
import checks from "../../utils/checks.js";
import { Error } from "mongoose";
import { ADMIN } from "../../constants/env.js";

const router = Router();

const LIMIT = 20;

router.get("/", async (req, res) => {
  // get offset and newsId from request query
  const { offset: rawOffset, newsId } = req.query;
  const offset = checks.isNuldefined(rawOffset) ? 0 : parseInt(rawOffset);

  try {
    // get all news if no specific newsId is given
    const news = checks.isNuldefined(newsId)
      ? await News.find().skip(offset).limit(LIMIT)
      : await News.find({ _id: newsId }).skip(offset).limit(LIMIT);

    res.ok(m.FOUND, { news });
  } catch (err) {
    console.log(err);

    res.serverError();
  }
});

router.post("/", async (req, res) => {
  const username = req.user.username;

  // if user not admin, then not allowed
  if (!checks.isTrue(username, ADMIN)) return res.forbidden();

  // get the news's title, content and images from request body
  let { title, content, images = [] } = req.body;

  if (checks.isAnyValueNull([title, content, images])) return res.noParams();

  try {
    const newNews = await News.create({ title, content, images });

    res.created(m.CREATED, { id: newNews.id });
  } catch (err) {
    console.log(err);

    res.serverError();
  }
});

router.patch("/", async (req, res) => {
  const username = req.user.username;

  // if user not admin, then not allowed
  if (!checks.isTrue(username, ADMIN)) return res.forbidden();

  let { title, content, images, newsId } = req.body;

  if (checks.isNuldefined(newsId)) return res.noParams();

  // whatever parameters are given, only those have to be updated
  const updateData = Object.fromEntries(
    Object.entries({ title, content, images }).filter(
      ([_, value]) => !checks.isNuldefined(value)
    )
  );

  try {
    await News.updateOne({ _id: newsId }, updateData);

    res.ok(m.UPDATED);
  } catch (err) {
    console.log(err);

    // if id could not be cast to mongodb id
    if (err instanceof Error.CastError)
      return res.failure(codes.BAD_REQUEST, m.ID_INVALID);

    res.serverError();
  }
});

router.put("/", async (req, res) => {
  const username = req.user.username;

  // if user not admin, then not allowed
  if (!checks.isTrue(username, ADMIN)) return res.forbidden();

  let { title, content, images, newsId } = req.body;

  // if required parameters not given
  if (checks.isAnyValueNull([title, content, images, newsId]))
    return res.noParams();

  try {
    await News.updateOne({ _id: newsId }, { title, content, images });

    res.ok(m.UPDATED);
  } catch (err) {
    console.log(err);

    if (err instanceof Error.CastError)
      return res.failure(codes.BAD_REQUEST, m.ID_INVALID);

    res.serverError();
  }
});

router.delete("/", async (req, res) => {
  const username = req.user.username;

  if (username !== ADMIN) return res.forbidden();

  // get news Id from query
  const { newsId } = req.query;

  if (checks.isNuldefined(newsId)) return res.noParams();

  try {
    const deleted = await News.deleteOne({ _id: newsId });

    // if not deleted, then bad request
    if (!(deleted.acknowledged === true && deleted.deletedCount === 1))
      return res.failure(codes.BAD_REQUEST, m.ID_INVALID);

    res.deleted();
  } catch (err) {
    console.log(err);

    if (err instanceof Error.CastError)
      return res.failure(codes.BAD_REQUEST, m.ID_INVALID);

    res.serverError();
  }
});

export const NewsRouter = router;
