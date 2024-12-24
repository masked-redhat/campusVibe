import { Router } from "express";

const router = Router();

router.get("/", (req, res) => {});

router.post("/", (req, res) => {});

router.all("*", (_, res) => {
  res.sendStatus(405);
});

export const FeedbackRouter = router;