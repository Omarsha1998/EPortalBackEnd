import LicensesModel from '../models/licensesModel.js';
import UsersModel from '../models/usersModel.js';

// @desc    Get the licenses of an employee
// @route   GET /api/licenses/get
// @access  Private
const get = async (req, res) => {
  try {
    const { employeeID, token } = req.query;
    let response = await LicensesModel.get(req.app.locals.conn, employeeID, token);
    return res.status(200).json({ licenses : response });
  }
  catch (error) {
    let message = "An error has occured in get(). Error Message: " + error;
    return res.status(500).json(message);
  }
};

// @desc    Create a new request
// @route   POST /api/licenses/create-request
// @access  Private
const createRequest = async (req, res) => {
  try {
    const user = await UsersModel.getDetails(req.app.locals.conn, req.body.employee_id);

    if (user !== undefined) {
      if (user.license_no !== "") {

        if (req.body.new_expiration_date.length > 10) {
          return res.status(400).json("The value of New Expiration Date of License is not valid date");
        }

        let newExpirationDate = new Date(req.body.new_expiration_date);
        newExpirationDate.setHours(0, 0, 0, 0); // remove time
        let oldExpirationDate = new Date(await LicensesModel.getExpirationDate(req.app.locals.conn, req.body.employee_id, req.body.license_no));

        if (newExpirationDate > oldExpirationDate) {
          let requestID = await LicensesModel.createRequest(req.app.locals.conn, req.body);
          return res.status(200).json(requestID);
        }
        else {
          return res.status(400).json("The value of New Expiration Date of License should be greater than the License Expiration Date.");
        }
      } else {
        return res.status(400).json("This employee id: " + req.body.employee_id + " does not have a license.");
      }
    } else {
      return res.status(400).json("Cannot find this user with Employee ID: " + req.body.employee_id);
    }

  }
  catch (error) {
    let message = "An error has occured in createRequest(). Error Message: " + error;
    return res.status(500).json(message);
  }
};


export {
  get,
  createRequest
};
