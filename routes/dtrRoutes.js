import express from 'express'
const router = express.Router();
import DTR from '../controllers/DTRController.js'
import { protect } from '../middleware/authMiddleware.js'

router.get('/getDTRDetails', protect, DTR.getDTRDetails);

export default router