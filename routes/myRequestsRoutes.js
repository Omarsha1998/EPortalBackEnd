import express from "express";
const router = express.Router();
import {
    get,
    submitComply,
    requestNotHighLightedToRequester
} from "../controllers/myRequestsController.js";
import { protect } from "../middleware/authMiddleware.js";

router.route("/get").post(protect, get);
router.route("/submit-comply/:employee_id").put(protect, submitComply);
router.route("/request-not-high-lighted-to-requester").put(protect, requestNotHighLightedToRequester);

export default router;
