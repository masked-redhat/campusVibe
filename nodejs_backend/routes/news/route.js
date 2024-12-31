import { Router } from "express";
import codes from "../../utils/codes.js";
import { serve } from "../../utils/response.js";
import MESSAGES from "../../constants/messages/global.js";
import News from "../../models/ODM/news.js";
import checks from "../../utils/checks.js";
import { Error } from "mongoose";

const router = Router();

const LIMIT = 20;

router.get("/", async (req, res) => {
  const { offset: rawOffset, newsId } = req.query;
  const offset = checks.isNuldefined(rawOffset) ? 0 : parseInt(rawOffset);

  try {
    const news = checks.isNuldefined(newsId)
      ? await News.find().skip(offset).limit(LIMIT)
      : await News.find({ _id: newsId }).skip(offset).limit(LIMIT);

    serve(res, codes.OK, "News", { news });
  } catch (err) {
    console.log(err);

    serve(res, codes.INTERNAL_SERVER_ERROR, MESSAGES.SERVER_ERROR);
  }
});

router.post("/", async (req, res) => {
  const username = req.user.username;

  if (username !== "admin") {
    serve(res, codes.FORBIDDEN, "Not allowed to post news if not admin");
    return;
  }

  let { title, content } = req.body;
  const images = req.files?.map((val) => val.filename) ?? [];
  if (checks.isNuldefined(title)) title = null;
  if (checks.isNuldefined(content)) {
    serve(res, codes.BAD_REQUEST, "There has to be content in news");
    return;
  }

  try {
    const newNews = await News.create({
      title,
      content,
      images,
    });

    serve(res, codes.CREATED, "News created", { id: newNews.id });
  } catch (err) {
    console.log(err);

    serve(res, codes.INTERNAL_SERVER_ERROR, MESSAGES.SERVER_ERROR);
  }
});

router.patch("/", async (req, res) => {
  const username = req.user.username;

  if (username !== "admin") {
    serve(res, codes.FORBIDDEN, "Not allowed to post news if not admin");
    return;
  }

  let { title, content, newsId } = req.body;
  const images = req.files?.map((val) => val.filename) ?? [];

  if (checks.isNuldefined(newsId)) {
    serve(res, codes.BAD_REQUEST, "News Id not given");
    return;
  }

  const updateData = Object.fromEntries(
    Object.entries({
      title,
      content,
      images,
    }).filter(([_, value]) => !checks.isNuldefined(value))
  );

  try {
    const newNews = await News.updateOne({ _id: newsId }, updateData);

    serve(res, codes.OK, "News updated");
  } catch (err) {
    console.log(err);

    if (err instanceof Error.CastError) {
      serve(res, codes.BAD_REQUEST, "News id in invalid format");
      return;
    }

    serve(res, codes.INTERNAL_SERVER_ERROR, MESSAGES.SERVER_ERROR);
  }
});

router.put("/", async (req, res) => {
  const username = req.user.username;

  if (username !== "admin") {
    serve(res, codes.FORBIDDEN, "Not allowed to post news if not admin");
    return;
  }

  let { title, content, newsId } = req.body;
  const images = req.files?.map((val) => val.filename) ?? [];

  if (checks.isNuldefined(newsId)) {
    serve(res, codes.BAD_REQUEST, "News Id not given");
    return;
  }

  if (checks.isNuldefined(title)) title = null;
  if (checks.isNuldefined(content)) {
    serve(res, codes.BAD_REQUEST, "There has to be content in news");
    return;
  }

  try {
    const newNews = await News.updateOne(
      { _id: newsId },
      { title, content, images }
    );

    serve(res, codes.OK, "News updated");
  } catch (err) {
    console.log(err);

    if (err instanceof Error.CastError) {
      serve(res, codes.BAD_REQUEST, "News id in invalid format");
      return;
    }

    serve(res, codes.INTERNAL_SERVER_ERROR, MESSAGES.SERVER_ERROR);
  }
});

router.delete("/", async (req, res) => {
  const username = req.user.username;

  if (username !== "admin") {
    serve(res, codes.FORBIDDEN, "Not allowed to post news if not admin");
    return;
  }

  const { newsId } = req.query;

  try {
    const deleted = await News.deleteOne({ _id: newsId });

    if (!(deleted.acknowledged === true && deleted.deletedCount === 1)) {
      serve(res, codes.BAD_REQUEST, "news Id given was invalid");
      return;
    }

    serve(res, codes.NO_CONTENT);
  } catch (err) {
    console.log(err);

    if (err instanceof Error.CastError) {
      serve(res, codes.BAD_REQUEST, "News id in invalid format");
      return;
    }

    serve(res, codes.INTERNAL_SERVER_ERROR, MESSAGES.SERVER_ERROR);
  }
});

router.all("*", (_, res) => {
  res.sendStatus(405);
});

export const NewsRouter = router;
