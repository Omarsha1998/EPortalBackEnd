import helperMethods from "../utility/helperMethods.js";
import { database } from "../configuration/database.js";
import sql from 'mssql';
import UsersModel from '../models/usersModel.js';


function isUploadedFileExistValidation(req) {
  let responseMsg = "";
  if (!req.files) {
    responseMsg = "Cannot found the uploaded files in req object.";
  }
  return responseMsg;
}

function fileNameExtensionValidation(req) {
  let responseMsg = "";
  // let allowedExtArray = ['.png', '.jpg', '.jpeg', '.pdf'];
  let allowedExtArray = ['.pdf'];
  const files = req.files
  const fileExtensions = []
  Object.keys(files).forEach(key => {
    const fileNameExtension = files[key].name.slice(-4);
    fileExtensions.push(fileNameExtension)
  })
  // Are the file extension allowed? 
  const allowed = fileExtensions.every(ext => allowedExtArray.includes(ext))
  if (!allowed) {
    const message = `Upload failed. Only (${allowedExtArray.toString()}) file allowed.`.replaceAll(",", ", ");
    responseMsg = message;
  }
  return responseMsg;
}

function fileSizeValidation(req) {
  let responseMsg = "";
  const files = req.files
  const MB = 5; // 5 MB 
  const FILE_SIZE_LIMIT = MB * 1024 * 1024;

  const filesOverLimit = []
  // Which files are over the limit?
  Object.keys(files).forEach(key => {
    if (files[key].size > FILE_SIZE_LIMIT) {
      filesOverLimit.push(files[key].name)
    }
  })

  if (filesOverLimit.length) {
    const properVerb = filesOverLimit.length > 1 ? 'are' : 'is';

    const sentence = `Upload failed. ${filesOverLimit.toString()} ${properVerb} over the file size limit of ${MB} MB.`.replaceAll(",", ", ");

    const message = filesOverLimit.length < 3
      ? sentence.replace(",", " and")
      : sentence.replace(/,(?=[^,]*$)/, " and");

    responseMsg = message;
  }
  return responseMsg;
}

async function createFile(req) {
  let responseMsg = "";
  const files = req.files
  const requestID = req.body.request_id;
  const folder = req.body.request_type === "create" ? "value" : "to";
  let fileName = "";
  Object.keys(files).forEach(key => {
    fileName = key;
    const fileNameExtension = files[key].name.toLowerCase().split('.').pop();
    const filepath = 'uploaded/requests/pending/' + requestID + "/" + folder + "/" + key + "." + fileNameExtension;

    files[key].mv(filepath, (err) => {
      if (err) { responseMsg = err }
    })
  })

  if (folder === "to") {
    const employeeID = req.body.employee_id;
    const attachFile = req.body.attach_file;
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    let directoryPath = __dirname.slice(0, -6);
    directoryPath = directoryPath.replaceAll("\\", "/");
    if (attachFile === "marriage_certificate" || attachFile === "prc_id") {
      // create folder 'from'
      let path = directoryPath + 'uploaded/requests/pending/' + requestID + "/from/";
      await helperMethods.createFolder(path);

      // copy the file from the current files folder
      let sourcePath = directoryPath + "uploaded/current_files/" + employeeID;
      if (attachFile === "marriage_certificate") {
        sourcePath += "/family_backgrounds/spouse/marriage_certificate.";
      } else if (attachFile === "prc_id") {
        if (fileName !== "") {
          sourcePath += "/licenses/" + fileName + ".";
        }
      }

      await copyFile(sourcePath, path);

    }
  }

  return responseMsg;
}

async function copyFile(sourcePath, path) {
  if (await helperMethods.isExist(sourcePath + "pdf") === true) {
    await helperMethods.copyFile(sourcePath + "pdf", path);
  }
  else {
    throw 'cannot find the path';
  }
}

import { fileURLToPath } from 'url';
import { dirname } from 'path';

async function getPath(verifyingPath, result, response, fileNameExtension = '') {
  if (await helperMethods.isExist(verifyingPath) === true) {
    return result + fileNameExtension;
  }
  else {
    return response;
  }
}

