import rateLimit from "express-rate-limit";

const rateLimiter = {
  login: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 15, // limit each IP to 10 requests per windowMs
  }),
};

export default rateLimiter;
