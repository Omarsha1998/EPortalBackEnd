import UsersModel from '../models/usersModel.js';
import FamilyBackgroundsModel from '../models/familyBackgroundsModel.js';

// @desc    Get the family backgrounds of an employee
// @route   GET /api/family-backgrounds/get
// @access  Private
const get = async (req, res) => {
  try {
    const { employeeID, token } = req.query;
    let response = await FamilyBackgroundsModel.get(req.app.locals.conn, employeeID, token);
    return res.status(200).json({ family_backgrounds : response });
  }
  catch (error) {
    let message = "An error has occured in get(). Error Message: " + error;
    return res.status(500).json(message);
  }
};


// @desc    Create a new request for any family member
// @route   POST /api/family-backgrounds/create-request
// @access  Private
const createRequest = async (req, res) => {
  try {

    let employeeID = Array.isArray(req.body) === true ? req.body[0].employee_id : req.body.employee_id;
    let requestType = Array.isArray(req.body) === true ? req.body[0].request_type : req.body.request_type;
    const user = await UsersModel.getDetails(req.app.locals.conn, employeeID);
    let requestID;
    if (user !== undefined) {
      let data = req.body;
      if (requestType === "create") {
        requestID = await FamilyBackgroundsModel.createRequest(req.app.locals.conn, data);
      } else if (requestType === "edit") {
        let hasChanged = [];

        if (await FamilyBackgroundsModel.hasChange(req.app.locals.conn, data) === false
        ) {

          if (Array.isArray(data) === true && data[0].family_type === 'Child') {
            let noChanges = true;
            for (var i = 0; i < data.length; i++) {
              if (data[i].attach_birth_certificate !== "") {
                noChanges = false;
              }
            }

            if (noChanges === true) {
              return res.status(400).json("No changes detected. Your request was cancelled.");
            } else {
              for (var i = 0; i < data.length; i++) {
                if (data[i].attach_birth_certificate !== "") {
                  hasChanged.push(data[i]);
                }
              }
            }

          } else {
            if (data.family_type === "Spouse") {
              if (data.attach_marriage_certificate === "") {
                return res.status(400).json("No changes detected. Your request was cancelled.");
              }
            }
            else {
              return res.status(400).json("No changes detected. Your request was cancelled.");
            }

          }
        }

        // -------------------- siblings --------------------
        if (Array.isArray(data) === true && data[0].family_type === 'Sibling') {
          data = await FamilyBackgroundsModel.removeNoChanges(req.app.locals.conn, data);
        }
        // -------------------- siblings --------------------

        requestID = await FamilyBackgroundsModel.createRequest(req.app.locals.conn, (hasChanged.length === 0 ? data : hasChanged));
      } else {
        return res.status(400).json("Invalid value of request type");
      }

      return res.status(200).json(requestID);
    } else {
      return res.status(400).json("Cannot find this user with Employee ID: " + employeeID);
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
