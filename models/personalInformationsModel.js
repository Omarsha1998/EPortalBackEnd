import { database } from "../configuration/database.js";
import sql from 'mssql';

async function get(conn, employeeID) {
  let con = conn;
  let query = `SELECT 
  TRIM(E.EmployeeCode) AS 'employee_id',
  TRIM(E.LastName) AS 'last_name',  
  TRIM(E.FirstName) AS 'first_name',  
  ISNULL(TRIM(E.MiddleName),'') AS 'middle_name',  
  ISNULL(TRIM(E.ExtName), '') AS 'extension_name',
  ISNULL(TRIM(E.Nickname), '') AS 'nick_name',
  TRIM(E.LastName + ', ' + E.FirstName +' ' + E.MiddleName + '. ' + E.ExtName) AS 'full_name', 
  TRIM(E.LastName + ', ' + E.FirstName + ' ' + LEFT(E.MiddleName, 1) + '. ' + E.ExtName) AS 'name',
  CASE
  WHEN E.Sex = 'M' THEN 'MALE'
  WHEN E.Sex = 'F' THEN 'FEMALE'
  ELSE ''
  END AS 'gender',
  ISNULL(TRIM(E.UERMEmail),'') AS 'uerm_email',
  ISNULL(TRIM(E.EMail),'') AS 'personal_email',
  ISNULL(TRIM(E.MobileNo), '') AS 'mobile_no',  
  ISNULL(TRIM(E.Permanent_TelNo), '') AS 'telephone_no',
  ISNULL(TRIM(E.Permanent_Address), '') AS 'address',
  ISNULL(CONVERT(DATE,E.Birthdate),  '') AS 'birth_date', 
  FLOOR(DATEDIFF(DD, CASE
  WHEN ISNULL(CAST(E.Birthdate AS DATE),'1900-01-01') < '1900-01-01' THEN '1900-01-01'
  ELSE ISNULL(CAST(E.Birthdate AS DATE),'1900-01-01')
  END, GETDATE())/365.242) AS 'age',  
  ISNULL(TRIM(E.Height), '') AS 'height',
  ISNULL(TRIM(E.[Weight]), '') AS 'weight',
  ISNULL(TRIM(E.PlaceOfBirth), '') AS 'place_of_birth',
  ISNULL(TRIM(CT.[Description]), '') AS 'citizenship', 
  ISNULL(CS.ID, 0) AS 'civil_status_id',
  ISNULL(TRIM(CS.[Description]), '') AS 'civil_status',
  ISNULL(R.ReligionCode, 0) AS 'religion_id',
  ISNULL(TRIM(R.[Description]), '') AS 'religion',
  ISNULL(TRIM(E.DeptCode), '') AS 'department_id',
  ISNULL(REPLACE(D.[DESCRIPTION],'’',''''),'') AS 'department_name',  
  ISNULL(REPLACE(P.POSITION,'’',''''), '') AS 'job_position',
  ISNULL(CONVERT(VARCHAR(MAX),E.DateHired,23),'1900-01-01') AS 'hired_date',
  ISNULL(CONVERT(VARCHAR(MAX),E.DateRegular,23),  '') AS 'regularized_date',  
  ISNULL(TRIM(E.TIN), '') AS 'tin',  
  ISNULL(TRIM(E.PhilHealth), '') AS 'phil_health',  
  ISNULL(TRIM(E.PagIBIG_No), '') AS 'pagibig_no',  
  ISNULL(TRIM(E.SSS_No), '') AS 'sss_no',
  ISNULL(TRIM(E.ATM_No), '') AS 'atm_no',
  ISNULL(TRIM(E.ContactPerson), '') AS 'contact_person_name', 
  ISNULL(TRIM(E.Contact_Address), '') AS 'contact_person_address',  
  ISNULL(TRIM(E.Contact_TelNo), '') AS 'contact_person_contact_no',
  ISNULL((SELECT TOP 1 [DATE] FROM [UE database]..Employeelog WHERE EmployeeCode = E.EmployeeCode ORDER BY DATE DESC), '') AS 'date_time_updated'
  FROM [UE database]..Employee AS E
  LEFT JOIN [UE DATABASE]..POSITION P  
  ON P.POSITIONCODE = E.POSITIONCODE  
  LEFT JOIN [UE database]..Citizenship CT  
  ON CONVERT(VARCHAR(MAX),CT.CITIZENSHIPCODE) = CONVERT(VARCHAR(MAX),E.CITIZEN)  
  LEFT JOIN [UE DATABASE]..CIVILSTATUS CS
  ON CONVERT(VARCHAR(MAX),CS.ID) = CONVERT(VARCHAR(MAX),E.CIVILSTATUS)
  LEFT JOIN [UE DATABASE]..RELIGION R  
  ON R.RELIGIONCODE = E.RELIGIONCODE
  LEFT JOIN UERMMMC..SECTIONS D  
  ON D.CODE = E.DEPTCODE
  WHERE E.EmployeeCode = @EmployeeID`;
  let response = await con.request()
    .input("EmployeeID", sql.VarChar, employeeID)
    .query(query);
    return response.recordsets[0][0];
}

