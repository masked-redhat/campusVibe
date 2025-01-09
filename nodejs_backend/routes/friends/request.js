import { Router } from "express";
import codes from "../../utils/codes.js";
import { MESSAGES as m } from "../../constants/messages/friends.js";
import Friend, { alias } from "../../models/ORM/friends.js";
import checks from "../../utils/checks.js";
import { Op, ValidationError } from "sequelize";
import limits from "../../constants/limits.js";
import {
  getUserIdFromUsername,
  userInfoByAlias,
} from "../../db/sql/commands.js";
import transaction from "../../db/sql/transaction.js";

const LIMIT = limits.FRIEND.REQUEST;

const router = Router();

router.get("/", async (req, res) => {
  const userId = req.user.id;

  // get the parameters from request query
  const {
    offset: rawOffset,
    sent: requestSent,
    recieved: requestRecieved,
    accepted: requestAccepted,
    rejected: requestRejected,
  } = req.query;

  // modify the parameters as appropriate
  const offset = checks.isNuldefined(rawOffset) ? 0 : parseInt(rawOffset);
  const sent = !checks.isNuldefined(requestSent),
    recieved = !checks.isNuldefined(requestRecieved);

  const whereObj = sent ? { userId } : recieved ? { friendId: userId } : null;
  const accepted = checks.isTrue(requestAccepted);
  const rejected = checks.isTrue(requestRejected);

  // if no where object, to make a search
  // sent or recieved have to be given by user
  if (checks.isNuldefined(whereObj)) return res.noParams();

  try {
    const requests = await Friend.findAll({
      attributes: { exclude: ["updatedAt", "id", "userId", "friendId"] },
      where: {
        ...whereObj,
        requestAccepted: accepted,
        requestRejected: rejected,
      },
      offset,
      limit: LIMIT,
      order: [["updatedAt", "desc"]],
      include: [
        userInfoByAlias(alias.userId, "userId"),
        userInfoByAlias(alias.friendId, "friendId"),
      ],
    });

    res.ok(m.SUCCESS.REQUESTS, {
      requests,
      offsetNext: offset + requests.length,
    });
  } catch (err) {
    console.log(err);

    res.serverError();
  }
});

router.get("/all", async (req, res) => {
  const userId = req.user.id;

  // get the parameters from request query
  const { offset: rawOffset } = req.query;
  const offset = checks.isNuldefined(rawOffset) ? 0 : parseInt(rawOffset);

  try {
    const requests = await Friend.findAll({
      attributes: { exclude: ["updatedAt", "id", "userId", "friendId"] },
      where: {
        [Op.or]: [{ userId }, { friendId: userId }],
        requestAccepted: false,
      },
      offset,
      limit: LIMIT,
      order: [["updatedAt", "desc"]],
      include: [
        userInfoByAlias(alias.userId, "userId"),
        userInfoByAlias(alias.friendId, "friendId"),
      ],
    });

    res.ok(m.SUCCESS.REQUESTS, {
      requests,
      offsetNext: offset + requests.length,
    });
  } catch (err) {
    console.log(err);

    res.serverError();
  }
});

router.post("/", async (req, res) => {
  const userId = req.user.id;

  // get the username you want to request for friend
  const { username } = req.body;

  // username if required to send a friend request
  if (checks.isNuldefined(username)) return res.noParams();

  // if username is same as user's
  if (username === req.user.username)
    return res.failure(codes.BAD_REQUEST, m.REQUEST_TO_SELF);

  try {
    const friendId = await getUserIdFromUsername(username);

    if (checks.isNuldefined(friendId))
      return res.failure(codes.BAD_REQUEST, m.USERNAME_INVALID);

    // find if there already exist a request/friendship between
    // both users
    let friendFound = await Friend.findOne({
      where: {
        [Op.or]: [
          { userId, friendId },
          { friendId: userId, userId: friendId },
        ],
      },
    });

    // if no relation (never sent a request, nor are friends)
    if (checks.isNuldefined(friendFound))
      await Friend.create({ userId, friendId });
    // if already friends
    else if (friendFound.requestAccepted === true)
      return res.failure(codes.BAD_REQUEST, m.FRIENDS_ALREADY);
    // if the requested user had rejected the user
    else if (friendFound.requestRejected === true)
      await Friend.update(
        { requestRejected: false },
        { individualHooks: true }
      );
    // if request already sent, but no action was taken by user
    else if (!friendFound.requestAccepted && !friendFound.requestRejected)
      return res.failure(codes.BAD_REQUEST, m.REQUEST_SENT_ALREADY);

    res.created(m.REQUEST_SENT);
  } catch (err) {
    console.log(err);

    if (err instanceof ValidationError) return res.invalidParams();

    res.serverError();
  }
});

router.post("/accept", async (req, res) => {
  const userId = req.user.id;

  // get username from request body
  const { username } = req.body;

  // username is required
  if (checks.isNuldefined(username)) return res.noParams();

  const t = await transaction();
  try {
    const friendId = await getUserIdFromUsername(username);

    if (checks.isNuldefined(friendId))
      return res.failure(codes.BAD_REQUEST, m.USERNAME_INVALID);

    // make the request accepted field true
    const [acceptRequest] = await Friend.update(
      { requestAccepted: true },
      {
        where: { userId: friendId, friendId: userId },
        individualHooks: true,
        transaction: t,
      }
    );

    await t.commit();

    if (acceptRequest === 0)
      return res.failure(codes.BAD_REQUEST, m.NO_REQUEST_SENT_WHY.ACCEPT);

    res.ok(m.REQUEST_ACCEPTED);
  } catch (err) {
    console.log(err);
    await t.rollback();

    if (err instanceof ValidationError) return res.invalidParams();

    res.serverError();
  }
});

router.post("/reject", async (req, res) => {
  const userId = req.user.id;

  // get username from request body
  const { username } = req.body;

  // username is required
  if (checks.isNuldefined(username)) return res.noParams();

  try {
    const friendId = await getUserIdFromUsername(username);

    if (checks.isNuldefined(friendId))
      return res.failure(codes.BAD_REQUEST, m.USERNAME_INVALID);

    // make the request rejected field true
    const [rejectRequest] = await Friend.update(
      { requestRejected: true },
      { where: { userId: friendId, friendId: userId }, individualHooks: true }
    );

    if (rejectRequest === 0)
      return res.failure(codes.BAD_REQUEST, m.NO_REQUEST_SENT_WHY.REJECT);

    res.ok(m.REQUEST_REJECTED);
  } catch (err) {
    console.log(err);

    if (err instanceof ValidationError) return res.invalidParams();

    res.serverError();
  }
});

router.delete("/", async (req, res) => {
  const userId = req.user.id;

  // get the username from request query
  const { username } = req.query;

  // username is required
  if (checks.isNuldefined(username)) return res.noParams();

  try {
    const friendId = await getUserIdFromUsername(username);

    if (checks.isNuldefined(friendId))
      return res.failure(codes.BAD_REQUEST, m.USERNAME_INVALID);

    // destroy the request if not already friends and already not rejected
    const deleted = await Friend.destroy({
      where: { userId, friendId },
      requestAccepted: false,
      requestRejected: false,
    });

    if (deleted === 0)
      return res.failure(codes.BAD_REQUEST, m.NO_REQUEST_SENT_WHY.DELETE);

    res.deleted();
  } catch (err) {
    console.log(err);

    res.serverError();
  }
});

export const RequestRouter = router;
