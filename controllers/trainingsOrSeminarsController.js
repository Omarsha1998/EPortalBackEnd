import TrainingsOrSeminarsModel from '../models/trainingsOrSeminarsModel.js';

// @desc    Get the trainings or seminars of an employee
// @route   GET /api/trainings-or-seminars/get
// @access  Private
const get = async (req, res) => {
    try {
        const { employeeID, token } = req.query;
        let response = await TrainingsOrSeminarsModel.get(req.app.locals.conn, employeeID, token);
        return res.status(200).json({ trainings_or_seminars: response });
    }
    catch (error) {
        let message = "An error has occured in get(). Error Message: " + error;
        return res.status(500).json(message);
    }
};


// @desc    Create a new request for training or seminar
// @route   POST /api/trainings-or-seminars/create-request
// @access  Private
const createRequest = async (req, res) => {
    try {
        let data = req.body;
        if (await TrainingsOrSeminarsModel.isTrainingOrSeminarNameExist(req.app.locals.conn, data.employee_id, data.training_or_seminar_name) === true) {
            return res.status(400).json("This training/seminar name " + data.training_or_seminar_name + " is already exists in your training/seminar.");
        }
        let requestID = await TrainingsOrSeminarsModel.createRequest(req.app.locals.conn, data);
        return res.status(200).json(requestID);
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
