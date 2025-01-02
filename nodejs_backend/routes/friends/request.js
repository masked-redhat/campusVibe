import { Router } from "express";
import { serve } from "../../utils/response.js";
import codes from "../../utils/codes.js";
import MESSAGES from "../../constants/messages/global.js";
import Friend, { alias } from "../../models/ORM/friends.js";
import User from "../../models/ORM/user.js";
import checks from "../../utils/checks.js";
import { simpleOrder } from "../posts/route.js";
import { Op } from "sequelize";
import limits from "../../constants/limits.js";

const router = Router();

const LIMIT = limits.FRIEND.REQUEST;

router.get("/", async (req, res) => {
  const uid = req.user.id;
  const {
    offset: rawOffset,
    sent: requestSent,
    recieved: requestRecieved,
    accepted: requestAccepted,
    rejected: requestRejected,
  } = req.query;
  const offset = checks.isNuldefined(rawOffset) ? 0 : parseInt(rawOffset);
  const sent = !checks.isNuldefined(requestSent),
    recieved = !checks.isNuldefined(requestRecieved);

  const whereObj = sent ? { userId: uid } : recieved ? { friendId: uid } : null;
  const accepted = checks.isTrue(requestAccepted);
  const rejected = checks.isTrue(requestRejected);

  if (checks.isNuldefined(whereObj)) {
    serve(res, codes.BAD_REQUEST, "Add sent or recieved parameters to true");
    return;
  }

  try {
    const requests = await Friend.findAll({
      attributes: { exclude: ["updatedAt", "id"] },
      where: {
        ...whereObj,
        requestAccepted: accepted,
        requestRejected: rejected,
      },
      offset,
      limit: LIMIT,
      order: simpleOrder("updatedAt"),
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

    serve(res, codes.OK, "Requests", {
      requests,
      offsetNext: offset + requests.length,
    });
  } catch (err) {
    console.log(err);

    serve(res, codes.INTERNAL_SERVER_ERROR, MESSAGES.SERVER_ERROR);
  }
});

router.get("/all", async (req, res) => {
  const uid = req.user.id;
  const { offset: rawOffset } = req.query;
  const offset = checks.isNuldefined(rawOffset) ? 0 : parseInt(rawOffset);

  try {
    const requests = await Friend.findAll({
      attributes: { exclude: ["updatedAt", "id"] },
      where: {
        [Op.or]: [{ userId: uid }, { friendId: uid }],
        requestAccepted: false,
      },
      offset,
      limit: LIMIT,
      order: simpleOrder("updatedAt"),
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

    serve(res, codes.OK, "Requests", {
      requests,
      offsetNext: offset + requests.length,
    });
  } catch (err) {
    console.log(err);

    serve(res, codes.INTERNAL_SERVER_ERROR, MESSAGES.SERVER_ERROR);
  }
});

router.post("/", async (req, res) => {
  const uid = req.user.id;
  const { friendId } = req.body;

  try {
    let friendFound = await Friend.findOne({
      where: {
        [Op.or]: [
          { userId: uid, friendId },
          { friendId: uid, userId: friendId },
        ],
      },
    });

    if (checks.isNuldefined(friendFound)) {
      await Friend.create({
        userId: uid,
        friendId,
      });
    } else if (friendFound.requestAccepted === true) {
      serve(res, codes.BAD_REQUEST, "Already friends");
      return;
    } else if (friendFound.requestRejected === true) {
      await Friend.update({
        requestRejected: false,
      });
    }

    serve(res, codes.CREATED, "Friend Request Sent");
  } catch (err) {
    console.log(err);

    serve(res, codes.INTERNAL_SERVER_ERROR, MESSAGES.SERVER_ERROR);
  }
});

router.post("/accept", async (req, res) => {
  const uid = req.user.id;
  const { friendId } = req.body;

  try {
    const acceptRequest = await Friend.update(
      { requestAccepted: true },
      {
        where: {
          userId: friendId,
          friendId: uid,
        },
      }
    );

    serve(res, codes.OK, "Friend Request Accepted");
  } catch (err) {
    console.log(err);

    serve(res, codes.INTERNAL_SERVER_ERROR, MESSAGES.SERVER_ERROR);
  }
});

router.post("/reject", async (req, res) => {
  const uid = req.user.id;
  const { friendId } = req.body;

  try {
    const rejectRequest = await Friend.update(
      { requestRejected: true },
      {
        where: {
          userId: friendId,
          friendId: uid,
        },
      }
    );

    serve(res, codes.OK, "Friend Request Rejected");
  } catch (err) {
    console.log(err);

    serve(res, codes.INTERNAL_SERVER_ERROR, MESSAGES.SERVER_ERROR);
  }
});

router.delete("/", async (req, res) => {
  const uid = req.user.id;
  const { friendId } = req.body;

  try {
    const deleted = await Friend.destroy({
      where: {
        userId: uid,
        friendId,
      },
      requestAccepted: false,
      requestRejected: false,
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

export const RequestRouter = router;