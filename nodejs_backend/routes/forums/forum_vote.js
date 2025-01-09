import { Router } from "express";
import ForumVote from "../../models/ORM/forum/forum_votes.js";
import limits from "../../constants/limits.js";
import { userInfoInclusion } from "../../db/sql/commands.js";
import checks from "../../utils/checks.js";
import { MESSAGES as m } from "../../constants/messages/forum.js";
import postVote from "../../utils/comment.js";

const LIMIT = limits.FORUM.VOTE;

const router = Router();

router.get("/", async (req, res) => {
  const { forumId, offset: rawOffset } = req.query;
  const offset = checks.isNuldefined(rawOffset) ? 0 : parseInt(rawOffset);

  // forumId is required
  if (checks.isNuldefined(forumId)) return res.noParams();

  try {
    // get votes of which they are not zero
    const votes = await ForumVote.findAll({
      where: { forumId, vote: { $ne: 0 } },
      limit: LIMIT,
      offset,
      order: [["createdAt", "desc"]],
      include: [userInfoInclusion]
    });

    res.ok(m.SUCCESS.VOTES, { votes, offsetNext: offset + votes.length });
  } catch (err) {
    console.log(err);

    res.serverError();
  }
});

router.post("/upvote", async (req, res) => {
  // get the forumId from the request body
  const { forumId } = req.body;
  const voteVal = 1;

  postVote(forumId, voteVal, req.user.id, res, ForumVote);
});

router.post("/downvote", async (req, res) => {
  // get the forumId from the request body
  const { forumId } = req.body;
  const voteVal = -1;

  postVote(forumId, voteVal, req.user.id, res, ForumVote);
});

router.post("/vote/reset", async (req, res) => {
  // get the forumId from the request body
  const { forumId } = req.body;
  const voteVal = 0;

  postVote(forumId, voteVal, req.user.id, res, ForumVote);
});

export const VoteRouter = router;
