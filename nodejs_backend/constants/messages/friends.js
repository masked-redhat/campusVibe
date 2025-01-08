import { MESSAGES as loginMessage } from "./login.js";

export const MESSAGES = {
  SUCCESS: { FRIENDS: "Friends", REQUESTS: "Requests" },
  USERNAME_INVALID: loginMessage.USERNAME_INVALID,
  REQUEST_TO_SELF:
    "Friend request to self is not allowed. How are you not your friend?",
  FRIENDS_ALREADY: "You are already friends with that user",
  REQUEST_SENT_ALREADY: "You have already sent a request to that user",
  REQUEST_SENT: "Friend request sent",
  NO_REQUEST_SENT_WHY: {
    ACCEPT:
      "That user never sent you a request, why are you trying to accept 'what?' request",
    REJECT:
      "That user never sent you a request, why are you trying to reject 'what?' request",
    DELETE:
      "You never sent a request, why are you trying to delete 'what?' request",
  },
  REQUEST_ACCEPTED: "Friend request accepted",
  REQUEST_REJECTED: "Friend request rejected",
};
