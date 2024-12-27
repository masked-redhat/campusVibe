import syncTokens from "./tokens.js";

const syncing = () => {
  syncTokens();
};

export const syncDB = syncing;
