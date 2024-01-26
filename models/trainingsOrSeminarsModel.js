import { database } from "../configuration/database.js";
import sql from 'mssql';
import helperMethods from "../utility/helperMethods.js";
import { fileURLToPath } from 'url';
import { dirname } from 'path';

async function get(conn, employeeID, token) {
  let con = conn;
  let query = `SELECT
  ISNULL(TRIM(TrainingOrSeminarName), '') AS 'training_or_seminar_name',
  ISNULL(TRIM(IssuedBy), '') AS 'issued_by',  
  FromDate AS 'from_date', 
  ToDate AS 'to_date',
  ISNULL(TRIM(Place), '') AS 'place',
  '' AS 'attached_training_or_seminar_certificate'
  FROM HR..EmployeeCompletedTrainingOrSeminar
  WHERE EmployeeCode = @EmployeeID
  ORDER BY FromDate DESC`;
  let response = await con.request()
    .input("EmployeeID", sql.VarChar, employeeID)
    .query(query);
  let records = response.recordsets[0];

  for (let i = 0; i < records.length; i++) {
    let trainingOrSeminarName = records[i].training_or_seminar_name;

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    let directoryPath = __dirname.slice(0, -6);
    directoryPath = directoryPath.replaceAll("\\", "/");

    let path = directoryPath + "uploaded/current_files/" + employeeID + "/trainings_or_seminars/";

    if (await helperMethods.isFolderExist(path) === true) {
      if (await helperMethods.isFolderEmpty(path) === false) {
        let url = process.env.PROTOCOL + process.env.DOMAIN + ':' + process.env.APP_PORT + "/api/uploads/get-current-training-or-seminar-certificate?token=" + token;
        let attachedCertificate = url + "&trainingOrSeminarName=" + trainingOrSeminarName;
        records[i].attached_training_or_seminar_certificate = attachedCertificate;
      } else {
        throw `The folder: (trainings_or_seminars) is empty.`;
      }
    }
  }

  return records;
}

async function isTrainingOrSeminarNameExist(conn, employeeID, trainingOrSeminarName) {
  let con = conn;
  let query = `SELECT TOP 1 EmployeeCode
  FROM HR..EmployeeCompletedTrainingOrSeminar
  WHERE EmployeeCode = @EmployeeID AND TrainingOrSeminarName = @TrainingOrSeminarName`;
  let response = await con.request()
    .input("EmployeeID", sql.VarChar, employeeID)
    .input("TrainingOrSeminarName", sql.VarChar, trainingOrSeminarName)
    .query(query);

    let length = response.recordsets[0].length;

  return length > 0 ? true : false;
}

async function createRequest(conn, data) {
  let transaction;
  try {
    let requestID;
    transaction = new sql.Transaction(conn);
    await transaction.begin();

    const createdBy = data.employee_id;
    const destinationTable = "EmployeeCompletedTrainingOrSeminar";

    let request = new sql.Request(transaction);
    let query = `INSERT INTO [UE database]..RequestHdr 
             (CreatedBy, DateTimeCreated, DestinationTable, RequestType)
             VALUES 
             (@CreatedBy, GETDATE(), @DestinationTable, @RequestType)`;
    request.input("CreatedBy", sql.VarChar, createdBy);
    request.input("DestinationTable", sql.VarChar, destinationTable);
    request.input("RequestType", sql.SmallInt, 1); // 1 = create
    let response = await request.query(query);
    if (response.rowsAffected[0] === 0) {
      throw "No rows affected"
    }

    request = new sql.Request(transaction);
    query = `SELECT TOP 1 ID AS 'request_id' FROM [UE database]..RequestHdr ORDER BY DateTimeCreated DESC`;
    response = await request.query(query);
    requestID = response.recordset[0].request_id;

    if (data.request_type === "create") {
      await manipulateTableRequestDtl(transaction, requestID, data);
    } else {
      throw "Invalid value of request type";
    }

    await transaction.commit();
    return requestID;
  } catch (error) {
    await transaction.rollback();
    throw error;
  } 
}

async function manipulateTableRequestDtl(transaction, id, data) {
  delete data.employee_id;
  delete data.request_type;

  for (const column in data) {
    let actualColumnName = toActualColumnName(column);
    let requestedNewValue = data[column];

    if (actualColumnName === "TRAINING OR SEMINAR CERTIFICATE") {
      requestedNewValue =   data['training_or_seminar_name'] + "." + requestedNewValue.split('.').pop();
    } else {
      requestedNewValue.toUpperCase().trim()
    }

    let query = `INSERT INTO [UE database]..RequestDtl 
          (RequestHdrID, ColumnName, NewValue)
          VALUES 
          (@RequestHdrID, @ColumnName, @NewValue)`;

    let request = new sql.Request(transaction);
    request.input("RequestHdrID", sql.Int, id);
    request.input("ColumnName", sql.VarChar, actualColumnName.trim());
    request.input("NewValue", sql.VarChar, requestedNewValue);

    let response = await request.query(query);
    if (response.rowsAffected[0] === 0) {
      throw "No rows affected"
    }

  }
}

function toActualColumnName(column) {
  if (column === "training_or_seminar_name") {
    return "TrainingOrSeminarName";
  } else if (column === "issued_by") {
    return "IssuedBy";
  } else if (column === "from_date") {
    return "FromDate";
  }
  else if (column === "to_date") {
    return "ToDate";
  }
  else if (column === "place") {
    return "Place";
  }else if (column === "attach_training_or_seminar_certificate"){
    return "TRAINING OR SEMINAR CERTIFICATE";
  }
}

export default {
  get,
  createRequest,
  isTrainingOrSeminarNameExist
}