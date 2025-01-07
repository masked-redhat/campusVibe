import { response } from "express";
import MESSAGES from "../constants/messages/global.js";
import codes from "./codes.js";

response.failure = function (statusCode, message = "") {
  this.status(statusCode).json({ message });
};

response.ok = function (message = "", additionalData = {}) {
  this.status(codes.OK).json({ message, ...additionalData });
};

response.created = function (message = "", additionalData = {}) {
  this.status(codes.CREATED).json({ message, ...additionalData });
};

response.serverError = function () {
  this.failure(codes.INTERNAL_SERVER_ERROR, MESSAGES.SERVER_ERROR);
};

response.noParams = function () {
  this.failure(codes.BAD_REQUEST, MESSAGES.PARAMETERS_INVALID);
};

response.noMethod = function () {
  this.sendStatus(codes.METHOD_NOT_ALLOWED);
};
