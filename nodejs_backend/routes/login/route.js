import { Router } from "express";

const router = Router();

router.post("/", (req, res) => {});

router.post("/new", (req, res) => {});

router.all("*", (_, res) => {
  res.sendStatus(405);
});

export const LoginRouter = router;