import express from "express";
const router = express.Router();
import {
  get,
  createRequest,
  getAllReligions,
  getAllCivilStatuses,
} from "../controllers/personalInformationsController.js";
import { protect } from "../middleware/authMiddleware.js";

router.route("/get").get(protect, get);
router.route("/create-request").post(protect, createRequest);
router.route("/get-all-religions").get(protect, getAllReligions);
router.route("/get-all-civil-statuses").get(protect, getAllCivilStatuses);

export default router;
