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
  const strongPasswordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;

  const isStrong = strongPasswordRegex.test(password);

  if (isStrong) return [true, []];

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

  return [feedback.length === 0, feedback];
};

const pass = {
  hash,
  compare,
  validate,
};

export default pass;
