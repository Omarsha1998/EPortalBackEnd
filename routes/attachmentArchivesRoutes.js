import express from "express";
const router = express.Router();
import {
  getAllDepartments,
  searchEmployee,
  getEmployeeAttachments
} from "../controllers/attachmentArchivesController.js";
import { protect } from "../middleware/authMiddleware.js";

router.route("/get-all-departments").get(protect, getAllDepartments);
router.route("/search-employee").get(protect, searchEmployee);
router.route("/get-employee-attachments").get(protect, getEmployeeAttachments);

export default router;