async function getAllReligions(conn) {
  let con = conn;
  let query = `SELECT 
                ReligionCode AS 'religion_id', 
                ISNULL(TRIM([Description]), '') AS 'religion_name'
                FROM [UE database]..Religion 
                ORDER BY religion_name ASC`;
  let response = await con.request()
    .query(query);
  return response.recordsets[0];
}

async function getAllCivilStatuses(conn) {
  let con = conn;
  let query = `SELECT 
               ID AS 'civil_status_id',
               ISNULL(TRIM([DESCRIPTION]), '') AS 'civil_status_name' 
               FROM [UE DATABASE]..CivilStatus
               ORDER BY civil_status_name ASC`;
  let response = await con.request()
    .query(query);
  return response.recordsets[0];
}


async function hasChange(conn, data) {
  let con = conn;
  let query = `SELECT TOP 1 EmployeeCode
               FROM [UE database]..Employee 
               WHERE EmployeeCode = @EmployeeID
               AND LastName = @LastName 
               AND FirstName = @FirstName 
               AND MiddleName = @MiddleName
               AND MiddleInitial = @MiddleInitial
               AND ExtName = @ExtName
               AND Nickname = @Nickname
               AND Email = @Email
               AND MobileNo = @MobileNo 
               AND Permanent_TelNo = @PermanentTelNo
               AND Height = @Height
               AND Weight = @Weight
               AND Permanent_Address = @Permanent_Address
               AND CivilStatus = @CivilStatus
               AND ReligionCode = @ReligionCode
               AND ContactPerson = @ContactPerson
               AND Contact_Address = @ContactAddress
               AND Contact_TelNo = @ContactTelNo`;
  let response = await con.request()
    .input("EmployeeID", sql.VarChar, data.employee_id)
    .input("LastName", sql.VarChar, data.last_name.trim())
    .input("FirstName", sql.VarChar, data.first_name.trim())
    .input("MiddleName", sql.VarChar, data.middle_name.trim())
    .input("MiddleInitial", sql.VarChar, data.middle_name.charAt(0).trim())
    .input("ExtName", sql.VarChar, data.extension_name.trim())
    .input("Nickname", sql.VarChar, data.nick_name.trim())
    .input("Email", sql.VarChar, data.personal_email.trim())
    .input("MobileNo", sql.VarChar, data.mobile_no.trim())
    .input("PermanentTelNo", sql.VarChar, data.telephone_no.trim())
    .input("Height", sql.VarChar, data.height.trim())
    .input("Weight", sql.VarChar, data.weight.trim())
    .input("Permanent_Address", sql.VarChar, data.address.trim())
    .input("CivilStatus", sql.Int, data.civil_status_id)
    .input("ReligionCode", sql.Int, data.religion_id)
    .input("ContactPerson", sql.VarChar, data.contact_person_name.trim())
    .input("ContactAddress", sql.VarChar, data.contact_person_address.trim())
    .input("ContactTelNo", sql.VarChar, data.contact_person_contact_no.trim())
    .query(query);
  let length = response.recordsets[0].length;
  return (length > 0 ? false : true);
}

