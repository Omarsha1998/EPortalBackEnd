import AttachmentArchivesModel from '../models/AttachmentArchivesModel.js';

// @desc    Get all the departments
// @route   GET /api/attachment-archives/get-all-departments
// @access  Private
const getAllDepartments = async (req, res) => {
  try {
    let result = await AttachmentArchivesModel.getAllDepartments(req.app.locals.conn);
    const emptyValue = {
      department_id : 0,
      department_name : 'ANY DEPARTMENT'
    }
    // push the object and make that in the 1st place
    result.unshift(emptyValue);

    return res.status(200).json(result);
  }
  catch (error) {
    let message = "An error has occured in getAllDepartments(). Error Message: " + error;
    return res.status(500).json(message);
  }
};

// @desc    Search an employee
// @route   GET /api/attachment-archives/search-employee
// @access  Private
const searchEmployee = async (req, res) => {
  try {
    const { departmentID, employeeIDOrEmployeeName } = req.query;
    let response = await AttachmentArchivesModel.searchEmployee(req.app.locals.conn, departmentID, employeeIDOrEmployeeName);
    return res.status(200).json(response);
  }
  catch (error) {
    let message = "An error has occured in searchEmployee(). Error Message: " + error;
    return res.status(500).json(message);
  }
};

// @desc    Get all the attachment of an employee
// @route   GET /api/attachment-archives/get-employee-attachment
// @access  Private
const getEmployeeAttachments = async (req, res) => {
  try {
    const { employeeID } = req.query;
    let response = await AttachmentArchivesModel.getEmployeeAttachments(req.app.locals.conn, employeeID);
    return res.status(200).json(response);
  }
  catch (error) {
    let message = "An error has occured in getEmployeeAttachments(). Error Message: " + error;
    return res.status(500).json(message);
  }
};


export {
  getAllDepartments,
  searchEmployee,
  getEmployeeAttachments
};