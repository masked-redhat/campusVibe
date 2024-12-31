import multer from "multer";
import { BACKEND } from "../constants/env.js";

const randomNumber = () => Math.floor(Math.random() * 99999999001) + 1000;

const randomCombinationFromObject = (obj) => {
  // Extract all string values from the object
  const allStrings = Object.values(obj).join("");

  // Remove non-letter characters
  const letters = allStrings.replace(/[^a-zA-Z]/g, "");
  const minLength = 12;

  if (letters.length === 0) {
    // Return an empty string if no letters found
    return "";
  }

  // Create a random combination by selecting letters, allowing repetition
  let result = "";
  for (let i = 0; i < minLength; i++) {
    const randomIndex = Math.floor(Math.random() * letters.length);
    result += letters[randomIndex];
  }

  return result;
};

const uploadloc = BACKEND.PUBLIC.LOCATION.IMAGES;

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadloc);
  },
  filename: (req, file, cb) => {
    cb(
      null,
      Date.now() +
        "-" +
        randomCombinationFromObject(req.headers) +
        randomNumber() +
        file.originalname
    );
  },
});

const upload = multer({ storage: storage });

export default upload;
