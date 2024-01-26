import { database } from "../configuration/database.js";
import sql from 'mssql';
import UploadsModel from './uploadsModel.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import helperMethods from "../utility/helperMethods.js";

async function get(conn, employeeID, token) {
  let con = conn;
  let query = `    DECLARE @Mother AS VARCHAR(6), @Father AS VARCHAR(6), @Spouse AS VARCHAR(6), @MotherInLaw AS VARCHAR(13), @FatherInLaw AS VARCHAR(13);
  SET @Mother = 'Mother'; SET @Father = 'Father'; SET @Spouse = 'Spouse'; SET @MotherInLaw = 'Mother-In-Law'; SET @FatherInLaw = 'Father-In-Law';

  SELECT
  ISNULL(TRIM((SELECT TOP 1 F.FullName FROM [UE Database]..Family AS F WHERE FamType = @Mother AND F.EmployeeCode = E.EmployeeCode )), '') AS 'mother_full_name',
  ISNULL((SELECT TOP 1 F.Birthdate FROM [UE Database]..Family AS F WHERE FamType = @Mother AND F.EmployeeCode = E.EmployeeCode), '') AS 'mother_birth_date',
  FLOOR(DATEDIFF(DD, CASE
  WHEN ISNULL(CAST((SELECT TOP 1 F.Birthdate FROM [UE Database]..Family AS F WHERE FamType = @Mother AND F.EmployeeCode = E.EmployeeCode) AS DATE),'1900-01-01') < '1900-01-01' THEN '1900-01-01'
  ELSE ISNULL(CAST((SELECT TOP 1 F.Birthdate FROM [UE Database]..Family AS F WHERE FamType = @Mother AND F.EmployeeCode = E.EmployeeCode) AS DATE),'1900-01-01')
  END, GETDATE())/365.242) AS 'mother_age', 
  ISNULL(TRIM((SELECT TOP 1 F.Occupation FROM [UE Database]..Family AS F WHERE FamType = @Mother AND F.EmployeeCode = E.EmployeeCode )), '') AS 'mother_occupation',
  ISNULL(TRIM((SELECT TOP 1 F.CompanySchool FROM [UE Database]..Family AS F WHERE FamType = @Mother AND F.EmployeeCode = E.EmployeeCode )), '') AS 'mother_company_name',
  ISNULL((SELECT TOP 1 F.DateTimeUpdated FROM [UE Database]..Family AS F WHERE FamType = @Mother AND F.EmployeeCode = E.EmployeeCode), '') AS 'mother_date_time_updated',
  ISNULL(TRIM((SELECT TOP 1 F.FullName FROM [UE Database]..Family AS F WHERE FamType = @Father AND F.EmployeeCode = E.EmployeeCode )), '') AS 'father_full_name',
  ISNULL((SELECT TOP 1 F.Birthdate FROM [UE Database]..Family AS F WHERE FamType = @Father AND F.EmployeeCode = E.EmployeeCode ), '') AS 'father_birth_date',
  FLOOR(DATEDIFF(DD, CASE
  WHEN ISNULL(CAST((SELECT TOP 1 F.Birthdate FROM [UE Database]..Family AS F WHERE FamType = @Father AND F.EmployeeCode = E.EmployeeCode) AS DATE),'1900-01-01') < '1900-01-01' THEN '1900-01-01'
  ELSE ISNULL(CAST((SELECT TOP 1 F.Birthdate FROM [UE Database]..Family AS F WHERE FamType = @Father AND F.EmployeeCode = E.EmployeeCode) AS DATE),'1900-01-01')
  END, GETDATE())/365.242) AS 'father_age', 
  ISNULL(TRIM((SELECT TOP 1 F.Occupation FROM [UE Database]..Family AS F WHERE FamType = @Father AND F.EmployeeCode = E.EmployeeCode )), '') AS 'father_occupation',
  ISNULL(TRIM((SELECT TOP 1 F.CompanySchool FROM [UE Database]..Family AS F WHERE FamType = @Father AND F.EmployeeCode = E.EmployeeCode )), '') AS 'father_company_name',
  ISNULL((SELECT TOP 1 F.DateTimeUpdated FROM [UE Database]..Family AS F WHERE FamType = @Father AND F.EmployeeCode = E.EmployeeCode), '') AS 'father_date_time_updated',
  ISNULL(TRIM((SELECT TOP 1 F.FullName FROM [UE Database]..Family AS F WHERE FamType = @Spouse AND F.EmployeeCode = E.EmployeeCode )), '') AS 'spouse_full_name',
  ISNULL((SELECT TOP 1 F.Birthdate FROM [UE Database]..Family AS F WHERE FamType = @Spouse AND F.EmployeeCode = E.EmployeeCode ), '') AS 'spouse_birth_date',
  FLOOR(DATEDIFF(DD, CASE
  WHEN ISNULL(CAST((SELECT TOP 1 F.Birthdate FROM [UE Database]..Family AS F WHERE FamType = @Spouse AND F.EmployeeCode = E.EmployeeCode) AS DATE),'1900-01-01') < '1900-01-01' THEN '1900-01-01'
  ELSE ISNULL(CAST((SELECT TOP 1 F.Birthdate FROM [UE Database]..Family AS F WHERE FamType = @Spouse AND F.EmployeeCode = E.EmployeeCode) AS DATE),'1900-01-01')
  END, GETDATE())/365.242) AS 'spouse_age', 
  ISNULL(TRIM((SELECT TOP 1 F.Occupation FROM [UE Database]..Family AS F WHERE FamType = @Spouse AND F.EmployeeCode = E.EmployeeCode )), '') AS 'spouse_occupation',
  ISNULL(TRIM((SELECT TOP 1 F.CompanySchool FROM [UE Database]..Family AS F WHERE FamType = @Spouse AND F.EmployeeCode = E.EmployeeCode )), '') AS 'spouse_company_name',
  ISNULL((SELECT TOP 1 F.MarriageDate FROM [UE Database]..Family AS F WHERE FamType = @Spouse AND F.EmployeeCode = E.EmployeeCode ), '') AS 'spouse_marriage_date',
  ISNULL((SELECT TOP 1 F.DateTimeUpdated FROM [UE Database]..Family AS F WHERE FamType = @Spouse AND F.EmployeeCode = E.EmployeeCode), '') AS 'spouse_date_time_updated',
  ISNULL(TRIM((SELECT TOP 1 F.FullName FROM [UE Database]..Family AS F WHERE FamType = @MotherInLaw AND F.EmployeeCode = E.EmployeeCode )), '') AS 'mother_in_law_full_name',
  ISNULL((SELECT TOP 1 F.Birthdate FROM [UE Database]..Family AS F WHERE FamType = @MotherInLaw AND F.EmployeeCode = E.EmployeeCode ), '') AS 'mother_in_law_birth_date',
  FLOOR(DATEDIFF(DD, CASE
  WHEN ISNULL(CAST((SELECT TOP 1 F.Birthdate FROM [UE Database]..Family AS F WHERE FamType = @MotherInLaw AND F.EmployeeCode = E.EmployeeCode) AS DATE),'1900-01-01') < '1900-01-01' THEN '1900-01-01'
  ELSE ISNULL(CAST((SELECT TOP 1 F.Birthdate FROM [UE Database]..Family AS F WHERE FamType = @MotherInLaw AND F.EmployeeCode = E.EmployeeCode) AS DATE),'1900-01-01')
  END, GETDATE())/365.242) AS 'mother_in_law_age', 
  ISNULL(TRIM((SELECT TOP 1 F.Occupation FROM [UE Database]..Family AS F WHERE FamType = @MotherInLaw AND F.EmployeeCode = E.EmployeeCode )), '') AS 'mother_in_law_occupation',
  ISNULL(TRIM((SELECT TOP 1 F.CompanySchool FROM [UE Database]..Family AS F WHERE FamType = @MotherInLaw AND F.EmployeeCode = E.EmployeeCode )), '') AS 'mother_in_law_company_name',
  ISNULL((SELECT TOP 1 F.DateTimeUpdated FROM [UE Database]..Family AS F WHERE FamType = @MotherInLaw AND F.EmployeeCode = E.EmployeeCode), '') AS 'mother_in_law_date_time_updated',
  ISNULL(TRIM((SELECT TOP 1 F.FullName FROM [UE Database]..Family AS F WHERE FamType = @FatherInLaw AND F.EmployeeCode = E.EmployeeCode )), '') AS 'father_in_law_full_name',
  ISNULL((SELECT TOP 1 F.Birthdate FROM [UE Database]..Family AS F WHERE FamType = @FatherInLaw AND F.EmployeeCode = E.EmployeeCode ), '') AS 'father_in_law_birth_date',
  FLOOR(DATEDIFF(DD, CASE
  WHEN ISNULL(CAST((SELECT TOP 1 F.Birthdate FROM [UE Database]..Family AS F WHERE FamType = @FatherInLaw AND F.EmployeeCode = E.EmployeeCode) AS DATE),'1900-01-01') < '1900-01-01' THEN '1900-01-01'
  ELSE ISNULL(CAST((SELECT TOP 1 F.Birthdate FROM [UE Database]..Family AS F WHERE FamType = @FatherInLaw AND F.EmployeeCode = E.EmployeeCode) AS DATE),'1900-01-01')
  END, GETDATE())/365.242) AS 'father_in_law_age', 
  ISNULL(TRIM((SELECT TOP 1 F.Occupation FROM [UE Database]..Family AS F WHERE FamType = @FatherInLaw AND F.EmployeeCode = E.EmployeeCode )), '') AS 'father_in_law_occupation',
  ISNULL(TRIM((SELECT TOP 1 F.CompanySchool FROM [UE Database]..Family AS F WHERE FamType = @FatherInLaw AND F.EmployeeCode = E.EmployeeCode )), '') AS 'father_in_law_company_name',
  ISNULL((SELECT TOP 1 F.DateTimeUpdated FROM [UE Database]..Family AS F WHERE FamType = @FatherInLaw AND F.EmployeeCode = E.EmployeeCode), '') AS 'father_in_law_date_time_updated'
  FROM [UE database]..Employee AS E
  LEFT JOIN [UE DATABASE]..POSITION P  
  ON P.POSITIONCODE = E.POSITIONCODE  
  INNER JOIN ITMgt..Users U  
  ON U.CODE = E.EmployeeCode
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
  let result = response.recordsets[0][0];

  return {
    parents: {
      mother: {
        full_name: result.mother_full_name,
        birth_date: result.mother_birth_date,
        age: result.mother_age,
        occupation: result.mother_occupation,
        company_name: result.mother_company_name,
        date_time_updated: result.mother_date_time_updated
      },
      father: {
        full_name: result.father_full_name,
        birth_date: result.father_birth_date,
        age: result.father_age,
        occupation: result.father_occupation,
        company_name: result.father_company_name,
        date_time_updated: result.father_date_time_updated
      }
    },
    siblings: await getSiblings(conn, employeeID),
    spouse: {
      full_name: result.spouse_full_name,
      birth_date: result.spouse_birth_date,
      age: result.spouse_age,
      occupation: result.spouse_occupation,
      company_name: result.spouse_company_name,
      marriage_certificate: await getMarriageCertificate(employeeID, token),
      marriage_date: result.spouse_marriage_date,
      date_time_updated: result.spouse_date_time_updated
    },
    children: await getChildren(conn, employeeID, token),
    parents_in_law: {
      mother_in_law: {
        full_name: result.mother_in_law_full_name,
        birth_date: result.mother_in_law_birth_date,
        age: result.mother_in_law_age,
        occupation: result.mother_in_law_occupation,
        company_name: result.mother_in_law_company_name,
        date_time_updated: result.mother_in_law_date_time_updated
      },
      father_in_law: {
        full_name: result.father_in_law_full_name,
        birth_date: result.father_in_law_birth_date,
        age: result.father_in_law_age,
        occupation: result.father_in_law_occupation,
        company_name: result.father_in_law_company_name,
        date_time_updated: result.father_in_law_date_time_updated
      }
    },
  }
}

async function hasChange(conn, data) {
  let con = conn;
  if (Array.isArray(data) === true) {
    for (let item of data) {
      let query = `
      SELECT TOP 1 FullName
      FROM [UE database]..Family 
      WHERE FamType = @FamType 
      AND FullName = @FullName 
      AND Occupation = @Occupation 
      AND CompanySchool = @CompanySchool
      AND Birthdate = @Birthdate
      AND EmployeeCode = @EmployeeCode`;
      let response = await con.request()
        .input("FamType", sql.VarChar, item.family_type)
        .input("FullName", sql.VarChar, item.full_name.trim())
        .input("Occupation", sql.VarChar, item.occupation.trim())
        .input("CompanySchool", sql.VarChar, item.school_name_or_company_name.trim())
        .input("Birthdate", sql.Date, item.birth_date)
        .input("EmployeeCode", sql.VarChar, item.employee_id)
        .query(query);
      let length = response.recordsets[0].length;
      if (length === 0) {
        return true;
      }
    }
    return false;

  } else {
    let query = `SELECT TOP 1 FullName
                 FROM [UE database]..Family 
                 WHERE EmployeeCode = @EmployeeID
                 AND Occupation = @Occupation 
                 AND CompanySchool = @CompanySchool
                 AND FamType = @FamType
                 AND Birthdate = @Birthdate
                 AND FullName = @FullName`;
    let response = null;
    if (data.family_type === "Spouse" && data.marriage_date !== undefined) {
      query += " AND MarriageDate = @MarriageDate"
      response = await con.request()
        .input("EmployeeID", sql.VarChar, data.employee_id)
        .input("Occupation", sql.VarChar, data.occupation.trim())
        .input("CompanySchool", sql.VarChar, data.company_name.trim())
        .input("FamType", sql.VarChar, data.family_type)
        .input("Birthdate", sql.Date, data.birth_date)
        .input("FullName", sql.VarChar, data.full_name)
        .input("MarriageDate", sql.Date, data.marriage_date)
        .query(query);
    } else {
      response = await con.request()
        .input("EmployeeID", sql.VarChar, data.employee_id)
        .input("Occupation", sql.VarChar, data.occupation.trim())
        .input("CompanySchool", sql.VarChar, data.company_name.trim())
        .input("FamType", sql.VarChar, data.family_type)
        .input("Birthdate", sql.Date, data.birth_date)
        .input("FullName", sql.VarChar, data.full_name)
        .query(query);
    }
    let length = response.recordsets[0].length;
    return (length > 0 ? false : true);
  }

}

async function removeNoChanges(conn, data) {
  let con = conn;
  var unUsedIndexes = [];
  for (let item of data) {
    let query = `
    SELECT TOP 1 FullName
    FROM [UE database]..Family 
    WHERE FamType = @FamType 
    AND FullName = @FullName 
    AND Occupation = @Occupation 
    AND CompanySchool = @CompanySchool
    AND EmployeeCode = @EmployeeCode
    AND Birthdate = @Birthdate`;
    let response = await con.request()
      .input("FamType", sql.VarChar, item.family_type)
      .input("FullName", sql.VarChar, item.full_name.trim())
      .input("Occupation", sql.VarChar, item.occupation.trim())
      .input("CompanySchool", sql.VarChar, item.school_name_or_company_name.trim())
      .input("EmployeeCode", sql.VarChar, item.employee_id)
      .input("Birthdate", sql.Date, item.birth_date)
      .query(query);
    let length = response.recordsets[0].length;
    if (length === 1) {
      let index = data.findIndex(x => x.full_name === item.full_name)
      unUsedIndexes.push(index);
    }
  }

  for (var i = unUsedIndexes.length - 1; i >= 0; i--) {
    data.splice(unUsedIndexes[i], 1);
  }

  return data;
}

async function createRequest(conn, data) {
  let transaction;
  try {
    let requestID;
    transaction = new sql.Transaction(conn);
    await transaction.begin();
    const createdBy = Array.isArray(data) === true ? data[0].employee_id : data.employee_id;
    const familyType = Array.isArray(data) === true ? data[0].family_type : data.family_type;
    let familyTypeID = 0;
    const destinationTable = "Family";
    const requestType = Array.isArray(data) === true ? data[0].request_type : data.request_type;

    if (familyType === "Mother") {
      familyTypeID = 1;
    } else if (familyType === "Father") {
      familyTypeID = 2;
    }
    else if (familyType === "Sibling") {
      familyTypeID = 3;
    }
    else if (familyType === "Spouse") {
      familyTypeID = 4;
    }
    else if (familyType === "Child") {
      familyTypeID = 5;
    }
    else if (familyType === "Mother-In-Law") {
      familyTypeID = 6;
    }
    else if (familyType === "Father-In-Law") {
      familyTypeID = 7;
    } else {
      throw "Invalid value of familyType";
    }

    let request = new sql.Request(transaction);
    let query = `INSERT INTO [UE database]..RequestHdr 
             (CreatedBy, DateTimeCreated, DestinationTable, RequestType, FamilyType)
             VALUES 
             (@CreatedBy, GETDATE(), @DestinationTable, @RequestType, @FamilyType)`;
    request.input("CreatedBy", sql.VarChar, createdBy);
    request.input("DestinationTable", sql.VarChar, destinationTable);
    request.input("RequestType", sql.SmallInt, (requestType === "edit" ? 0 : 1));
    request.input("FamilyType", sql.SmallInt, familyTypeID);
    let response = await request.query(query);
    if (response.rowsAffected[0] === 0) {
      throw "No rows affected"
    }

    request = new sql.Request(transaction);
    query = `SELECT TOP 1 ID AS 'id' FROM [UE database]..RequestHdr ORDER BY DateTimeCreated DESC`;
    response = await request.query(query);
    requestID = response.recordset[0].id;

    if (requestType === "create" || requestType === "edit") {
      if (Array.isArray(data) === true) {
        for (const [index, item] of data.entries()) {
          let personQueueNumber = null;
          if (requestType === "create") {
            personQueueNumber = index;
            personQueueNumber++;
          }
          await manipulateTableRequestDtl(transaction, requestID, familyType, item, personQueueNumber);
        }
      } else {
        let personQueueNumber = null;
        if (requestType === "create") {
          personQueueNumber = 1;
        }
        await manipulateTableRequestDtl(transaction, requestID, familyType, data, personQueueNumber);
      }
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



async function manipulateTableRequestDtl(transaction, id, familyType, data, personQueueNumber) {
  const employeeID = data.employee_id;
  const familyID = data.family_id;
  delete data.family_id;
  delete data.employee_id;
  delete data.request_type;
  delete data.family_type;

  if (data.attach_marriage_certificate === "") {
    delete data.attach_marriage_certificate;
  }

  if (data.attach_birth_certificate === "") {
    delete data.attach_birth_certificate;
  }

  if (data.marriage_date === null) {
    delete data.marriage_date;
  }

  for (const column in data) {

    if (column === 'attach_marriage_certificate' || column === 'attach_birth_certificate') {

      if (column === 'attach_birth_certificate' && personQueueNumber === null) {
        let query = `INSERT INTO [UE database]..RequestDtl 
        (RequestHdrID, ColumnName, NewValue, FamilyRecno)
        VALUES 
        (@RequestHdrID, @ColumnName, @NewValue, @FamilyRecno)`;
        let request = new sql.Request(transaction);
        request.input("RequestHdrID", sql.Int, id);
        request.input("ColumnName", sql.VarChar, "BIRTH CERTIFICATE");
        request.input("NewValue", sql.VarChar, data.full_name.trim() + "." + data[column].split('.').pop());
        request.input("FamilyRecno", sql.SmallInt, familyID);

        let response = await request.query(query);
        if (response.rowsAffected[0] === 0) {
          throw "No rows affected"
        }
      } else {
        let query = `INSERT INTO [UE database]..RequestDtl 
      (RequestHdrID, ColumnName, NewValue, PersonQueueNumber)
      VALUES 
      (@RequestHdrID, @ColumnName, @NewValue, @PersonQueueNumber)`;
        let columnName = column === "attach_marriage_certificate" ? "MARRIAGE CERTIFICATE" : "BIRTH CERTIFICATE";
        let newValue = "";
        if (column === "attach_marriage_certificate") {
          newValue = "marriage_certificate." + data[column].split('.').pop();
        } else {
          newValue = data.full_name.trim() + "." + data[column].split('.').pop();
        }

        let request = new sql.Request(transaction);
        request.input("RequestHdrID", sql.Int, id);
        request.input("ColumnName", sql.VarChar, columnName);
        request.input("NewValue", sql.VarChar, newValue);
        request.input("PersonQueueNumber", sql.SmallInt, personQueueNumber);

        let response = await request.query(query);
        if (response.rowsAffected[0] === 0) {
          throw "No rows affected"
        }
      }

    } else {

      let actualColumnName = toActualColumnName(column);
      let columnValue = data[column];
      let request = new sql.Request(transaction);
      let query = `SELECT TOP 1 EmployeeCode
     FROM [UE database]..Family 
     WHERE EmployeeCode = @EmployeeCode AND FamType = '${familyType}' AND ${actualColumnName} = '${columnValue}'`;
      request.input("EmployeeCode", sql.VarChar, employeeID);
      let result = await request.query(query);
      let isExist = result.recordsets[0].length === 0 ? false : true;
      if (isExist === false) {

        let requestedNewValue = data[column];
        let columnCurrentValue = "";

        // ------------------------------------------------- EDIT -------------------------------------------------
        if (personQueueNumber === null) {
          request = new sql.Request(transaction);
          query = `SELECT TOP 1 ${actualColumnName}
       FROM [UE database]..Family 
       WHERE EmployeeCode = @EmployeeCode AND FamType = '${familyType}'`;

          if (familyID !== undefined) {
            query += ` AND Recno = ${familyID}`;
          }

          request.input("EmployeeCode", sql.VarChar, employeeID);
          let result = await request.query(query);
          let columnObject = result.recordset[0];
          columnCurrentValue = columnObject[Object.keys(columnObject)[0]]
          columnCurrentValue = columnCurrentValue === null ? "" : columnCurrentValue;

          if (columnCurrentValue === "" && requestedNewValue === "") {
            continue;
          }
        }
        // ------------------------------------------------- EDIT -------------------------------------------------

        // ------------------------------------------------- FOR BIRTHDATE -------------------------------------------------
        if (typeof columnCurrentValue === 'object') {
          const year = columnCurrentValue.getFullYear();
          const month = String(columnCurrentValue.getMonth() + 1).padStart(2, '0');
          const day = String(columnCurrentValue.getDate()).padStart(2, '0');
          columnCurrentValue = `${year}-${month}-${day}`;
        }
        // ------------------------------------------------- FOR BIRTHDATE -------------------------------------------------

        if (familyType !== "Father" && familyType !== "Mother") {

          // ------------------------------------------------- EDIT -------------------------------------------------
          if (personQueueNumber === null) {
            query = `INSERT INTO [UE database]..RequestDtl 
          (RequestHdrID, ColumnName, OldValue, NewValue, FamilyRecno)
          VALUES 
          (@RequestHdrID, @ColumnName, @OldValue, @NewValue, @FamilyRecno)`;
          }
          // ------------------------------------------------- EDIT -------------------------------------------------

          // ------------------------------------------------- CREATE -------------------------------------------------
          else {
            query = `INSERT INTO [UE database]..RequestDtl 
          (RequestHdrID, ColumnName, NewValue, PersonQueueNumber)
          VALUES 
          (@RequestHdrID, @ColumnName, @NewValue, @PersonQueueNumber)`;
          }
          // ------------------------------------------------- CREATE -------------------------------------------------

        } else {
          query = `INSERT INTO [UE database]..RequestDtl 
        (RequestHdrID, ColumnName, OldValue, NewValue)
        VALUES 
        (@RequestHdrID, @ColumnName, @OldValue, @NewValue)`;
        }

        request = new sql.Request(transaction);
        request.input("RequestHdrID", sql.Int, id);
        request.input("ColumnName", sql.VarChar, actualColumnName.trim());
        if (personQueueNumber === null) {
          request.input("OldValue", sql.VarChar, columnCurrentValue.trim());
        }
        request.input("NewValue", sql.VarChar, requestedNewValue.toUpperCase().trim());

        if (familyType !== "Father" && familyType !== "Mother") {
          if (personQueueNumber === null) {
            request.input("FamilyRecno", sql.Int, familyID);
          } else {
            request.input("PersonQueueNumber", sql.SmallInt, personQueueNumber);
          }
        }

        let response = await request.query(query);
        if (response.rowsAffected[0] === 0) {
          throw "No rows affected"
        }

      }
    }
  }
}

function toActualColumnName(columnName) {
  if (columnName === "occupation") {
    return "Occupation";
  }
  else if (columnName === "full_name") {
    return "FullName";
  }
  else if (columnName === "birth_date") {
    return "Birthdate";
  }
  else if (columnName === "marriage_date") {
    return "MarriageDate";
  }
  else if (columnName === "company_name" || columnName === "school_name_or_company_name") {
    return "CompanySchool";
  }
}

async function getSiblings(conn, employeeID) {
  let con = conn;
  let query = `SELECT 
  Recno AS 'family_id',
  ISNULL(TRIM(FullName), '')  AS 'full_name', 
  ISNULL(Birthdate, '') AS 'birth_date',   
  FLOOR(DATEDIFF(DD, CASE
	WHEN ISNULL(CAST(Birthdate AS DATE),'1900-01-01') < '1900-01-01' THEN '1900-01-01'
	ELSE ISNULL(CAST(Birthdate AS DATE),'1900-01-01')
  END, GETDATE())/365.242) AS 'age', 
  ISNULL(TRIM(Occupation), '') AS 'occupation', 
  ISNULL(TRIM(CompanySchool), '') AS 'school_name_or_company_name',
  ISNULL(DateTimeUpdated, '') AS 'date_time_updated' 
  FROM [UE database]..Family
  WHERE FamType = 'Sibling' AND EmployeeCode = @EmployeeID`;
  let response = await con.request()
    .input("EmployeeID", sql.VarChar, employeeID)
    .query(query);
  return response.recordsets[0];
}

async function getChildren(conn, employeeID, token) {
  let con = conn;
  let query = `SELECT 
  Recno AS 'family_id',
  ISNULL(TRIM(FullName), '')  AS 'full_name', 
  ISNULL(Birthdate, '') AS 'birth_date',   
  FLOOR(DATEDIFF(DD, CASE
	WHEN ISNULL(CAST(Birthdate AS DATE),'1900-01-01') < '1900-01-01' THEN '1900-01-01'
	ELSE ISNULL(CAST(Birthdate AS DATE),'1900-01-01')
  END, GETDATE())/365.242) AS 'age', 
  ISNULL(TRIM(Occupation), '') AS 'occupation', 
  ISNULL(TRIM(CompanySchool), '') AS 'school_name_or_company_name',
  '' AS 'birth_certificate',
  ISNULL(DateTimeUpdated, '') AS 'date_time_updated' 
  FROM [UE database]..Family
  WHERE FamType = 'Child' AND EmployeeCode = @EmployeeID`;
  let response = await con.request()
    .input("EmployeeID", sql.VarChar, employeeID)
    .query(query);
  let records = response.recordsets[0];

  for (let i = 0; i < records.length; i++) {
    let fullName = records[i].full_name;

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    let directoryPath = __dirname.slice(0, -6);
    directoryPath = directoryPath.replaceAll("\\", "/");
    let path = directoryPath + "uploaded/current_files/" + employeeID + "/family_backgrounds/children/birth_certificate/";
    if (await helperMethods.isFolderExist(path) === true) {
      if (await helperMethods.isFolderEmpty(path) === false) {

        let firstPath = path + fullName + ".pdf";
        let secondPath = path + fullName + ".jpg";
        let thirdPath = path + fullName + ".jpeg";
        let fourthPath = path + fullName + ".png";

        let isFound = false;

        if (await helperMethods.isExist(firstPath) === true) { isFound = true; }
        else if (await helperMethods.isExist(secondPath) === true) { isFound = true; }
        else if (await helperMethods.isExist(thirdPath) === true) { isFound = true; }
        else if (await helperMethods.isExist(fourthPath) === true) { isFound = true; }

        if (isFound === true) {
          let url = process.env.PROTOCOL + process.env.DOMAIN + ':' + process.env.APP_PORT + "/api/uploads/get-current-birth-certificate?token=" + token;
          url += "&fileName=" + fullName;
          records[i].birth_certificate = url;
        }

      } else {
        throw `The folder birth_certificate was not found.`;
      }
    }
  }

  return records;
}

async function getMarriageCertificate(employeeID, token) {
  if (await UploadsModel.getCurrentMarriageCertificate(employeeID) === "") {
    return "";
  }
  return process.env.PROTOCOL + process.env.DOMAIN + ':' + process.env.APP_PORT + "/api/uploads/get-current-marriage-certificate?token=" + token;
}

export default {
  get,
  hasChange,
  createRequest,
  getSiblings,
  getChildren,
  removeNoChanges,
  getMarriageCertificate
}