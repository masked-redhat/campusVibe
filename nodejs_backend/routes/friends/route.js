import { Router } from "express";
import codes from "../../utils/codes.js";
import { MESSAGES as m } from "../../constants/messages/friends.js";
import Friend, { alias } from "../../models/ORM/friends.js";
import { Op } from "sequelize";
import checks from "../../utils/checks.js";
import { RequestRouter } from "./request.js";
import limits from "../../constants/limits.js";
import {
  getUserIdFromUsername,
  userInfoByAlias,
} from "../../db/sql/commands.js";
import transaction from "../../db/sql/transaction.js";

const LIMIT = limits.FRIEND._;

const router = Router();

router.get("/", async (req, res) => {
  // get the user Id which will be useful
  const userId = req.user.id;

  // offset, how many friends to skip over, from request query
  const { offset: rawOffset } = req.query;
  const offset = checks.isNuldefined(rawOffset) ? 0 : parseInt(rawOffset);

  try {
    // all friends where request accepted is true
    const friends = await Friend.findAll({
      attributes: { exclude: ["updatedAt", "id", "userId", "friendId"] },
      where: {
        [Op.or]: [{ userId }, { friendId: userId }],
        requestAccepted: true,
      },
      offset,
      limit: LIMIT,
      include: [
        userInfoByAlias(alias.userId, "userId").include,
        userInfoByAlias(alias.friendId, "friendId").include,
      ],
    });

    res.ok(m.SUCCESS.FRIENDS, { friends, offsetNext: offset + friends.length });
  } catch (err) {
    console.log(err);

    res.serverError();
  }
});

router.delete("/", async (req, res) => {
  const userId = req.user.id;

  // get username from request query, for whom to unfriend
  const { username } = req.query;

  if (checks.isNuldefined(username)) return res.noParams();

  const t = await transaction();
  try {
    const friendId = await getUserIdFromUsername(username);

    if (checks.isNuldefined(friendId))
      return res.failure(codes.BAD_REQUEST, m.USERNAME_INVALID);

    await Friend.destroy({
      where: {
        [Op.or]: [
          { userId, friendId },
          { friendId: userId, userId: friendId },
        ],
        requestAccepted: true,
      },
      individualHooks: true,
      transaction: t,
    });

    await t.commit();

    res.deleted();
  } catch (err) {
    console.log(err);
    await t.rollback();

    res.serverError();
  }
});

router.use("/request", RequestRouter);

export const FriendRouter = router;
