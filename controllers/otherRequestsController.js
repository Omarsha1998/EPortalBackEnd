import UsersModel from "../models/usersModel.js";
import OtherRequestsModel from "../models/otherRequestsModel.js";

// @desc    Get the other requests 
// @route   GET /api/other-requests/get
// @access  Private
const get = async (req, res) => {
  try {
    const { employee_id, date_range_search } = req.body;
    let response = await OtherRequestsModel.get(req.app.locals.conn, employee_id, date_range_search);
    return res.status(200).json({ other_requests : response });
  }
  catch (error) {
    let message = "An error has occured in get(). Error Message: " + error;
    return res.status(500).json(message);
  }
};

// @desc    Approve a request
// @route   PUT /api/other-requests/approve-request/employee-id
// @access  Private
const approveRequest = async (req, res) => {
  try {
    const employee_id = req.params.employee_id;
    const user = await UsersModel.getDetails(req.app.locals.conn, employee_id);

    if (user !== undefined) {
      await OtherRequestsModel.approveRequest(req.app.locals.conn, employee_id, req.body);
      return res.status(200).json("Successfully approved.");
    } else {
      return res.status(400).json("Cannot find this user with Employee ID: " + employee_id);
    }

  }
  catch (error) {
    let message = "An error has occured in approveRequest(). Error Message: " + error;
    return res.status(500).json(message);
  }
};


// @desc    Set the remarks of HR to a request
// @route   PUT /api/other-requests/set-hr-remarks/employee-id
// @access  Private
const setHRRemarks = async (req, res) => {
  try {
    const employee_id = req.params.employee_id;
    const user = await UsersModel.getDetails(req.app.locals.conn, employee_id);

    if (user !== undefined) {
      await OtherRequestsModel.setHRRemarks(req.app.locals.conn, employee_id, req.body);
      return res.status(200).json("Successfully set remarksed.");
    } else {
      return res.status(400).json("Cannot find this user with Employee ID: " + employee_id);
    }

  }
  catch (error) {
    let message = "An error has occured in setHRRemarks(). Error Message: " + error;
    return res.status(500).json(message);
  }
};

// @desc    Make a request not high lighted to HR
// @route   PUT /api/other-requests/request-not-high-lighted-to-hr/employee-id
// @access  Private
const requestNotHighLightedToHR = async (req, res) => {
  try {
      await OtherRequestsModel.requestNotHighLightedToHR(req.app.locals.conn, req.body.requestID);
      return res.status(200).json("Successfully updated.");
  }
  catch (error) {
    let message = "An error has occured in requestNotHighLightedToHR(). Error Message: " + error;
    return res.status(500).json(message);
  }
};

export {
  get,
  approveRequest,
  setHRRemarks,
  requestNotHighLightedToHR
};
