function validate(username) {
  const usernameRegex = /^(?!.*[_.]{2})[a-zA-Z][a-zA-Z0-9._]{2,15}(?<![_.])$/;

  if (usernameRegex.test(username)) {
    return [true, "Username is valid!"];
  } else {
    return [
      false,
      "Username is invalid. It must:\n" +
        "- Be 3 to 16 characters long.\n" +
        "- Start with a letter.\n" +
        "- Contain only letters, digits, '_', or '.'.\n" +
        "- Not have consecutive '_' or '.'.\n" +
        "- Not start or end with '_' or '.'.",
    ];
  }
}

const user = { validate };

export default user;
