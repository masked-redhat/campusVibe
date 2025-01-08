import { ValidationError } from "sequelize";
import transaction from "../db/sql/transaction.js";
import PostCommentVote from "../models/ORM/post/post_comments_votes.js";
import checks from "./checks.js";

const postVote = async (
  commentId,
  voteVal,
  userId,
  res,
  entity = PostCommentVote
) => {
  if (checks.isNuldefined(commentId)) return res.noParams();

  const t = await transaction();
  try {
    const prev = await entity.findOne({
      where: { commentId, userId },
    });

    // if not voted then, create a vote
    // if do voted, then update the vote
    if (checks.isNuldefined(prev))
      await entity.create(
        {
          vote: voteVal,
          commentId,
          userId,
        },
        { transaction: t }
      );
    else {
      if (prev.vote === voteVal)
        return res.failure(codes.BAD_REQUEST, m.SAME_VOTE);

      await entity.update(
        { vote: voteVal },
        {
          where: { commentId, userId },
          individualHooks: true,
          transaction: t,
        }
      );
    }

    await t.commit();

    res.ok(m.VOTED);
  } catch (err) {
    console.log(err);
    await t.rollback();

    if (err instanceof ValidationError) return res.invalidParams();

    res.serverError();
  }
};

export default postVote;
