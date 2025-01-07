function validate(username) {
  const result = { valid: false, message: "Username is Valid!" };
  const usernameRegex = /^(?!.*[_.]{2})[a-zA-Z][a-zA-Z0-9._]{2,15}(?<![_.])$/;

  if (usernameRegex.test(username)) result.valid = true;
  else
    result.message =
      "Username is invalid. It must:\n" +
      "- Be 3 to 16 characters long.\n" +
      "- Start with a letter.\n" +
      "- Contain only letters, digits, '_', or '.'.\n" +
      "- Not have consecutive '_' or '.'.\n" +
      "- Not start or end with '_' or '.'.";

  return result;
}

const Username = { validate };

export default Username;
