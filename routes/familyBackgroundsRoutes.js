import express from "express";
const router = express.Router();
import {
  get,
  createRequest,
} from "../controllers/familyBackgroundsController.js";
import { protect } from "../middleware/authMiddleware.js";

router.route("/get").get(protect, get);
router.route("/create-request").post(protect, createRequest);

export default router;