const limits = {
  POST: {
    _: 30,
    COMMENT: 30,
    LIKE: 30,
  },
  FRIEND: {
    _: 40,
    REQUEST: 40,
  },
  FEED: {
    _: 30,
  },
  FORUM: {
    _: 10,
    ANSWER: {
      _: 10,
      COMMENT: 30,
    },
  },
};

export default limits;
