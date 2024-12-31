import Tokens from "../models/ODM/tokens.js";
import checks from "../utils/checks.js";
import jwt from "jsonwebtoken";

// Check x tokens per day
// Remove if they are not valid anymore
// this will be running thorughout the application00

const LIMIT = 100;
const TIMEOUT = 3000;

const syncTokens = async (skipNum = 0) => {
  const tokens = await Tokens.find().skip(skipNum).limit(LIMIT);

  if (checks.isNuldefined(tokens)) {
    setTimeout(syncTokens, TIMEOUT);
    return;
  }

  let deleteIDs = [];

  tokens.forEach((tokenObj) => {
    try {
      jwt.verify(tokenObj);
    } catch {
      deleteIDs.push(tokenObj.id);
    }
  });

  const deleted = await Tokens.deleteMany({ _id: { $in: deleteIDs } });
  if (deleted.deletedCount !== 0) console.log(deleted);

  const skip = skipNum + LIMIT - deleteIDs.length;

  setTimeout(() => {
    syncTokens(skip);
  }, TIMEOUT);
};

export default syncTokens;
