import { Router } from "express";
import Post from "../../models/ORM/post/posts.js";
import codes from "../../utils/codes.js";
import MESSAGES from "../../constants/messages/global.js";
import { serve } from "../../utils/response.js";
import { userInfoInclusion } from "../../db/sql/commands.js";

const router = Router();

router.get("/", async (req, res) => {
  const { postId } = req.query;

  try {
    const post = await Post.findOne({
      attributes: { exclude: ["id", "userId"] },
      where: { id: postId },
      include: [userInfoInclusion],
    });

    serve(res, codes.OK, `Post with Id ${postId}`, { post });
  } catch (err) {
    console.log(err);

    serve(res, codes.INTERNAL_SERVER_ERROR, MESSAGES.SERVER_ERROR);
  }
});

router.all("*", (_, res) => {
  res.sendStatus(405);
});

export const PostRouter = router;
