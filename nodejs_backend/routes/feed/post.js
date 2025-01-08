import { Router } from "express";
import Post from "../../models/ORM/post/posts.js";
import { userInfoInclusion } from "../../db/sql/commands.js";
import checks from "../../utils/checks.js";

const router = Router();

router.get("/", async (req, res) => {
  // get the postId for which want the information
  const { postId } = req.query;

  // postId is required
  if (checks.isNuldefined(postId)) res.noParams();

  try {
    const post = await Post.findOne({
      attributes: { exclude: ["id", "userId"] },
      where: { id: postId },
      ...userInfoInclusion,
    });

    res.ok(`Post with Id ${postId}`, { post });
  } catch (err) {
    console.log(err);

    res.serverError();
  }
});

export const PostRouter = router;
