import UploadsModel from '../models/uploadsModel.js';
import helperMethods from "../utility/helperMethods.js";

// @desc    Create the uploaded file
// @route   POST /api/uploads/
// @access  Private
const index = async (req, res) => {
    try {
        let responseMsg = "";
        responseMsg = UploadsModel.isUploadedFileExistValidation(req);
        if (responseMsg != "") {
            return res.status(400).json(responseMsg);
        }
        responseMsg = UploadsModel.fileNameExtensionValidation(req);
        if (responseMsg != "") {
            return res.status(400).json(responseMsg);
        }
        responseMsg = UploadsModel.fileSizeValidation(req);
        if (responseMsg != "") {
            return res.status(400).json(responseMsg);
        }
        responseMsg = await UploadsModel.createFile(req);
        if (responseMsg != "") {
            return res.status(400).json(responseMsg);
        }
        return res.status(200).json("Successfully uploaded.");
    }
    catch (error) {
        let message = "An error has occured in index(). Error Message: " + error;
        return res.status(500).json(message);
    }
};

// @desc    Get the current marriage certificate
// @route   GET /api/uploads/get-current-marriage-certificate
// @access  Private
const getCurrentMarriageCertificate = async (req, res) => {
    try {
        const employeeID = helperMethods.decode(req.query.token).user.employee_id;
        let result = await UploadsModel.getCurrentMarriageCertificate(employeeID);
        if (result === "") {
            return res.render("notFound.ejs", { APP_NAME: process.env.APP_NAME, BODY_CONTENT: "Marriage Certificate was not found." });
        } else {
            return res.render("attachFile.ejs", { APP_NAME: process.env.APP_NAME, BODY_CONTENT: result });
        }
    }
    catch (error) {
        if (error.message === "invalid signature") {
            return res.render("notFound.ejs", { APP_NAME: process.env.APP_NAME, BODY_CONTENT: "Marriage Certificate was not found." });
        } else {
            let message = "An error has occured in getCurrentMarriageCertificate(). Error Message: " + error;
            return res.status(500).json(message);
        }
    }
};

// @desc    Get the current birth certificate
// @route   GET /api/uploads/get-current-birth-certificate
// @access  Private
const getCurrentBirthCertificate = async (req, res) => {
    try {
        const employeeID = helperMethods.decode(req.query.token).user.employee_id;
        const fileName = req.query.fileName.trim();
        let result = await UploadsModel.getCurrentBirthCertificate(employeeID, fileName);
        if (result === "") {
            return res.render("notFound.ejs", { APP_NAME: process.env.APP_NAME, BODY_CONTENT: "Birth Certificate was not found." });
        } else {
            return res.render("attachFile.ejs", { APP_NAME: process.env.APP_NAME, BODY_CONTENT: result });
        }
    }
    catch (error) {
        if (error.message === "invalid signature") {
            return res.render("notFound.ejs", { APP_NAME: process.env.APP_NAME, BODY_CONTENT: "Birth Certificate was not found." });
        } else {
            let message = "An error has occured in getCurrentBirthCertificate(). Error Message: " + error;
            return res.status(500).json(message);
        }
    }
};

// @desc    Get the pending/approved marriage certificate
// @route   GET /api/uploads/get-marriage-certificate
// @access  Private
const getMarriageCertificate = async (req, res) => {
    try {
       const employeeID = helperMethods.decode(req.query.token).user.employee_id;
        const requestID = req.query.requestID;
        const statusID = req.query.statusID;
        const folder = req.query.folder;
        let result = await UploadsModel.getMarriageCertificate(req.app.locals.conn, employeeID, requestID, statusID, folder);
        if (result === "") {
            return res.render("notFound.ejs", { APP_NAME: process.env.APP_NAME, BODY_CONTENT: "Marriage Certificate was not found." });
        } else {
            return res.render("attachFile.ejs", { APP_NAME: process.env.APP_NAME, BODY_CONTENT: result });
        }
    }
    catch (error) {
        if (error.message === "invalid signature") {
            return res.render("notFound.ejs", { APP_NAME: process.env.APP_NAME, BODY_CONTENT: "Marriage Certificate was not found." });
        } else {
            let message = "An error has occured in getMarriageCertificate(). Error Message: " + error;
            return res.status(500).json(message);
        }
    }
};