async function createRequest(conn, data) {
  let transaction;
  try {
    transaction = new sql.Transaction(conn);
    await transaction.begin();
    const createdBy = data.employee_id;
    const destinationTable = "Employee";
    const requestType = 0; // 0 = Edit

    let request = new sql.Request(transaction);
    let query = `INSERT INTO [UE database]..RequestHdr 
             (CreatedBy, DateTimeCreated, DestinationTable, RequestType)
             VALUES 
             (@CreatedBy, GETDATE(), @DestinationTable, @RequestType)`;
    request.input("CreatedBy", sql.VarChar, createdBy);
    request.input("DestinationTable", sql.VarChar, destinationTable);
    request.input("RequestType", sql.SmallInt, requestType);
    let response = await request.query(query);
    if (response.rowsAffected[0] === 0) {
      throw "No rows affected"
    }

    request = new sql.Request(transaction);
    query = `SELECT TOP 1 ID AS 'id' FROM [UE database]..RequestHdr ORDER BY DateTimeCreated DESC`;
    response = await request.query(query);
    const id = response.recordset[0].id;

    let employeeID = data.employee_id;
    delete data.employee_id

    for (const column in data) {
      let actualColumnName = toActualColumnName(column);
      let columnValue = data[column];
      let request = new sql.Request(transaction);
      let query = `SELECT TOP 1 EmployeeCode
       FROM [UE database]..Employee 
       WHERE EmployeeCode = @EmployeeCode AND ${actualColumnName} = '${columnValue}'`;
      request.input("EmployeeCode", sql.VarChar, employeeID);
      let result = await request.query(query);
      let isExist = result.recordsets[0].length === 0 ? false : true;
      if (isExist === false) {
        request = new sql.Request(transaction);
        query = `SELECT TOP 1 ${actualColumnName}
         FROM [UE database]..Employee 
         WHERE EmployeeCode = @EmployeeCode`;
        request.input("EmployeeCode", sql.VarChar, employeeID);
        let result = await request.query(query);
        let columnObject = result.recordset[0];
        let columnCurrentValue = columnObject[Object.keys(columnObject)[0]]
        let requestedNewValue = data[column];
        if (actualColumnName === "CivilStatus" || actualColumnName === "ReligionCode") {
          columnCurrentValue = await getReadableValue(transaction, actualColumnName, columnCurrentValue);
          requestedNewValue = await getReadableValue(transaction, actualColumnName, columnValue);
        }
        columnCurrentValue = columnCurrentValue === null ? "" : columnCurrentValue;

        if (columnCurrentValue === "" && requestedNewValue === "") {
          continue;
        }

        request = new sql.Request(transaction);
        query = `INSERT INTO [UE database]..RequestDtl 
                 (RequestHdrID, ColumnName, OldValue, NewValue)
                 VALUES 
                 (@RequestHdrID, @ColumnName, @OldValue, @NewValue)`;
        request.input("RequestHdrID", sql.Int, id);
        request.input("ColumnName", sql.VarChar, actualColumnName.trim());
        request.input("OldValue", sql.VarChar, columnCurrentValue.trim());
        request.input("NewValue", sql.VarChar, requestedNewValue.toUpperCase().trim());
        let response = await request.query(query);
        if (response.rowsAffected[0] === 0) {
          throw "No rows affected"
        }
      }
    }

    await transaction.commit();

  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}


async function getReadableValue(transaction, actualColumnName, actualColumnValue) {
  if (actualColumnName === "CivilStatus") {
    let query = `SELECT TOP 1 [Description] AS 'description'
     FROM [UE database]..CivilStatus WHERE ID = @ID`;
    let request = new sql.Request(transaction);
    request.input("ID", sql.Int, actualColumnValue);
    let response = await request.query(query);
    return response.recordset[0].description;
  } else if (actualColumnName === "ReligionCode") {
    let query = `SELECT TOP 1 [Description] AS 'description'
     FROM [UE database]..Religion WHERE ReligionCode = @ID`;
    let request = new sql.Request(transaction);
    request.input("ID", sql.Int, actualColumnValue);
    let response = await request.query(query);
    return response.recordset[0].description;
  }
}

function toActualColumnName(columnName) {
  if (columnName === "last_name") {
    return "LastName";
  }
  else if (columnName === "first_name") {
    return "FirstName";
  }
  else if (columnName === "middle_name") {
    return "MiddleName";
  }
  else if (columnName === "extension_name") {
    return "ExtName";
  }
  else if (columnName === "nick_name") {
    return "Nickname";
  }
  else if (columnName === "personal_email") {
    return "EMail";
  }
  else if (columnName === "mobile_no") {
    return "MobileNo";
  }
  else if (columnName === "telephone_no") {
    return "Permanent_TelNo";
  }
  else if (columnName === "height") {
    return "Height";
  } else if (columnName === "weight") {
    return "Weight";
  }
  else if (columnName === "address") {
    return "Permanent_Address";
  }
  if (columnName === "civil_status_id") {
    return "CivilStatus";
  }
  else if (columnName === "religion_id") {
    return "ReligionCode";
  }
  else if (columnName === "contact_person_name") {
    return "ContactPerson";
  }
  else if (columnName === "contact_person_address") {
    return "Contact_Address";
  }
  else if (columnName === "contact_person_contact_no") {
    return "Contact_TelNo";
  }
}

export default {
  get,
  getAllReligions,
  getAllCivilStatuses,
  createRequest,
  hasChange,
}