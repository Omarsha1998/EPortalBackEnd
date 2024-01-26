import express from 'express'
const router = express.Router();
import LeaveController from '../controllers/leaveController.js'
import { protect } from "../middleware/authMiddleware.js";

// const updateInterval = 60 * 1000;
// const updateInterval1 = 10000;

router.get('/leave-details', protect, LeaveController.getLeaveDetails);
router.get('/leave-balance', protect, LeaveController.getLeaveBalance);
router.get('/forfeited-leave', protect, LeaveController.getForfeitedLeave);
router.get('/user-leave-balance/:employeeID', protect, LeaveController.getUserLeaveBalanceDetails);
router.post('/admin-action', protect, LeaveController.updateLeaveAction);
router.get('/rejected-leaves', protect, LeaveController.getRejectedLeaves);
router.get('/approved-leaves', protect, LeaveController.getApprovedLeaves);
router.get('/pending-leaves', protect, LeaveController.getPendingLeaves);
router.post('/leave-request', protect, LeaveController.createLeaveRequest);
router.put('/editleave-request/:LeaveID', protect, LeaveController.updateLeaveRequest);
router.delete('/delete-leave/:LeaveID', protect, LeaveController.deleteLeave);

// setInterval(LeaveController.updateLeaveValue, updateInterval);
// setInterval(LeaveController.updateLeaveBalanceYearly, updateInterval);


export default router;