// @desc    Get the pending/approved birth certificate
// @route   GET /api/uploads/get-birth-certificate
// @access  Private
const getBirthCertificate = async (req, res) => {
    try {
        const employeeID = helperMethods.decode(req.query.token).user.employee_id;
        const requestID = req.query.requestID;
        const statusID = req.query.statusID;
        const folder = req.query.folder;
        const fileName = req.query.fileName;
        let result = await UploadsModel.getBirthCertificate(req.app.locals.conn, employeeID, requestID, statusID, folder, fileName);
        if (result === "") {
            return res.render("notFound.ejs", { APP_NAME: process.env.APP_NAME, BODY_CONTENT: "Birth Certificate was not found." });
        } else {
            return res.render("attachFile.ejs", { APP_NAME: process.env.APP_NAME, BODY_CONTENT: result });
        }
    }
    catch (error) {
        if (error.message === "invalid signature") {
            return res.render("notFound.ejs", { APP_NAME: process.env.APP_NAME, BODY_CONTENT: "Birth Certificate was not found." });
        } else {
            let message = "An error has occured in getBirthCertificate(). Error Message: " + error;
            return res.status(500).json(message);
        }
    }
};

// @desc    Get the pending/approved prc id
// @route   GET /api/uploads/get-prc-id
// @access  Private
const getPRCID = async (req, res) => {
    try {
        const employeeID = helperMethods.decode(req.query.token).user.employee_id;
        const requestID = req.query.requestID;
        const statusID = req.query.statusID;
        const folder = req.query.folder;
        let result = await UploadsModel.getPRCID(req.app.locals.conn, employeeID, requestID, statusID, folder);
        if (result === "") {
            return res.render("notFound.ejs", { APP_NAME: process.env.APP_NAME, BODY_CONTENT: "PRC ID was not found." });
        } else {
            return res.render("attachFile.ejs", { APP_NAME: process.env.APP_NAME, BODY_CONTENT: result });
        }
    }
    catch (error) {
        if (error.message === "invalid signature") {
            return res.render("notFound.ejs", { APP_NAME: process.env.APP_NAME, BODY_CONTENT: "PRC ID was not found." });
        } else {
            let message = "An error has occured in getPRCID(). Error Message: " + error;
            return res.status(500).json(message);
        }
    }
};

// @desc    Get the pending/approved TOR or Diploma
// @route   GET /api/uploads/get-tor-or-diploma
// @access  Private
const getTOROrDiploma = async (req, res) => {
    try {
        const employeeID = helperMethods.decode(req.query.token).user.employee_id;
        const requestID = req.query.requestID;
        const statusID = req.query.statusID;
        const folder = req.query.folder;
        const document = req.query.document;
        let result = await UploadsModel.getTOROrDiploma(req.app.locals.conn, employeeID, requestID, statusID, folder, document.trim().toUpperCase());
        if (result === "") {
            return res.render("notFound.ejs", { APP_NAME: process.env.APP_NAME, BODY_CONTENT: document.trim().toUpperCase() + " was not found." });
        } else {
            return res.render("attachFile.ejs", { APP_NAME: process.env.APP_NAME, BODY_CONTENT: result });
        }
    }
    catch (error) {
        if (error.message === "invalid signature") {
            return res.render("notFound.ejs", { APP_NAME: process.env.APP_NAME, BODY_CONTENT: req.query.document.trim().toUpperCase() + " was not found." });
        } else {
            let message = "An error has occured in getTOROrDiploma(). Error Message: " + error;
            return res.status(500).json(message);
        }
    }
};

// @desc    Get the pending/approved training or seminar certificate
// @route   GET /api/uploads/get-training-or-seminar-certificate
// @access  Private
const getTrainingOrSeminarCertificate = async (req, res) => {
    try {
        const employeeID = helperMethods.decode(req.query.token).user.employee_id;
        const requestID = req.query.requestID;
        const statusID = req.query.statusID;
        const folder = req.query.folder;
        let result = await UploadsModel.getTrainingOrSeminarCertificate(req.app.locals.conn, employeeID, requestID, statusID, folder);
        if (result === "") {
            return res.render("notFound.ejs", { APP_NAME: process.env.APP_NAME, BODY_CONTENT: "Training or Seminar Certificate was not found." });
        } else {
            return res.render("attachFile.ejs", { APP_NAME: process.env.APP_NAME, BODY_CONTENT: result });
        }
    }
    catch (error) {
        if (error.message === "invalid signature") {
            return res.render("notFound.ejs", { APP_NAME: process.env.APP_NAME, BODY_CONTENT: "Training or Seminar Certificate was not found." });
        } else {
            let message = "An error has occured in getTrainingOrSeminarCertificate(). Error Message: " + error;
            return res.status(500).json(message);
        }
    }
};


