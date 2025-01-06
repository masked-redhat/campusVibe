import { Router } from "express";
import ForumVote from "../../models/ORM/forum/forum_votes.js";
import limits from "../../constants/limits.js";
import { simpleOrder } from "../posts/route.js";
import { userInfoInclusion } from "../../db/sql/commands.js";
import checks from "../../utils/checks.js";
import { serve } from "../../utils/response.js";
import MESSAGES from "../../constants/messages/global.js";
import codes from "../../utils/codes.js";
import transaction from "../../db/sql/transaction.js";

const router = Router();

const LIMIT = limits.FORUM.VOTE;

router.get("/", async (req, res) => {
  const { offset: rawOffset, forumId } = req.query;
  const offset = checks.isNuldefined(rawOffset) ? 0 : parseInt(rawOffset);

  if (checks.isNuldefined(forumId)) {
    serve(res, codes.BAD_REQUEST, "No forum Id found in request");
    return;
  }

  try {
    const votes = await ForumVote.findAll({
      where: { forumId },
      limit: LIMIT,
      offset,
      order: simpleOrder("createdAt"),
      include: [userInfoInclusion],
    });

    serve(res, codes.OK, "Votes", { votes, offsetNext: offset + votes.length });
  } catch (err) {
    console.log(err);

    serve(res, codes.INTERNAL_SERVER_ERROR, MESSAGES.SERVER_ERROR);
  }
});

router.post("/", async (req, res) => {
  let { forumId, voteVal: num } = req.body;

  try {
    num = parseInt(num);
  } catch (err) {
    console.log(err);

    serve(res, codes.BAD_REQUEST, "Invalid parameters given");
    return;
  }

  const voteVal = num;

  if (![-1, 0, 1].includes(voteVal)) {
    serve(res, codes.BAD_REQUEST, "Invalid parameters given");
    return;
  }

  let vote;
  const t = await transaction();
  try {
    const find = await ForumVote.findOne({
      where: { forumId, userId: req.user.id },
    });

    if (checks.isNuldefined(find))
      vote = await ForumVote.create(
        {
          vote: voteVal,
          forumId,
          userId: req.user.id,
        },
        { transaction: t }
      );
    else
      vote = await ForumVote.update(
        { vote: voteVal },
        {
          where: { forumId, userId: req.user.id },
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

router.all("*", (_, res) => {
  res.sendStatus(405);
});

export const VoteRouter = router;
