import UsersModel from "../models/usersModel.js";
import MyRequestsModel from "../models/myRequestsModel.js";

// @desc    Get all the requests of an employee
// @route   POST /api/my-requests/get
// @access  Private
const get = async (req, res) => {
  try {
    const { employee_id, date_range_search } = req.body;
    let response = await MyRequestsModel.get(req.app.locals.conn, employee_id, date_range_search);
    return res.status(200).json({ my_requests: response });
  }
  catch (error) {
    let message = "An error has occured in get(). Error Message: " + error;
    return res.status(500).json(message);
  }
};


// @desc    Update the column NewValue of [UE DATABASE]..RequestDtl
// @route   PUT /api/my-requests/comply/employee-id
// @access  Private
const submitComply = async (req, res) => {
  try {
    const employee_id = req.params.employee_id;
    const user = await UsersModel.getDetails(req.app.locals.conn, employee_id);

    if (user !== undefined) {
      await MyRequestsModel.submitComply(req.app.locals.conn, req.body);
      return res.status(200).json("Successfully submitted.");
    } else {
      return res.status(400).json("Cannot find this user with Employee ID: " + employee_id);
    }

  }
  catch (error) {
    let message = "An error has occured in submitComply(). Error Message: " + error;
    return res.status(500).json(message);
  }
};


// @desc    Make a request not high lighted to Requester
// @route   PUT /api/my-requests/request-not-high-lighted-to-requester
// @access  Private
const requestNotHighLightedToRequester = async (req, res) => {
  try {
    const { request_id } = req.body;
    await MyRequestsModel.requestNotHighLightedToRequester(req.app.locals.conn, request_id);
    return res.status(200).json("Successfully updated.");
  }
  catch (error) {
    let message = "An error has occured in requestNotHighLightedToRequester(). Error Message: " + error;
    return res.status(500).json(message);
  }
};


export {
  get,
  submitComply,
  requestNotHighLightedToRequester
};
