import { database } from "../configuration/database.js";
import sql from 'mssql';
import helperMethods from "../utility/helperMethods.js";
import { fileURLToPath } from 'url';
import { dirname } from 'path';

async function get(conn, employeeID, token) {
  let con = conn;
  let query = `SELECT
  ISNULL(TRIM([From]), '') AS 'from',
  ISNULL(TRIM([To]), '') AS 'to',  
  ISNULL(TRIM(DiplomaDegreeHonor), '') AS 'diploma', 
  ISNULL(TRIM(Institution), '') AS 'institution_name',
  ISNULL(TRIM(InstitutionAddress), '') AS 'institution_address',
  '' AS 'attached_tor',
  '' AS 'attached_diploma'
  FROM [UE database]..Education
  WHERE EmployeeCode = @EmployeeID AND deleted != 1
  ORDER BY [From] DESC`;
  let response = await con.request()
    .input("EmployeeID", sql.VarChar, employeeID)
    .query(query);
  let records = response.recordsets[0];

  for (let i = 0; i < records.length; i++) {
    let diploma = records[i].diploma;

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    let directoryPath = __dirname.slice(0, -6);
    directoryPath = directoryPath.replaceAll("\\", "/");
    let path = directoryPath + "uploaded/current_files/" + employeeID + "/educational_backgrounds/" + diploma;
    if (await helperMethods.isFolderExist(path) === true) {
      if (await helperMethods.isFolderEmpty(path) === false) {
        let url = process.env.PROTOCOL + process.env.DOMAIN + ':' + process.env.APP_PORT + "/api/uploads/get-current-tor-or-diploma?token=" + token;
        let attachedTOR = url + "&diploma=" + diploma + "&document=tor";
        let attachedDiploma = url + "&diploma=" + diploma + "&document=diploma";
        records[i].attached_tor = attachedTOR;
        records[i].attached_diploma = attachedDiploma;
      } else {
        throw `The folder: ${diploma} is empty.`;
      }
    }
  }

  return records;
}

async function isDiplomaExist(conn, employeeID) {
  let con = conn;
  let query = `SELECT TOP 1 EmployeeCode
  FROM [UE database]..Education
  WHERE EmployeeCode = @EmployeeID AND deleted != 1
  ORDER BY [From] DESC`;
  let response = await con.request()
    .input("EmployeeID", sql.VarChar, employeeID)
    .query(query);

  let length = 0;

  if (response.recordset[0] !== undefined) {
    length = response.recordset[0].length;
  }

  return length > 0 ? true : false;
}

async function createRequest(conn, data) {
  let transaction;
  try {
    let requestID;
    transaction = new sql.Transaction(conn);
    await transaction.begin();

    const createdBy = data.employee_id;
    const destinationTable = "Education";

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

    if (actualColumnName === "TOR"
      ||
      actualColumnName === "DIPLOMA"
    ) {
      requestedNewValue = actualColumnName.toLowerCase() + "." + requestedNewValue.split('.').pop();
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
  if (column === "from") {
    return "From";
  } else if (column === "to") {
    return "To";
  } else if (column === "diploma") {
    return "DiplomaDegreeHonor";
  }
  else if (column === "institution_name") {
    return "Institution";
  }
  else if (column === "institution_address") {
    return "InstitutionAddress";
  }
  else if (column === "attach_tor") {
    return "TOR";
  }
  else if (column === "attach_diploma") {
    return "DIPLOMA";
  }
}




export default {
  get,
  createRequest,
  isDiplomaExist
}