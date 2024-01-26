import Leave from '../models/leaveModel.js'

const LeaveController = {

  createLeaveRequest: async (req, res) => {

    try {
      
      const { LeaveType, Days, TimeFrom, TimeTo, DateFrom, DateTo, Reason } = req.body;
      const employeeID = req.user.employee_id;
  
      const totalValue = await Leave.calculateTotalLeaveValue(req.app.locals.conn, employeeID, LeaveType);
  
      if (Days > totalValue) {
        return res.status(400).json({ error: 'Insufficient balance for LeaveType' });
      }
  
      const success = await Leave.createLeaveRequest(req.app.locals.conn, employeeID, LeaveType, Days, TimeFrom, TimeTo, DateFrom, DateTo, Reason );
      if (success) {
        return res.status(201).json({ message: 'Leave request created successfully', success: true });
      } else {
        return res.status(500).json({ error: 'Failed to insert leave request' });
      }
  
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Failed to insert leave request' });
    }
  },

  updateLeaveAction: async (req, res) => {
    try {
      const { Status, LeaveID } = req.body;
      const employeeID = req.user.employee_id;
  
      const rowsAffected = await Leave.updateLeaveAction(req.app.locals.conn, Status, LeaveID, employeeID);
  
      if (rowsAffected === 0) {
        return res.status(404).json({ error: 'Leave request not found' });
      }
  
      return res.status(200).json({ message: `Leave request ${Status}d successfully` });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Failed to update leave request' });
    }
  },


  getLeaveDetails: async (req, res) => {
    try {
      const employeeID = req.user.employee_id;
  
      const success = await Leave.getLeaveDetails(req.app.locals.conn, employeeID);
  
      if (success) {
        return res.status(200).json(success);
      } else {
        return res.status(400).json({ error: 'Internal Server Error' });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'No Leave Details' });
    }
  },

  getLeaveBalance: async (req, res) => {
    try {
      const data = req;
      const employeeID = req.user.employee_id;

      const success = await Leave.getLeaveBalance(req.app.locals.conn, employeeID);
  
      if (success) {
        return res.status(200).json(success);
      } else {
        return res.status(400).json({ error: 'Failed to get Leave Balance / No Leave Balance found for this User' });
      }
    } catch (error) {
      console.error(error) 
      res.status(500).json({ error: 'Internal Server Error'});
    }
  },

  getUserLeaveBalanceDetails: async (req, res) => {
    try {
      const employeeID = req.params.employeeID;
      const success = await Leave.getUserLeaveBalanceDetails(req.app.locals.conn, employeeID);
  
      if (success) {
        return res.status(200).json(success);
      } else {
        return res.status(400).json({ error: 'Failed to get all Leave Balance' });
      }
    } catch (error) {
      console.error(error) 
      res.status(500).json({ error: 'Internal Server Error'});
      
    }
  },

  getForfeitedLeave: async (req, res) => {
    try {
      const employeeID = req.user.employee_id;

      const success = await Leave.getForfeitedLeave(req.app.locals.conn, employeeID);
      
      if(success) {
        return res.status(200).json(success);
      } else {
        return res.status(400).json({ error: 'Failed to get the Forfeited Leaves for this User'});
      }
    } catch (error) {
      console.error(error)
      res.status(500),json({ error: 'Initial Server Error'});
    }
  },

  getPendingLeaves: async (req, res) => {
    try {
      
      const employeeID = req.user.employee_id;

      const success = await Leave.getPendingLeaves(req.app.locals.conn, employeeID);
  
      if (success) {
        return res.status(200).json(success);
      } else {
        return res.status(400).json({ error: 'Internal Server Error' });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to retrieve pending leave requests' });
    }
  },

  getRejectedLeaves: async (req, res) => {
  
    try {

      const employeeID  = req.user.employee_id;

      const rejectedLeaves = await Leave.getRejectedLeaves(req.app.locals.conn, employeeID);
  
      res.status(200).json(rejectedLeaves);
    } catch (error) {
      res.status(500).json({ error: 'Failed to retrieve rejected leave' });
    }
  },

  getApprovedLeaves: async (req, res) => {
    try {

      const employeeID = req.user.employee_id;

      const approvedLeave = await Leave.getApprovedLeaves(req.app.locals.conn, employeeID);
  
      res.status(200).json(approvedLeave);
    } catch (error) {
      res.status(500).json({ error: 'Failed to retrieve approved leave' });
    }
  },

  deleteLeave: async (req, res) => {
    try {
      const LeaveID = req.params.LeaveID;
  
      const result = await Leave.deleteLeave(req.app.locals.conn, LeaveID);
  
      return res.status(result.status).json({ message: result.message });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Failed to delete leave request' });
    }
  },

  updateLeaveRequest: async (req, res) => {
    try {
      const LeaveID = req.params.LeaveID;
      const { LeaveType, Days, TimeFrom, TimeTo, DateFrom, DateTo, Reason } = req.body;
      const employeeID = req.user.employee_id;
        
      const totalValue = await Leave.calculateTotalLeaveValueInEdit(req.app.locals.conn, employeeID, LeaveType, LeaveID);

      if (Days > totalValue) {
        return res.status(400).json({ error: 'Insufficient balance for LeaveType' });
      }
  
      const result = await Leave.updateAndValidateLeave(req.app.locals.conn, LeaveID, employeeID, LeaveType, Days, TimeFrom, TimeTo, DateFrom, DateTo, Reason);
  
      if (result.status === 200) {
        res.status(200).json({ message: result.message });
      } else if (result.status === 401) {
        res.status(401).json({ error: result.message });
      } else {
        res.status(500).json({ error: result.message });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },


  // updateLeaveValue: async (req, res) => {
  //   try {
  //     const leaveType = 'VL';
  //     const increment = 1.75;
  //     const currentDate = new Date();
  //     const currentYear = currentDate.getFullYear();
  //     const lastDayOfMonth = new Date(currentYear, currentDate.getMonth() + 1, 0);
  
  //     const isSpecificTime =
  //       currentDate.getDate() === lastDayOfMonth.getDate() &&
  //       currentDate.getHours() === 23 &&
  //       currentDate.getMinutes() === 59;
  
  //     if (isSpecificTime) {
  //       const rowsAffected = await Leave.updateLeaveValue(leaveType, increment, currentYear);
  
  //       if (rowsAffected === 0) {
  //         console.log('No VL record found for the current year.');
  //       } else {
  //         console.log('VL Value updated successfully');
  //       }
  //     }
  //   } catch (error) {
  //     console.error('Failed to update VL Value:', error);
  //   }
  // },
  
  


  // updateLeaveBalanceYearly: async (req, res) => {
  //   try {
  //     const currentDate = new Date();
  //     const currentYear = currentDate.getFullYear();

  //     if (
  //       (currentDate.getDate() === 1 && currentDate.getMonth() === 0) ||
  //       (currentDate.getDate() === 1 && currentDate.getMonth() === 1)
  //     ) {
  //       const leaveTypes = [
  //         { type: 'SL', initialValue: 21, remarkPrefix: 'EarnedSL' },
  //         { type: 'EL', initialValue: 21, remarkPrefix: 'EarnedEL' },
  //         { type: 'VL', initialValue: 0, remarkPrefix: 'EarnedVL' },
  //       ];
  
  //       for (const leaveTypeData of leaveTypes) {
  //         const { type, initialValue, remarkPrefix } = leaveTypeData;
  
  //         await Leave.updateLeaveBalanceYearly(type, initialValue, remarkPrefix, currentYear);
  
  //         console.log(`${type} Yearly Update Success`);
  //       }
  //     }
  //   } catch (error) {
  //     console.error('Failed to initialize leave balances:', error);
  //   }
  // },



};



export default LeaveController;