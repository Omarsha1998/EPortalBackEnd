import express from "express";
const router = express.Router();
import {
  get,
} from "../controllers/workExperiencesController.js";
import { protect } from "../middleware/authMiddleware.js";

router.route("/get").get(protect, get);

export default router;
