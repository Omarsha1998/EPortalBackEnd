import express from "express";
const router = express.Router();
import {
  login,
  logout,
  getUser
} from "../controllers/usersController.js";

import { protect } from "../middleware/authMiddleware.js";

router.route("/login").post(login); 
router.route("/logout").post(protect, logout); 
router.route("/get-user").post(protect, getUser); 

export default router;
