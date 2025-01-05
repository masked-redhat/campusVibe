import { Router } from "express";
import { serve } from "../../utils/response.js";
import codes from "../../utils/codes.js";
import MESSAGES from "../../constants/messages/global.js";
import Friend, { alias } from "../../models/ORM/friends.js";
import { Op } from "sequelize";
import checks from "../../utils/checks.js";
import { RequestRouter } from "./request.js";
import limits from "../../constants/limits.js";
import { userInfoByAlias } from "../../db/sql/commands.js";
import User from "../../models/ORM/user.js";
import transaction from "../../db/sql/transaction.js";

const router = Router();

const LIMIT = limits.FRIEND._;

router.get("/", async (req, res) => {
  const uid = req.user.id;
  const { offset: rawOffset } = req.query;
  const offset = checks.isNuldefined(rawOffset) ? 0 : parseInt(rawOffset);

  try {
    const friends = await Friend.findAll({
      attributes: { exclude: ["updatedAt", "id", "userId", "friendId"] },
      where: {
        [Op.or]: [{ userId: uid }, { friendId: uid }],
        requestAccepted: true,
      },
      offset,
      limit: LIMIT,
      include: [
        userInfoByAlias(alias.userId, "userId"),
        userInfoByAlias(alias.friendId, "friendId"),
      ],
    });

    serve(res, codes.OK, "Friends", {
      friends,
      offsetNext: offset + friends.length,
    });
  } catch (err) {
    console.log(err);

    serve(res, codes.INTERNAL_SERVER_ERROR, MESSAGES.SERVER_ERROR);
  }
});

router.use("/request", RequestRouter);

router.delete("/", async (req, res) => {
  const uid = req.user.id;
  const { username } = req.query;

  if (checks.isNuldefined(username)) {
    serve(res, codes.BAD_REQUEST, "No username found in request");
    return;
  }

  const t = await transaction();
  try {
    const friend = await User.findOne({
      attributes: ["id"],
      where: { username },
    });

    if (checks.isNuldefined(friend)) {
      serve(res, codes.BAD_REQUEST, "No user with that username");
      return;
    }

    const friendId = friend.id;

    const friendDelete = await Friend.destroy({
      where: {
        [Op.or]: [
          { userId: uid, friendId: friendId },
          { friendId: uid, userId: friendId },
        ],
        requestAccepted: true,
      },
      individualHooks: true,
      transaction: t,
    });

    await t.commit();

    serve(res, codes.NO_CONTENT);
  } catch (err) {
    console.log(err);
    await t.rollback();

    serve(res, codes.INTERNAL_SERVER_ERROR, MESSAGES.SERVER_ERROR);
  }
});

router.all("*", (_, res) => {
  res.sendStatus(405);
});

export const FriendRouter = router;
