import { Router } from "express";
import { serve } from "../../utils/response.js";
import codes from "../../utils/codes.js";
import MESSAGES from "../../constants/messages/global.js";
import Friend, { alias } from "../../models/ORM/friends.js";
import { Op } from "sequelize";
import User from "../../models/ORM/user.js";
import checks from "../../utils/checks.js";
import { RequestRouter } from "./request.js";
import limits from "../../constants/limits.js";

const router = Router();

const LIMIT = limits.FRIEND._;

router.get("/", async (req, res) => {
  const uid = req.user.id;
  const { offset: rawOffset } = req.query;
  const offset = checks.isNuldefined(rawOffset) ? 0 : parseInt(rawOffset);

  try {
    const friends = await Friend.findAll({
      attributes: { exclude: ["updatedAt", "id"] },
      where: {
        [Op.or]: [{ userId: uid }, { friendId: uid }],
        requestAccepted: true,
      },
      offset,
      limit: LIMIT,
      include: [
        {
          model: User,
          as: alias.userId,
          foreignKey: "userId",
          attributes: ["username"],
        },
        {
          model: User,
          as: alias.friendId,
          foreignKey: "friendId",
          attributes: ["username"],
        },
      ],
    });

    console.log(friends);
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
  const { friendId } = req.body;

  try {
    const friendDelete = await Friend.destroy({
      where: {
        [Op.or]: [
          { userId: uid, friendId: friendId },
          { friendId: uid, userId: friendId },
        ],
        requestAccepted: true,
      },
    });

    serve(res, codes.NO_CONTENT);
  } catch (err) {
    console.log(err);

    serve(res, codes.INTERNAL_SERVER_ERROR, MESSAGES.SERVER_ERROR);
  }
});

router.all("*", (_, res) => {
  res.sendStatus(405);
});

export const FriendRouter = router;
