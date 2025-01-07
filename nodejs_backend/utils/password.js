import bcryptjs from "bcryptjs";
import { BACKEND } from "../constants/env.js";

const hash = (pass) => {
  const hashed = bcryptjs.hashSync(pass, BACKEND.PASSWORD.SALT);
  return hashed;
};

const compare = (pass, hashed) => {
  const result = bcryptjs.compareSync(pass, hashed);
  return result;
};

const validate = (password) => {
  const result = { valid: false, message: "Password is Valid!" };
  const strongPasswordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;

  const isStrong = strongPasswordRegex.test(password);

  if (isStrong) result.valid = true;
  else {
    // Detailed feedback for missing criteria
    const feedback = [];

    if (password.length < 8) {
      feedback.push("Password must be at least 8 characters long.");
    }
    if (!/[a-z]/.test(password)) {
      feedback.push("Password must include at least one lowercase letter.");
    }
    if (!/[A-Z]/.test(password)) {
      feedback.push("Password must include at least one uppercase letter.");
    }
    if (!/\d/.test(password)) {
      feedback.push("Password must include at least one digit.");
    }
    if (!/[@$!%*?&#]/.test(password)) {
      feedback.push(
        "Password must include at least one special character (e.g., @$!%*?&#)."
      );
    }
    result.message = JSON.stringify(feedback);
  }

  return result;
};

const Password = {
  hash,
  compare,
  validate,
};

export default Password;
