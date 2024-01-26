import PersonalInformationsModel from '../models/personalInformationsModel.js';
import UsersModel from '../models/usersModel.js';

// @desc    Get the personal informations of an employee
// @route   GET /api/personal-informations/get
// @access  Private
const get = async (req, res) => {
  try {
    const { employeeID } = req.query;
    let response = await PersonalInformationsModel.get(req.app.locals.conn, employeeID);
    return res.status(200).json({ personal_informations : response });
  }
  catch (error) {
    let message = "An error has occured in get(). Error Message: " + error;
    return res.status(500).json(message);
  }
};


// @desc    Create a new request
// @route   POST /api/personal-information/create-request
// @access  Private
const createRequest = async (req, res) => {
  try {
    const user = await UsersModel.getDetails(req.app.locals.conn, req.body.employee_id);
       
    if (user !== undefined) {
      if (await PersonalInformationsModel.hasChange(req.app.locals.conn, req.body) === false){
        return res.status(400).json("No changes detected. Your request was cancelled.");
      }

       await PersonalInformationsModel.createRequest(req.app.locals.conn, req.body);
       return res.status(200).json("Sucessfully submitted.");
    } else {
      return res.status(400).json("Cannot find this user with Employee ID: " + employee_id);
    }

  }
  catch (error) {
    let message = "An error has occured in createRequest(). Error Message: " + error;
    return res.status(500).json(message);
  }
};

// @desc    Get all the religions
// @route   GET /api/employees/get-all-religions
// @access  Private
const getAllReligions = async (req, res) => {
  try {
    let result = await PersonalInformationsModel.getAllReligions(req.app.locals.conn);
    const emptyValue = {
      religion_id : 0,
      religion_name : ''
    }
    // push the object and make that in the 1st place
    result.unshift(emptyValue);

    return res.status(200).json(result);
  }
  catch (error) {
    let message = "An error has occured in getAllReligions(). Error Message: " + error;
    return res.status(500).json(message);
  }
};

// @desc    Get all the civil statuses
// @route   GET /api/employees/get-all-civil-statuses
// @access  Private
const getAllCivilStatuses = async (req, res) => {
  try {
    let result = await PersonalInformationsModel.getAllCivilStatuses(req.app.locals.conn);
    const emptyValue = {
      civil_status_id : 0,
      civil_status_name : ''
    }
    result.unshift(emptyValue);

    return res.status(200).json(result);
  }
  catch (error) {
    let message = "An error has occured in getAllCivilStatuses(). Error Message: " + error;
    return res.status(500).json(message);
  }
};



export {
  get,
  createRequest,
  getAllReligions,
  getAllCivilStatuses,
};