// @desc    Get the current prc id
// @route   GET /api/uploads/get-current-prc-id
// @access  Private
const getCurrentPRCID = async (req, res) => {
    try {
        if (req.query.token === undefined) {
            throw '(token) parameter is required.';
        }

        if (req.query.licenseName === undefined) {
            throw '(licenseName) parameter is required.';
        }

        const employeeID = helperMethods.decode(req.query.token).user.employee_id;
        const licenseName = req.query.licenseName.trim();
        let result = await UploadsModel.getCurrentPRCID(employeeID, licenseName);
        if (result === "") {
            return res.render("notFound.ejs", { APP_NAME: process.env.APP_NAME, BODY_CONTENT: "PRC ID was not found." });
        } else {
            return res.render("attachFile.ejs", { APP_NAME: process.env.APP_NAME, BODY_CONTENT: result });
        }
    }
    catch (error) {
        if (error.message === "invalid signature") {
            return res.render("notFound.ejs", { APP_NAME: process.env.APP_NAME, BODY_CONTENT: "PRC ID was not found." });
        } else {
            let message = "An error has occured in getCurrentPRCID(). Error Message: " + error;
            return res.status(500).json(message);
        }
    }
};

// @desc    Get the current prc id
// @route   GET /api/uploads/get-current-tor-or-diploma
// @access  Private
const getCurrentTOROrDiploma = async (req, res) => {
    try {
        if (req.query.token === undefined) {
            throw '(token) parameter is required.';
        }

        if (req.query.diploma === undefined) {
            throw '(diploma) parameter is required.';
        }

        if (req.query.document === undefined) {
            throw '(document) parameter is required.';
        }

        const employeeID = helperMethods.decode(req.query.token).user.employee_id;
        const diploma = req.query.diploma.trim();
        const document = req.query.document.trim();
        let result = await UploadsModel.getCurrentTOROrDiploma(employeeID, diploma, document);
        if (result === "") {
            return res.render("notFound.ejs", { APP_NAME: process.env.APP_NAME, BODY_CONTENT: document.toUpperCase() + " was not found." });
        } else {
            return res.render("attachFile.ejs", { APP_NAME: process.env.APP_NAME, BODY_CONTENT: result });
        }
    }
    catch (error) {
        if (error.message === "invalid signature") {
            return res.render("notFound.ejs", { APP_NAME: process.env.APP_NAME, BODY_CONTENT: req.query.document.toUpperCase() + " was not found." });
        } else {
            let message = "An error has occured in getCurrentTOROrDiploma(). Error Message: " + error;
            return res.status(500).json(message);
        }
    }
};

// @desc    Get the current training or seminar certificate
// @route   GET /api/uploads/get-current-training-or-seminar-certificate
// @access  Private
const getCurrentTrainingOrSeminarCertificate = async (req, res) => {
    try {
        const employeeID = helperMethods.decode(req.query.token).user.employee_id;
        const trainingOrSeminarName = req.query.trainingOrSeminarName.trim();
        let result = await UploadsModel.getCurrentTrainingOrSeminarCertificate(employeeID, trainingOrSeminarName);
        if (result === "") {
            return res.render("notFound.ejs", { APP_NAME: process.env.APP_NAME, BODY_CONTENT: "Training or Seminar Certificate was not found." });
        } else {
            return res.render("attachFile.ejs", { APP_NAME: process.env.APP_NAME, BODY_CONTENT: result });
        }
    }
    catch (error) {
        if (error.message === "invalid signature") {
            return res.render("notFound.ejs", { APP_NAME: process.env.APP_NAME, BODY_CONTENT: "Training or Seminar Certificate was not found." });
        } else {
            let message = "An error has occured in getCurrentTrainingOrSeminarCertificate(). Error Message: " + error;
            return res.status(500).json(message);
        }
    }
};

export {
    index,
    getCurrentMarriageCertificate,
    getMarriageCertificate,
    getBirthCertificate,
    getPRCID,
    getTOROrDiploma,
    getTrainingOrSeminarCertificate,
    getCurrentPRCID,
    getCurrentTOROrDiploma,
    getCurrentBirthCertificate,
    getCurrentTrainingOrSeminarCertificate
};