async function getCurrentMarriageCertificate(employeeID) {
  let response = "";
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);

  let basePath = __dirname.slice(0, -6) + "uploaded";
  let result = "/current_files/" + employeeID + "/family_backgrounds/spouse/marriage_certificate.";
  basePath += result;
  basePath = basePath.replaceAll("\\", "/");

  let fileNameExtension = "pdf";
  let fullPath = basePath + fileNameExtension;
 return await getPath(fullPath, result, response, fileNameExtension);
}

async function getCurrentBirthCertificate(employeeID, fileName) {
  let response = "";
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);

  let basePath = __dirname.slice(0, -6) + "uploaded";
  let result = "/current_files/" + employeeID + "/family_backgrounds/children/birth_certificate/" + fileName + ".";
  basePath += result;
  basePath = basePath.replaceAll("\\", "/");

  let fileNameExtension = "pdf";
  let fullPath = basePath + fileNameExtension;
  return await getPath(fullPath, result, response, fileNameExtension);
}

async function getCurrentPRCID(employeeID, licenseName) {
  let response = "";
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);

  let basePath = __dirname.slice(0, -6) + "uploaded";
  let result = "/current_files/" + employeeID + "/licenses/" + licenseName + ".";
  basePath += result;
  basePath = basePath.replaceAll("\\", "/");

  let fileNameExtension = "pdf";
  let fullPath = basePath + fileNameExtension;
  return await getPath(fullPath, result, response, fileNameExtension);
}

async function getCurrentTOROrDiploma(employeeID, diploma, document) {
  let response = "";
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);

  let basePath = __dirname.slice(0, -6) + "uploaded";
  let result = "/current_files/" + employeeID + "/educational_backgrounds/" + diploma + "/" + document + ".";
  basePath += result;
  basePath = basePath.replaceAll("\\", "/");
  
  let fileNameExtension = "pdf";
  let fullPath = basePath + fileNameExtension;
  return await getPath(fullPath, result, response, fileNameExtension);
}

async function getCurrentTrainingOrSeminarCertificate(employeeID, trainingOrSeminarName) {
  let response = "";
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);

  let basePath = __dirname.slice(0, -6) + "uploaded";
  let result = "/current_files/" + employeeID + "/trainings_or_seminars/" + trainingOrSeminarName + ".";
  basePath += result;
  basePath = basePath.replaceAll("\\", "/");

  let fileNameExtension = "pdf";
  let fullPath = basePath + fileNameExtension;
 return await getPath(fullPath, result, response, fileNameExtension);
}

async function getMarriageCertificate(conn, employeeID, requestID, statusID, folder) {
  let response = "";

  if (await UsersModel.getDetails(conn, employeeID) === null) {
    return "";
  }

  if (await isValidRequestID(conn, requestID) === false) {
    return "";
  }

  let statusFolder;
  switch (statusID) {
    case "0":
      statusFolder = "pending";
      break;
    case "1":
      statusFolder = "approved";
      break;
    default:
      throw 'Invalid value of statusID';
  }

  let fileName = await getFileName(conn, requestID, 'MARRIAGE CERTIFICATE');

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);

  let basePath = __dirname.slice(0, -6) + "uploaded";
  let result = "/requests/" + statusFolder + "/" + requestID + "/" + folder + "/" + fileName;
  basePath += result;
  basePath = basePath.replaceAll("\\", "/");

  return await getPath(basePath, result, response);
}

async function getBirthCertificate(conn, employeeID, requestID, statusID, folder, fileName) {
  let response = "";

  if (await UsersModel.getDetails(conn, employeeID) === null) {
    return "";
  }

  if (await isValidRequestID(conn, requestID) === false) {
    return "";
  }

  let statusFolder;
  switch (statusID) {
    case "0":
      statusFolder = "pending";
      break;
    case "1":
      statusFolder = "approved";
      break;
    default:
      throw 'Invalid value of statusID';
  }

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);

  let basePath = __dirname.slice(0, -6) + "uploaded";
  let result = "/requests/" + statusFolder + "/" + requestID + "/" + folder + "/" + fileName;
  basePath += result;
  basePath = basePath.replaceAll("\\", "/");

  return await getPath(conn, basePath, result, response);
}

