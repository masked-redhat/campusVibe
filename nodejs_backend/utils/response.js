export const serve = (res, statusCode, message = "", args) => {
  res.status(statusCode).json({ message, ...args });
};