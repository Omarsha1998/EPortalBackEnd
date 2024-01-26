import express from "express";
const router = express.Router();
import {
    get,
    approveRequest,
    setHRRemarks,
    requestNotHighLightedToHR
} from "../controllers/otherRequestsController.js";
import { protect } from "../middleware/authMiddleware.js";

router.route("/get").post(protect, get);
router.route("/approve-request/:employee_id").put(protect, approveRequest);
router.route("/set-hr-remarks/:employee_id").put(protect, setHRRemarks);
router.route("/request-not-high-lighted-to-hr").put(protect, requestNotHighLightedToHR);

export default router;