async function getPRCID(conn, employeeID, requestID, statusID, folder) {
  let response = "";

  if (await UsersModel.getDetails(conn, employeeID) === null) {
    return "";
  }

  if (await isValidRequestID(conn, requestID) === false) {
    return "";
  }

  let statusFolder;
  switch (statusID) {
    case "0":
      statusFolder = "pending";
      break;
    case "1":
      statusFolder = "approved";
      break;
    default:
      throw 'Invalid value of statusID';
  }
  let isNewValue = folder === "to" ? true : false;
  let fileName = await getFileName(conn, requestID, 'PRC ID', isNewValue);

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);

  let basePath = __dirname.slice(0, -6) + "uploaded";
  let result = "/requests/" + statusFolder + "/" + requestID + "/" + folder + "/" + fileName;
  basePath += result;
  basePath = basePath.replaceAll("\\", "/");

  return await getPath(conn, basePath, result, response);
}

async function getTOROrDiploma(conn, employeeID, requestID, statusID, folder, document) {
  let response = "";

  if (await UsersModel.getDetails(conn, employeeID) === null) {
    return "";
  }

  if (await isValidRequestID(conn, requestID) === false) {
    return "";
  }

  let statusFolder;
  switch (statusID) {
    case "0":
      statusFolder = "pending";
      break;
    case "1":
      statusFolder = "approved";
      break;
    default:
      throw 'Invalid value of statusID';
  }

  let fileName = await getFileName(conn, requestID, document);
  fileName = fileName.trim().toLowerCase();
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);

  let basePath = __dirname.slice(0, -6) + "uploaded";
  let result = "/requests/" + statusFolder + "/" + requestID + "/" + folder + "/" + fileName;
  basePath += result;
  basePath = basePath.replaceAll("\\", "/");

  return await getPath(conn, basePath, result, response);
}

async function getTrainingOrSeminarCertificate(conn, employeeID, requestID, statusID, folder) {
  let response = "";

  if (await UsersModel.getDetails(conn, employeeID) === null) {
    return "";
  }

  if (await isValidRequestID(conn, requestID) === false) {
    return "";
  }

  let statusFolder;
  switch (statusID) {
    case "0":
      statusFolder = "pending";
      break;
    case "1":
      statusFolder = "approved";
      break;
    default:
      throw 'Invalid value of statusID';
  }

  let fileName = await getFileName(conn, requestID, 'TRAINING OR SEMINAR CERTIFICATE');

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);

  let basePath = __dirname.slice(0, -6) + "uploaded";
  let result = "/requests/" + statusFolder + "/" + requestID + "/" + folder + "/" + fileName;
  basePath += result;
  basePath = basePath.replaceAll("\\", "/");

  return await getPath(conn, basePath, result, response);
}

async function getFileName(conn, requestID, type, isNewValue = true) {
  let con = conn;
  let query = `SELECT TOP 1 
   OldValue AS 'old_value',
   NewValue AS 'new_value' 
   FROM RequestDtl 
   WHERE RequestHdrID = @RequestHdrID 
   AND ColumnName = @Type`;
  let response = await con.request()
    .input("RequestHdrID", sql.Int, requestID)
    .input("Type", sql.VarChar, type)
    .query(query);
  let fileName = isNewValue === true ? response.recordset[0].new_value : response.recordset[0].old_value;
  if (fileName !== null) {
    fileName = fileName.trim();
  } else {
    fileName = response.recordset[0].new_value;
    if (fileName === null) { throw 'fileName is null/empty string.'; }
    else { fileName = fileName.trim(); }
  }
  return fileName;
}


async function isValidRequestID(conn, requestID) {
  let con = conn;
  let query = `SELECT TOP 1 ID FROM RequestHdr WHERE ID = @ID`;
  let response = await con.request()
    .input("ID", sql.Int, requestID)
    .query(query);
  let length = response.recordsets[0].length;
  return (length > 0 ? true : false);
}

export default {
  isUploadedFileExistValidation,
  fileNameExtensionValidation,
  fileSizeValidation,
  createFile,
  getFileName,
  getMarriageCertificate,
  getPRCID,
  getBirthCertificate,
  getTrainingOrSeminarCertificate,
  getTOROrDiploma,
  getCurrentTOROrDiploma,
  getCurrentTrainingOrSeminarCertificate,
  getCurrentBirthCertificate,
  getCurrentPRCID,
  getCurrentMarriageCertificate,
}