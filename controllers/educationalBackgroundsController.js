import UsersModel from '../models/usersModel.js';
import EducationalBackgroundsModel from '../models/educationalBackgroundsModel.js';

// @desc    Get the educational backgrounds of an employee
// @route   GET /api/educational-backgrounds/get
// @access  Private
const get = async (req, res) => {
    try {
      const { employeeID, token } = req.query;
      let response = await EducationalBackgroundsModel.get(req.app.locals.conn, employeeID, token);
      return res.status(200).json({ educational_backgrounds : response });
    }
    catch (error) {
      let message = "An error has occured in get(). Error Message: " + error;
      return res.status(500).json(message);
    }
  };

// @desc    Create a new request for educational backgrounds
// @route   POST /api/educational-backgrounds/create-request
// @access  Private
const createRequest = async (req, res) => {
    try {
        const user = await UsersModel.getDetails(req.app.locals.conn, req.body.employee_id);
        if (user !== undefined) {
            let data = req.body;
            if (await EducationalBackgroundsModel.isDiplomaExist(req.app.locals.conn, data.employee_id) === true) {
                return res.status(400).json("This diploma " + req.body.diploma + " is already exists in your educational background.");
            }
            let requestID = await EducationalBackgroundsModel.createRequest(req.app.locals.conn, data);
            return res.status(200).json(requestID);
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
    createRequest,
};
