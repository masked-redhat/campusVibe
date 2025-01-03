import jwt from "jsonwebtoken";
import codes from "../utils/codes.js";
import { TOKEN } from "../constants/auth.js";
import { MESSAGES as message } from "../constants/messages/jwt_auth.js";

const JWT_SECRET_KEY = TOKEN.SECRET;

class JwtTokenizer {
  #accessOptions = {
    expiresIn: TOKEN.EXPIRY.ACCESSTOKEN,
  };
  #refreshOptions = {
    expiresIn: TOKEN.EXPIRY.REFRESHTOKEN,
  };

  constructor(entity, key = "username", accessOptions, refreshOptions) {
    this.entity = entity;
    this.key = key;
    this.#accessOptions = accessOptions ?? this.#accessOptions;
    this.#refreshOptions = refreshOptions ?? this.#refreshOptions;
  }

  getTokens = () => {
    const tokens = {
      accessToken: this.createAccessToken(),
      refreshToken: this.createRefreshToken(),
    };

    return tokens;
  };

  createAccessToken = () => {
    const accessToken = jwt.sign(
      this.entity,
      JWT_SECRET_KEY,
      this.#accessOptions
    );

    return accessToken;
  };

  createRefreshToken = () => {
    const entity = { key: this.entity[this.key] };

    const refreshToken = jwt.sign(entity, JWT_SECRET_KEY, this.#refreshOptions);

    return refreshToken;
  };
}

class JwtValidator {
  #verified = false;
  #statusCode = 500;
  #entity = null;
  #message = "";

  constructor(token, verifyFn) {
    this.verifyEntity = verifyFn ?? ((entity) => true);
    this.token = token ?? null;
  }

  validate = async () => {
    let token = this.token;

    if (token === null) {
      this.#statusCode = codes.clientError.BAD_REQUEST;
      this.#message = message.NO_TOKEN;
      return;
    }

    try {
      this.#entity = jwt.verify(token, JWT_SECRET_KEY);

      this.#verified = (await this.verifyEntity(this.#entity)) === true;

      this.#statusCode = this.#verified ? codes.OK : codes.FORBIDDEN;
      this.#message = this.#verified ? message.OK : message.VERIFICATION_FAILED;
    } catch (err) {
      this.#statusCode = codes.FORBIDDEN;
      this.#message = message.TOKEN_INVALID;

      console.log(err);
    }
  };

  getStatusCode = () => this.#statusCode;

  getVerificationStatus = () => this.#verified;

  getEntityInfo = () => this.#entity;

  getMessage = () => this.#message;
}

export const JwtAuth = { JwtTokenizer, JwtValidator };

export default JwtAuth;
