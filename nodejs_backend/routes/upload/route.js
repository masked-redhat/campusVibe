import { Router } from "express";
import upload from "../../middlewares/parser.js";
import { MESSAGES as m } from "../../constants/messages/upload.js";
import { IMAGEURL } from "../../constants/env.js";

const router = Router();

router.post("/", upload.single("image"), (req, res) => {
  const image = req.file?.filename ?? null;
  const url = new URL(image, IMAGEURL);

  res.created(m.SUCCESS, { url });
});

export const UploadRouter = router;
