import { MESSAGES as commentMessage } from "./comments.js";

export const MESSAGES = {
  ANSWERS_FOUND: "Got answers for you",
  CREATED: "Answer created",
  INVALID_VALUES: "Provided values are not valid",
  ID_WRONG_NO_ACCESS:
    "Answer id given was wrong, or you are trying to access answer you have no access",
  ANSWER_UPDATED: "Answer updated with given data",
  NO_PROPER_FORMAT: "Fields not in proper format",
  NO_ANSWER_ID: "No answer Id given",
  COMMENTED: "Commented on this answer",
  COMMENT_UPDATED: "Comment has been updated",
  NO_COMMENT_ID: "No comment Id given",
  VOTED: "Voted on this comment",

  SUCCESS: "Answers",
  ANSWERED: "Answered",
  UPDATED: "Answer updated",
  VOTES: commentMessage.SUCCESS.VOTES,
  FORUM_ID_INVALID: "Forum Id is invalid, No forum found with that Id",
  IDS_INVALID:
    "Forum of forumId given does not have any answer of given answerId",
  ACCEPTED: {
    SET: "Set as accepted answer",
    REMOVE: "Removed as accepted answer",
  },
};
