import WorkExperiencesModel from '../models/workExperiencesModel.js';

// @desc    Get the work experiences of an employee
// @route   GET /api/work-experiences/get
// @access  Private
const get = async (req, res) => {
  try {
    const { employeeID } = req.query;
    let response = await WorkExperiencesModel.get(req.app.locals.conn, employeeID);
    return res.status(200).json({ work_experiences : response });
  }
  catch (error) {
    let message = "An error has occured in get(). Error Message: " + error;
    return res.status(500).json(message);
  }
};

export {
    get
};