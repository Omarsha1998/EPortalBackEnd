import express from 'express'
const router = express.Router();
import AnnouncementController from '../controllers/announcementController.js'
import { protect } from "../middleware/authMiddleware.js";

router.get('/getannouncements', protect, AnnouncementController.getAnnouncements);


export default router;