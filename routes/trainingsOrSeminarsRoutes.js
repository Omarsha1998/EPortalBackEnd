import express from "express";
const router = express.Router();
import {
  createRequest,
  get
} from "../controllers/trainingsOrSeminarsController.js";
import { protect } from "../middleware/authMiddleware.js";

router.route("/get").get(protect, get);
router.route("/create-request").post(protect, createRequest);

export default router;