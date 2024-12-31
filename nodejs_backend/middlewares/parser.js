import multer from "multer";
import { BACKEND } from "../constants/env.js";

const uploadloc = BACKEND.PUBLIC.LOCATION.IMAGES;

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadloc);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });

export default upload;
