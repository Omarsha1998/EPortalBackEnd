import { database } from "../configuration/database.js";
import sql from 'mssql';
import UsersModel from './usersModel.js';
import helperMethods from "../utility/helperMethods.js";

async function get(conn, employeeID, dateRangeSearch) {
  let otherRequests = dateRangeSearch.other_requests;
  return {
    minimum_date_with_pending_request: await getMinimumDateWithPendingRequest(conn, employeeID),
    pending: await getPending(conn, employeeID, otherRequests.pending.date_from, otherRequests.pending.date_to),
    my_approved: await getMyApproved(conn, employeeID, otherRequests.my_approved.date_from, otherRequests.my_approved.date_to),
  }
}

function renameColumnName(recordSets) {
  let response = [];
  for (const item of recordSets) {
    if (item.column_name === "LastName") {
      item.column_name = "Last Name";
    }
    else if (item.column_name === "FirstName") {
      item.column_name = "First Name";
    }
    else if (item.column_name === "MiddleName") {
      item.column_name = "Middle Name";
    }
    else if (item.column_name === "ExtName") {
      item.column_name = "Extension Name";
    }
    else if (item.column_name === "Nickname") {
      item.column_name = "Nick Name";
    }
    else if (item.column_name === "EMail") {
      item.column_name = "Personal Email";
    }
    else if (item.column_name === "MobileNo") {
      item.column_name = "Mobile No";
    }
    else if (item.column_name === "Permanent_TelNo") {
      item.column_name = "Telephone No";
    }
    else if (item.column_name === "Height") {
      item.column_name = "Height (cm)";
    }
    else if (item.column_name === "Weight") {
      item.column_name = "Weight (kg)";
    }
    else if (item.column_name === "Permanent_Address") {
      item.column_name = "Address";
    }
    else if (item.column_name === "CivilStatus") {
      item.column_name = "Civil Status";
    } else if (item.column_name === "ReligionCode") {
      item.column_name = "Religion";
    }
    else if (item.column_name === "ContactPerson") {
      item.column_name = "Contact Person Name";
    }
    else if (item.column_name === "Contact_Address") {
      item.column_name = "Contact Person Address";
    }
    else if (item.column_name === "Contact_TelNo") {
      item.column_name = "Contact Person Contact No";
    }
    else if (item.column_name === "ExpirationDate") {
      item.column_name = "Expiration Date";
    }
    else if (item.column_name === "FullName") {
      item.column_name = "Full Name";
    }
    else if (item.column_name === "Birthdate") {
      item.column_name = "Birth Date";
    }
    else if (item.column_name === "MarriageDate") {
      item.column_name = "Marriage Date";
    }
    else if (item.column_name === "CompanySchool") {
      item.column_name = "Company Name or School Name";
    }
    else if (item.column_name === "DiplomaDegreeHonor") {
      item.column_name = "Diploma";
    }
    else if (item.column_name === "Institution") {
      item.column_name = "Institution Name";
    }
    else if (item.column_name === "InstitutionAddress") {
      item.column_name = "Institution Address";
    }
    else if (item.column_name === "TrainingOrSeminarName") {
      item.column_name = "Training or Seminar Name";
    }
    else if (item.column_name === "IssuedBy") {
      item.column_name = "Issued By";
    }
    else if (item.column_name === "FromDate") {
      item.column_name = "From Date";
    }
    else if (item.column_name === "ToDate") {
      item.column_name = "To Date";
    }

    item.column_name = item.column_name.toUpperCase();
    response.push(item);
  }
  return response;
}

async function getRequestedFields(conn, requestID, statusID) {
  let requestedFields = "";
  let con = conn;
  let query = `SELECT TOP 1 
                DestinationTable AS 'destination_table',
                FamilyType AS 'family_type'
                FROM RequestHdr 
                WHERE ID = @ID`;
  let response = await con.request()
    .input("ID", sql.Int, requestID)
    .query(query);
  const destinationTable = response.recordsets[0][0].destination_table.trim();
  const familyType = response.recordsets[0][0].family_type;

  switch (destinationTable) {
    case "Employee":
      requestedFields += "PERSONAL INFORMATION ";
      break;
    case "Family":
      requestedFields += "FAMILY BACKGROUND";
      if (familyType === 0) {
        throw 'The value of family_type cannot be zero when the value of destination table is not Family.';
      } else {
        if (familyType === 1) {
          requestedFields += " (MOTHER) ";
        } else if (familyType === 2) {
          requestedFields += " (FATHER) ";
        } else if (familyType === 3) {
          if (await isMoreThanOne(conn, requestID) === true) {
            requestedFields += " (SIBLINGS) ";
          } else {
            requestedFields += " (SIBLING) ";
          }
        }
        else if (familyType === 4) {
          requestedFields += " (SPOUSE) ";
        }
        else if (familyType === 5) {
          if (await isMoreThanOne(conn, requestID) === true) {
            requestedFields += " (CHILDREN) ";
          } else {
            requestedFields += " (CHILD) ";
          }
        } else if (familyType === 6) {
          requestedFields += " (MOTHER IN LAW) ";
        }
        else if (familyType === 7) {
          requestedFields += " (FATHER IN LAW) ";
        }
      }
      break;
    case "License":
      requestedFields += "LICENSE ";
      break;
    case "Education":
      requestedFields += "EDUCATIONAL BACKGROUND ";
      break;
    case "EmployeeCompletedTrainingOrSeminar":
      requestedFields += "TRAINING OR SEMINAR ";
      break;
    default:
      throw 'The value of destinationTable (' + destinationTable + ') was not allowed in the source codes.';
  }

  requestedFields += "= ";

  if (requestedFields.includes("(SIBLINGS)") === true || requestedFields.includes("(CHILDREN)") === true) {

    query = `SELECT DISTINCT FamilyRecno
    FROM [UE database]..RequestDtl 
    WHERE RequestHdrID = @ID
    AND CurrentStatus = @CurrentStatus`;
    response = await con.request()
      .input("ID", sql.Int, requestID)
      .input("CurrentStatus", sql.Int, statusID)
      .query(query);

    let prefix = "";
    let number = 1;
    if (familyType === 3) {
      prefix = "S";
    } else if (familyType === 5) {
      prefix = "C";
    } else {
      throw "Invalid value of familyType";
    }

    let familyIDs = response.recordsets[0];
    requestedFields += await processFamilyIDs(con, familyIDs, prefix, number, requestID, statusID);

  } else {
    query = `SELECT ColumnName AS 'column_name' 
           FROM [UE database]..RequestDtl 
           WHERE RequestHdrID = @ID
           AND CurrentStatus = @CurrentStatus`;
    response = await con.request()
      .input("ID", sql.Int, requestID)
      .input("CurrentStatus", sql.Int, statusID)
      .query(query);

    let elements = renameColumnName(response.recordsets[0]);
    elements.forEach((element, index) => {
      requestedFields += element.column_name;
      if (index !== elements.length - 1) {
        requestedFields += ", ";
      }
    });
  }

  return requestedFields = requestedFields.trim();
}

const processElement = async (conn, prefix, number, requestID, statusID, familyID) => {
  let result = "(" + prefix + number + " = ";
  const con = conn;
  const query = `SELECT ColumnName AS 'column_name' 
                 FROM [UE database]..RequestDtl 
                 WHERE RequestHdrID = @ID
                 AND CurrentStatus = @CurrentStatus
                 AND FamilyRecno = @FamilyRecno`;
  const response = await con
    .request()
    .input("ID", sql.Int, requestID)
    .input("CurrentStatus", sql.Int, statusID)
    .input("FamilyRecno", sql.Int, familyID)
    .query(query);

  let elements = renameColumnName(response.recordsets[0]);

  elements.forEach((element, index) => {
    result += element.column_name;
    if (index !== elements.length - 1) {
      result += ", ";
    }
  });
  result += ") ";
  return result;
};

const processFamilyIDs = async (conn, familyIDs, prefix, number, requestID, statusID) => {
  let response = "";
  for (const element of familyIDs) {
    response += await processElement(conn, prefix, number, requestID, statusID, element.FamilyID);
    number++;
  }
  return response;
};

async function getDescription(conn, fullName, requestID) {
  let description = "<b>" + fullName + "</b> has sent a request to ";

  let con = conn;
  let query = `SELECT TOP 1 
          H.CreatedBy AS 'created_by',
          H.DestinationTable AS 'destination_table', 
          H.RequestType AS 'request_type', 
          H.FamilyType AS 'family_type', 
                CASE
                  WHEN TRIM(E.Sex) = 'M' THEN 'his'
                  WHEN TRIM(E.Sex) = 'F' THEN 'her'
                  ELSE ''
                END AS 'gender'
          FROM RequestHdr AS H
          INNER JOIN Employee AS E
          ON H.CreatedBy = E.EmployeeCode
          WHERE H.ID = @ID`;
  let response = await con.request()
    .input("ID", sql.Int, requestID)
    .query(query);
  const createdBy = response.recordsets[0][0].created_by.trim();
  const destinationTable = response.recordsets[0][0].destination_table.trim();
  const requestType = response.recordsets[0][0].request_type;
  const familyType = response.recordsets[0][0].family_type;
  const gender = response.recordsets[0][0].gender;

  description += requestType === 0 ? "change" : "create";
  description += " " + gender + " ";
  description += requestType === 0 ? "current" : "new";
  description += " ";
  switch (destinationTable) {
    case "Employee":
      description += "personal information. <br /><br />";
      break;
    case "Family":
      if (familyType === 0) {
        throw 'The value of family_type cannot be zero when the value of destination table is not Family.';
      } else {
        if (familyType === 1) {
          // ------------------------------------------------- EDIT -------------------------------------------------
          description += "mother";
          description += await getFullName(conn, "Mother", createdBy);
          // ------------------------------------------------- EDIT -------------------------------------------------
        } else if (familyType === 2) {
          // ------------------------------------------------- EDIT -------------------------------------------------
          description += "father";
          description += await getFullName(conn, "Father", createdBy);
          // ------------------------------------------------- EDIT -------------------------------------------------
        } else if (familyType === 3) {
          // ------------------------------------------------- EDIT -------------------------------------------------
          if (requestType === 0) {
            if (await isMoreThanOne(conn, requestID) === true) {
              description += "siblings family background. <br /><br />";
            } else {
              description += "sibling";
              let familyID = await getFamilyID(conn, requestID);
              description += await getFullName(conn, "Sibling", createdBy, familyID);
            }
          }
          // ------------------------------------------------- EDIT -------------------------------------------------
          // ------------------------------------------------- CREATE -------------------------------------------------
          else if (requestType === 1) {
            let isCreateTypeRequest = false;
            if (await isMoreThanOne(conn, requestID, isCreateTypeRequest) === true) {
              description += "siblings family background. <br /><br />";
            } else {
              description += "sibling family background. <br /><br />";
            }
          }
          // ------------------------------------------------- CREATE -------------------------------------------------
        }
        else if (familyType === 4) {
          description += "spouse";
          // ------------------------------------------------- EDIT -------------------------------------------------
          if (requestType === 0) {
            description += await getFullName(conn, "Spouse", createdBy);
          }
          // ------------------------------------------------- EDIT -------------------------------------------------
          // ------------------------------------------------- CREATE -------------------------------------------------
          else if (requestType === 1) {
            description += " family background. <br /><br />";
          }
          // ------------------------------------------------- CREATE -------------------------------------------------
        }
        else if (familyType === 5) {
          // ------------------------------------------------- EDIT -------------------------------------------------
          if (requestType === 0) {
            if (await isMoreThanOne(conn, requestID) === true) {
              description += "children family background. <br /><br />";
            } else {
              description += "child";
              let familyID = await getFamilyID(conn, requestID);
              description += await getFullName(conn, "Child", createdBy, familyID);
            }
          }
          // ------------------------------------------------- EDIT -------------------------------------------------
          // ------------------------------------------------- CREATE -------------------------------------------------
          else if (requestType === 1) {
            let isCreateTypeRequest = false;
            if (await isMoreThanOne(conn, requestID, isCreateTypeRequest) === true) {
              description += "children family background. <br /><br />";
            } else {
              description += "child family background. <br /><br />";
            }
          }
          // ------------------------------------------------- CREATE -------------------------------------------------
        } else if (familyType === 6) {
          description += "mother in law";
          // ------------------------------------------------- EDIT -------------------------------------------------
          if (requestType === 0) {
            description += await getFullName(conn, "Mother-In-Law", createdBy);
          }
          // ------------------------------------------------- EDIT -------------------------------------------------
          // ------------------------------------------------- CREATE -------------------------------------------------
          else if (requestType === 1) {
            description += " family background. <br /><br />";
          }
          // ------------------------------------------------- CREATE -------------------------------------------------
        }
        else if (familyType === 7) {
          description += "father in law";
          // ------------------------------------------------- EDIT -------------------------------------------------
          if (requestType === 0) {
            description += await getFullName(conn, "Father-In-Law", createdBy);
          }
          // ------------------------------------------------- EDIT -------------------------------------------------
          // ------------------------------------------------- CREATE -------------------------------------------------
          else if (requestType === 1) {
            description += " family background. <br /><br />";
          }
          // ------------------------------------------------- CREATE -------------------------------------------------
        }
      }
      break;
    case "License":
      description += "license";
      let con = conn;
      let query = `SELECT TOP 1 LicenseNo AS 'license_no'
      FROM [UE Database]..RequestHdr 
      WHERE CreatedBy = @EmployeeID AND ID = @ID`;
      let response = await con.request()
        .input("ID", sql.Int, requestID)
        .input("EmployeeID", sql.VarChar, createdBy)
        .query(query);
      const licenseNo = response.recordset[0].license_no.trim();

      con = conn;
      query = `SELECT TOP 1 License AS 'license'
       FROM [UE Database]..License
       WHERE EmployeeCode = @EmployeeID AND LicenseNo = @LicenseNo`;
      response = await con.request()
        .input("LicenseNo", sql.VarChar, licenseNo)
        .input("EmployeeID", sql.VarChar, createdBy)
        .query(query);
      description += " (<b>" + response.recordset[0].license.trim() + "</b>). <br /><br />";
      break;
    case "Education":
      description += "educational background. <br /><br />";
      break;
    case "EmployeeCompletedTrainingOrSeminar":
      description += "training or seminar. <br /><br />";
      break;
    default:
      throw 'The value of destinationTable (' + destinationTable + ') was not allowed in the source codes.';
  }
  return description;
}

async function getFamilyID(conn, requestID) {
  let con = conn;
  let query = `SELECT TOP 1 FamilyRecno AS 'family_id' FROM RequestDtl WHERE RequestHdrID = @RequestHdrID`;
  let response = await con.request()
    .input("RequestHdrID", sql.Int, requestID)
    .query(query);
  return response.recordset[0].family_id;
}

async function isMoreThanOne(conn, requestID, isEditRequestType = true) {
  let query = `SELECT DISTINCT `;
  query += isEditRequestType === true ? 'FamilyRecno' : 'PersonQueueNumber';
  query += ` FROM RequestDtl WHERE RequestHdrID = @RequestHdrID`;
  let response = await conn.request()
    .input("RequestHdrID", sql.Int, requestID)
    .query(query);
  return response.recordsets[0].length > 1 ? true : false;
}

async function getFullName(conn, famType, createdBy, familyID = 0) {
  let con = conn;
  let query = "SELECT TOP 1 FullName AS 'full_name' FROM [UE Database]..Family ";
  query += "WHERE FamType = '" + famType + "' AND EmployeeCode = @EmployeeID";
  let response;
  if (familyID != 0 && familyID > 0) {
    query += " AND Recno = @Recno";
    response = await con.request()
      .input("EmployeeID", sql.VarChar, createdBy)
      .input("Recno", sql.Int, familyID)
      .query(query);
  } else {
    response = await con.request()
      .input("EmployeeID", sql.VarChar, createdBy)
      .query(query);
  }

  if (response.recordset[0].full_name === undefined || response.recordset[0].full_name === null || response.recordset[0].full_name === "") {
    throw "Invalid value of full_name in getFullName()";
  }

  return " (<b>" + response.recordset[0].full_name.trim() + "</b>) family backgrounds. <br /><br />";
}

async function getPending(conn, employeeID, dateFrom, dateTo) {
    let con = conn;
    let query = `SELECT DISTINCT
                  (
                  CAST((SELECT COUNT(*) FROM [UE database]..RequestDtl 
                  WHERE CurrentStatus = 0 AND ApprovedBy IS NULL 
                  AND DateTimeApproved IS NULL AND CreatedBy != @EmployeeID 
				          AND RequestHdrID = H.ID)
                  AS VARCHAR(MAX))
                  + '/' +
                  CAST((SELECT COUNT(*) FROM [UE database]..RequestDtl WHERE RequestHdrID = H.ID) AS VARCHAR(MAX))
                  ) AS 'stats',
                  H.ID AS 'request_id', 
                  CASE
                  WHEN H.RequestType = 0 THEN 'edit'
                  WHEN H.RequestType = 1 THEN 'create'
                  END AS 'request_type',
                  TRIM(E.LastName + ', ' + E.FirstName + ' ' + LEFT(E.MiddleName, 1) + '. ' + E.ExtName) AS 'created_by',
                  H.DateTimeCreated AS 'date_time_created',
                  H.ShouldHighlightedToHR AS 'should_high_lighted_to_hr',
                  '' AS 'requested_fields',
                  '' AS 'description',
                  '' AS 'details',
                  '' AS 'are_siblings_or_children'
                  FROM [UE database]..RequestHdr AS H
                  INNER JOIN [UE database]..RequestDtl AS D
                  ON D.RequestHdrID = H.ID
                  INNER JOIN [UE database]..Employee AS E
                  ON H.CreatedBy = E.EmployeeCode
                  WHERE D.CurrentStatus = 0
                  AND D.ApprovedBy IS NULL
                  AND D.DateTimeApproved IS NULL
                  AND H.CreatedBy != @EmployeeID
                  AND H.DateTimeCreated BETWEEN @DateFrom AND DATEADD(DAY, 1, @DateTo)
                  ORDER BY H.DateTimeCreated DESC`;
    let response = await con.request()
      .input("EmployeeID", sql.VarChar, employeeID)
      .input("DateFrom", sql.Date, dateFrom)
      .input("DateTo", sql.Date, dateTo)
      .query(query);
    let requestHdr = response.recordsets[0];

    for (let index in requestHdr) {

      query = `SELECT DISTINCT
      ISNULL(TRIM(F.FullName), '') AS 'sibling_or_child_full_name',
      D.FamilyRecno AS 'family_id',
      D.PersonQueueNumber AS 'person_queue_number'
      FROM RequestDtl AS D
      LEFT JOIN Family AS F
      ON D.FamilyRecno = F.Recno
      WHERE D.RequestHdrID = @RequestHdrID`;
      response = await con.request()
        .input("RequestHdrID", sql.Int, requestHdr[index].request_id)
        .query(query);
      let totalLength = response.recordsets[0].length;
      requestHdr[index].are_siblings_or_children = totalLength > 1 ? true : false;

      const result = response.recordsets[0];
      let dtl = [];
      for (let item of result) {
        // ------------------------------------------------- CREATE -------------------------------------------------
        if (requestHdr[index].request_type === 'create' && item.family_id === null) {
          query = `SELECT 
            D.ID AS 'id',
            TRIM(D.ColumnName) AS 'column_name',
            TRIM(D.NewValue) AS 'value',
            D.HRRemarks AS 'hr_remarks',
            TRIM(E.LastName + ', ' + E.FirstName + ' ' + LEFT(E.MiddleName, 1) + '. ' + E.ExtName) AS 'remarks_by',
            D.DateTimeRemarks AS 'date_time_remarks'
            FROM [UE database]..RequestDtl AS D
            LEFT JOIN [UE database]..Employee AS E
            ON D.RemarksBy = E.EmployeeCode
            WHERE D.RequestHdrID = @RequestHdrID
            AND D.CurrentStatus = 0
            AND D.ApprovedBy IS NULL
            AND D.DateTimeApproved IS NULL`;


          if (item.person_queue_number !== null) {
            query += " AND D.PersonQueueNumber = @PersonQueueNumber";
            query += " ORDER BY D.ID ASC";
            response = await con.request()
              .input("RequestHdrID", sql.Int, requestHdr[index].request_id)
              .input("PersonQueueNumber", sql.Int, item.person_queue_number)
              .query(query);
          } else {
            query += " ORDER BY D.ID ASC";
            response = await con.request()
              .input("RequestHdrID", sql.Int, requestHdr[index].request_id)
              .query(query);
          }

          if (response.recordsets[0].length > 0) {
            const obj = {
              table_rows: renameColumnName(response.recordsets[0])
            };
            dtl.push(obj);
            requestHdr[index].details = totalLength > 1 ? dtl : renameColumnName(response.recordsets[0]);
          }
        }
        // ------------------------------------------------- CREATE -------------------------------------------------
        // ------------------------------------------------- EDIT -------------------------------------------------
        else if (requestHdr[index].request_type === 'edit' && item.person_queue_number === null) {
          query = `SELECT 
                 D.ID AS 'id',
                 TRIM(D.ColumnName) AS 'column_name',
                 TRIM(D.OldValue) AS 'from',
                 TRIM(D.NewValue) AS 'to',
                 D.HRRemarks AS 'hr_remarks',
                 TRIM(E.LastName + ', ' + E.FirstName + ' ' + LEFT(E.MiddleName, 1) + '. ' + E.ExtName) AS 'remarks_by',
                 D.DateTimeRemarks AS 'date_time_remarks'
                 FROM [UE database]..RequestDtl AS D
                 LEFT JOIN [UE database]..Employee AS E
                 ON D.RemarksBy = E.EmployeeCode
                 WHERE D.RequestHdrID = @RequestHdrID
                 AND D.CurrentStatus = 0
                 AND D.ApprovedBy IS NULL
                 AND D.DateTimeApproved IS NULL`;

          if (item.family_id !== null) {
            query += " AND D.FamilyRecno = @FamilyRecno";
            query += " ORDER BY D.ID ASC";
            response = await con.request()
              .input("RequestHdrID", sql.Int, requestHdr[index].request_id)
              .input("FamilyRecno", sql.Int, item.family_id)
              .query(query);
          } else {
            query += " ORDER BY D.ID ASC";
            response = await con.request()
              .input("RequestHdrID", sql.Int, requestHdr[index].request_id)
              .query(query);
          }

          if (response.recordsets[0].length > 0) {
            const obj = {
              sibling_or_child_full_name: item.sibling_or_child_full_name,
              table_rows: renameColumnName(response.recordsets[0])
            };
            dtl.push(obj);
            requestHdr[index].details = totalLength > 1 ? dtl : renameColumnName(response.recordsets[0]);
          }
        }
        // ------------------------------------------------- EDIT -------------------------------------------------
        else {
          throw 'Invalid request type in getPending()';
        }

      }

      requestHdr[index].description = await getDescription(conn, requestHdr[index].created_by, requestHdr[index].request_id);
      let statusID = 0;
      requestHdr[index].requested_fields = await getRequestedFields(conn, requestHdr[index].request_id, statusID);
    }

    return requestHdr;
}

async function getMyApproved(conn, employeeID, dateFrom, dateTo) {
    let con = conn;
    let query = `SELECT DISTINCT
                  (
                  CAST((SELECT COUNT(*) FROM [UE database]..RequestDtl 
                  WHERE CurrentStatus = 1 AND ApprovedBy IS NOT NULL 
                  AND DateTimeApproved IS NOT NULL AND H.CreatedBy != @EmployeeID
                  AND RequestHdrID = H.ID)
                  AS VARCHAR(MAX))
                  + '/' +
                  CAST((SELECT COUNT(*) FROM [UE database]..RequestDtl WHERE RequestHdrID = H.ID) AS VARCHAR(MAX))
                  ) AS 'stats',
                  H.ID AS 'request_id', 
                  CASE
                  WHEN H.RequestType = 0 THEN 'edit'
                  WHEN H.RequestType = 1 THEN 'create'
                  END AS 'request_type',
                  TRIM(E.LastName + ', ' + E.FirstName + ' ' + LEFT(E.MiddleName, 1) + '. ' + E.ExtName) AS 'created_by',
                  H.DateTimeCreated AS 'date_time_created',
                  '' AS 'requested_fields',
                  '' AS 'details'
                  FROM [UE database]..RequestHdr AS H
                  INNER JOIN [UE database]..RequestDtl AS D
                  ON D.RequestHdrID = H.ID
                  INNER JOIN [UE database]..Employee AS E
                  ON H.CreatedBy = E.EmployeeCode
                  WHERE D.CurrentStatus = 1
                  AND D.ApprovedBy IS NOT NULL
                  AND D.DateTimeApproved IS NOT NULL
                  AND D.ApprovedBy = @EmployeeID
                  AND H.DateTimeCreated BETWEEN @DateFrom AND DATEADD(DAY, 1, @DateTo)
                  ORDER BY H.DateTimeCreated DESC`;
    let response = await con.request()
      .input("EmployeeID", sql.VarChar, employeeID)
      .input("DateFrom", sql.Date, dateFrom)
      .input("DateTo", sql.Date, dateTo)
      .query(query);
    let requestHdr = response.recordsets[0];


    for (let index in requestHdr) {

      query = `SELECT DISTINCT
      ISNULL(TRIM(F.FullName), '') AS 'sibling_or_child_full_name',
      D.FamilyRecno AS 'family_id',
      D.PersonQueueNumber AS 'person_queue_number'
      FROM RequestDtl AS D
      LEFT JOIN Family AS F
      ON D.FamilyRecno = F.Recno
      WHERE D.RequestHdrID = @RequestHdrID`;
      response = await con.request()
        .input("RequestHdrID", sql.Int, requestHdr[index].request_id)
        .query(query);
      let totalLength = response.recordsets[0].length;
      requestHdr[index].are_siblings_or_children = totalLength > 1 ? true : false;

      const result = response.recordsets[0];
      let dtl = [];
      for (let item of result) {
        // ------------------------------------------------- CREATE -------------------------------------------------
        if (requestHdr[index].request_type === 'create' && item.family_id === null) {
          query = `SELECT 
            ID AS 'id',
		      	DateTimeApproved AS 'date_time_approved',
            TRIM(ColumnName) AS 'column_name',
            TRIM(NewValue) AS 'value'
            FROM RequestDtl
            WHERE RequestHdrID = @RequestHdrID
            AND CurrentStatus = 1
            AND ApprovedBy IS NOT NULL
            AND DateTimeApproved IS NOT NULL`;

          if (item.person_queue_number !== null) {
            query += " AND PersonQueueNumber = @PersonQueueNumber";
            query += " ORDER BY DateTimeApproved ASC";
            response = await con.request()
              .input("RequestHdrID", sql.Int, requestHdr[index].request_id)
              .input("PersonQueueNumber", sql.Int, item.person_queue_number)
              .query(query);
          } else {
            query += " ORDER BY DateTimeApproved ASC";
            response = await con.request()
              .input("RequestHdrID", sql.Int, requestHdr[index].request_id)
              .query(query);
          }

          if (response.recordsets[0].length > 0) {
            const obj = {
              table_rows: renameColumnName(response.recordsets[0])
            };
            dtl.push(obj);
            requestHdr[index].details = totalLength > 1 ? dtl : renameColumnName(response.recordsets[0]);
          }
        }
        // ------------------------------------------------- CREATE -------------------------------------------------
        // ------------------------------------------------- EDIT -------------------------------------------------
        else if (requestHdr[index].request_type === 'edit' && item.person_queue_number === null) {
          query = `SELECT 
                  ID AS 'id',
                  DateTimeApproved AS 'date_time_approved',
                  TRIM(ColumnName) AS 'column_name',
                  TRIM(OldValue) AS 'from',
                  TRIM(NewValue) AS 'to'
                  FROM RequestDtl
                  WHERE RequestHdrID = @RequestHdrID
                  AND CurrentStatus = 1
                  AND ApprovedBy IS NOT NULL
                  AND DateTimeApproved IS NOT NULL`;

          if (item.family_id !== null) {
            query += " AND FamilyRecno = @FamilyRecno";
            query += " ORDER BY DateTimeApproved ASC";
            response = await con.request()
              .input("RequestHdrID", sql.Int, requestHdr[index].request_id)
              .input("FamilyRecno", sql.Int, item.family_id)
              .query(query);
          } else {
            query += " ORDER BY DateTimeApproved ASC";
            response = await con.request()
              .input("RequestHdrID", sql.Int, requestHdr[index].request_id)
              .query(query);
          }

          if (response.recordsets[0].length > 0) {
            const obj = {
              sibling_or_child_full_name: item.sibling_or_child_full_name,
              table_rows: renameColumnName(response.recordsets[0])
            };
            dtl.push(obj);
            requestHdr[index].details = totalLength > 1 ? dtl : renameColumnName(response.recordsets[0]);
          }
        }
        // ------------------------------------------------- EDIT -------------------------------------------------
        else {
          throw 'Invalid request type in getMyApproved()';
        }

      }

      requestHdr[index].description = await getDescription(conn, requestHdr[index].created_by, requestHdr[index].request_id);
      let statusID = 1;
      requestHdr[index].requested_fields = await getRequestedFields(conn, requestHdr[index].request_id, statusID);
    }

    return requestHdr;
  }


import { fileURLToPath } from 'url';
import { dirname } from 'path';

async function approveRequest(conn, employeeID, data) {
  let transaction;
  try {
    transaction = new sql.Transaction(conn);
    await transaction.begin();

    const familyDetails = [];
    let educationalBackgroundsRequestHdrID = 0;
    let trainingOrSeminarRequestHdrID = 0;
    for (let id of data) {
      let request = new sql.Request(transaction);
      let query = `SELECT TOP 1
      H.DateTimeCreated AS 'date_time_created',
      TRIM(H.CreatedBy) AS 'created_by', 
      TRIM(H.DestinationTable) AS 'destination_table',
       CASE
      WHEN H.RequestType = 0 THEN 'Edit'
      WHEN H.RequestType = 1 THEN 'Create'
      END AS 'request_type',
       CASE
      WHEN H.FamilyType = 0 THEN 'None'
      WHEN H.FamilyType = 1 THEN 'Mother'
      WHEN H.FamilyType = 2 THEN 'Father'
      WHEN H.FamilyType = 3 THEN 'Sibling'
      WHEN H.FamilyType = 4 THEN 'Spouse'
      WHEN H.FamilyType = 5 THEN 'Child'
      WHEN H.FamilyType = 6 THEN 'Mother-In-Law'
      WHEN H.FamilyType = 7 THEN 'Father-In-Law'
      END AS 'family_type',
      ISNULL(TRIM(H.LicenseNo), '') AS 'license_no',
      TRIM(D.ColumnName) AS 'column_name',
      TRIM(D.NewValue) AS 'new_value',
      ISNULL(D.FamilyRecno, 0) AS 'family_id'
      FROM [UE database]..RequestDtl AS D
      INNER JOIN RequestHdr AS H
      ON D.RequestHdrID = H.ID
      WHERE D.ID = @ID`;
      request.input("ID", sql.Int, id);
      let response = await request.query(query);
      let dateTimeCreated = response.recordset[0].date_time_created;
      let createdBy = response.recordset[0].created_by;
      let destinationTable = response.recordset[0].destination_table;
      let requestType = response.recordset[0].request_type;
      let familyType = response.recordset[0].family_type;
      let licenseNo = response.recordset[0].license_no;
      let columnName = response.recordset[0].column_name;
      let newValue = response.recordset[0].new_value;
      let familyID = response.recordset[0].family_id;

      request = new sql.Request(transaction);
      query = `UPDATE [UE database]..RequestDtl 
      SET CurrentStatus = 1, ApprovedBy = @ApprovedBy, DateTimeApproved = GETDATE()
      WHERE ID = @ID`;
      request.input("ApprovedBy", sql.VarChar, employeeID);
      request.input("ID", sql.Int, id);
      response = await request.query(query);
      if (response.rowsAffected[0] === 0) {
        throw "No rows affected"
      }

      request = new sql.Request(transaction);
      query = `SELECT TOP 1 RequestHdrID
                 FROM [UE database]..RequestDtl 
                 WHERE ID = @ID`;
      request.input("ID", sql.Int, id);
      response = await request.query(query);
      let requestHdrID = response.recordsets[0][0].RequestHdrID;

      // ------------------------------------------------- EDIT -------------------------------------------------
      if (requestType === "Edit") {

        // ------------------------------------------------- PERSONAL INFORMATIONS -------------------------------------------------
        if (familyType === "None" && licenseNo === "") {

          if (columnName === "CivilStatus") {
            let request = new sql.Request(transaction);
            let query = `SELECT TOP 1
            ID AS 'civil_status_id'
            FROM [UE database]..CivilStatus 
            WHERE DESCRIPTION = @DESCRIPTION`;
            request.input("DESCRIPTION", sql.VarChar, newValue.trim());
            let response = await request.query(query);
            newValue = response.recordset[0].civil_status_id;
          }
          else if (columnName === "ReligionCode") {
            let request = new sql.Request(transaction);
            let query = `SELECT TOP 1
            ReligionCode AS 'religion_code'
            FROM [UE database]..Religion 
            WHERE DESCRIPTION = @DESCRIPTION`;
            request.input("DESCRIPTION", sql.VarChar, newValue.trim());
            let response = await request.query(query);
            newValue = response.recordset[0].religion_code;
          }


          let request = new sql.Request(transaction);
          let query = "UPDATE [UE database].." + destinationTable + " SET " + columnName + " = @NewValue WHERE EmployeeCode = @EmployeeCode";
          request.input("NewValue", sql.VarChar, newValue.toString());
          request.input("EmployeeCode", sql.VarChar, createdBy);
          let response = await request.query(query);
          if (response.rowsAffected[0] === 0) {
            throw "No rows affected"
          }
        }
        // ------------------------------------------------- PERSONAL INFORMATIONS -------------------------------------------------

        // ------------------------------------------------- FAMILY BACKGROUNDS -------------------------------------------------
        if (familyType !== "None" && licenseNo === "") {

          if (columnName === "MARRIAGE CERTIFICATE") {
            await manipulateFolder(transaction, requestHdrID, "MARRIAGE CERTIFICATE", "approved", createdBy);
          }
          else if (columnName === "BIRTH CERTIFICATE") {
            await manipulateFolder(transaction, requestHdrID, "BIRTH CERTIFICATE", "approved", createdBy, id);
          }
          else {
            let request = new sql.Request(transaction);
            let query = `UPDATE [UE database]..${destinationTable} SET ${columnName} = @NewValue, UpdatedBy = @UpdatedBy, DateTimeUpdated = @DateTimeUpdated
           WHERE EmployeeCode = @EmployeeCode AND FamType = '${familyType}'`;

            if (familyType === "Sibling" || familyType === "Child") {
              query += ` AND Recno = ${familyID}`;
            }

            request.input("NewValue", sql.VarChar, newValue);
            request.input("EmployeeCode", sql.VarChar, createdBy);
            request.input("UpdatedBy", sql.VarChar, createdBy);
            request.input("DateTimeUpdated", sql.DateTime, dateTimeCreated);
            let response = await request.query(query);
            if (response.rowsAffected[0] === 0) {
              throw "No rows affected"
            }

            if (familyType === "Child" && columnName === "FullName") {

              request = new sql.Request(transaction);
              query = `SELECT TOP 1 OldValue
              FROM [UE database]..RequestDtl 
              WHERE ID = @ID`;
              request.input("ID", sql.Int, id);
              response = await request.query(query);
              let oldValue = response.recordset[0].OldValue;

              if (oldValue !== null) {
                oldValue = oldValue.trim();
              }

              const __filename = fileURLToPath(import.meta.url);
              const __dirname = dirname(__filename);
              let directoryPath = __dirname.slice(0, -6);
              directoryPath = directoryPath.replaceAll("\\", "/");

              let basePath = directoryPath + "uploaded/current_files/" + createdBy;
              basePath += "/family_backgrounds/children/birth_certificate/" + oldValue + ".";
              let firstPath = basePath + "pdf";
              let secondPath = basePath + "jpg";
              let thirdPath = basePath + "jpeg";
              let fourthPath = basePath + "png";

              let foundPath = "";

              if (await helperMethods.isExist(firstPath) === true) { foundPath = firstPath; }
              else if (await helperMethods.isExist(secondPath) === true) { foundPath = secondPath; }
              else if (await helperMethods.isExist(thirdPath) === true) { foundPath = thirdPath; }
              else if (await helperMethods.isExist(fourthPath) === true) { foundPath = fourthPath; }
              else { throw `The file: ${oldValue} was not found.`; }

              if (foundPath !== "") {
                const extension = foundPath.split('.').pop();
                await helperMethods.renameFile(foundPath, newValue + "." + extension);
              }
            }
          }

        }
        // ------------------------------------------------- FAMILY BACKGROUNDS -------------------------------------------------

        // ------------------------------------------------- LICENSE -------------------------------------------------
        if (familyType === "None" && licenseNo !== "") {
          if (columnName === "ExpirationDate") {
            request = new sql.Request(transaction);
            query = `UPDATE [UE database]..${destinationTable} SET ${columnName} = @NewValue, UpdatedBy = @UpdatedBy, DateTimeUpdated = @DateTimeUpdated
            WHERE EmployeeCode = @EmployeeCode AND LicenseNo = '${licenseNo}'`;

            request.input("NewValue", sql.VarChar, newValue);
            request.input("EmployeeCode", sql.VarChar, createdBy);
            request.input("UpdatedBy", sql.VarChar, createdBy);
            request.input("DateTimeUpdated", sql.DateTime, dateTimeCreated);
            response = await request.query(query);
            if (response.rowsAffected[0] === 0) {
              throw "No rows affected"
            }
          } else if (columnName === "PRC ID") {
            await manipulateFolder(transaction, requestHdrID, "PRC ID", "approved", createdBy);
          }
        }
        // ------------------------------------------------- LICENSE -------------------------------------------------

      }
      // ------------------------------------------------- EDIT -------------------------------------------------
      // ------------------------------------------------- CREATE -------------------------------------------------
      else if (requestType === "Create") {

        // ------------------------------------------------- FAMILY BACKGROUNDS -------------------------------------------------
        if (familyType !== "None" && licenseNo === "") {

          request = new sql.Request(transaction);
          query = `SELECT DISTINCT RequestHdrID, PersonQueueNumber
                       FROM [UE database]..RequestDtl 
                       WHERE RequestHdrID = @RequestHdrID`;
          request.input("RequestHdrID", sql.Int, requestHdrID);
          response = await request.query(query);

          if (familyType === "Child" || familyType === "Sibling") {
            let result = response.recordsets[0];
            for (let i = 0; i < result.length; i++) {
              let personQueueNumber = result[i].PersonQueueNumber;
              request = new sql.Request(transaction);
              query = `SELECT TOP 1 PersonQueueNumber
                           FROM [UE database]..RequestDtl 
                           WHERE ID = @ID`;
              request.input("ID", sql.Int, id);
              response = await request.query(query);

              if (personQueueNumber === response.recordset[0].PersonQueueNumber) {
                let isExist = familyDetails.some(x => x.PersonQueueNumber === personQueueNumber);
                if (isExist === false) {
                  familyDetails.push(result[i]);
                }
              }

            }
          } else {
            if (familyDetails.length === 0) {
              familyDetails.push(response.recordsets[0]);
            }
          }

          if (columnName === "BIRTH CERTIFICATE") {
            await manipulateFolder(transaction, requestHdrID, columnName, "approved", createdBy, id);
          }

        }
        // ------------------------------------------------- FAMILY BACKGROUNDS -------------------------------------------------

        // ------------------------------------------------- EDUCATIONAL BACKGROUNDS -------------------------------------------------
        if (familyType === "None" && licenseNo === '' && destinationTable === "Education") {
          if (educationalBackgroundsRequestHdrID === 0) {
            educationalBackgroundsRequestHdrID = requestHdrID;
          }

          if (columnName === "DIPLOMA") {
            await manipulateFolder(transaction, requestHdrID, columnName, "approved", createdBy);
          }

        }
        // ------------------------------------------------- EDUCATIONAL BACKGROUNDS -------------------------------------------------


        // ------------------------------------------------- TRAINING OR SEMINAR -------------------------------------------------
        if (columnName === "TRAINING OR SEMINAR CERTIFICATE") {
          if (trainingOrSeminarRequestHdrID === 0) {
            trainingOrSeminarRequestHdrID = requestHdrID;
          }
          await manipulateFolder(transaction, requestHdrID, columnName, "approved", createdBy);
        }
        // ------------------------------------------------- TRAINING OR SEMINAR -------------------------------------------------

      } else {
        throw "The value of requestType is not valid.";
      }
    }


    // ------------------------------------------------- FAMILY BACKGROUNDS -------------------------------------------------
    if (familyDetails.length > 0) {

      for (let obj of familyDetails) {
        let request = new sql.Request(transaction);
        let query = `SELECT 
       (SELECT CreatedBy FROM RequestHdr WHERE ID = @RequestHdrID) AS 'EmployeeCode',
       (SELECT NewValue FROM RequestDtl WHERE ColumnName = 'FullName' AND RequestHdrID = @RequestHdrID AND PersonQueueNumber = @PersonQueueNumber) AS 'FullName',
       (SELECT NewValue FROM RequestDtl WHERE ColumnName = 'Birthdate' AND RequestHdrID = @RequestHdrID AND PersonQueueNumber = @PersonQueueNumber) AS 'Birthdate',
       (SELECT NewValue FROM RequestDtl WHERE ColumnName = 'Occupation' AND RequestHdrID = @RequestHdrID AND PersonQueueNumber = @PersonQueueNumber) AS 'Occupation',
       (SELECT NewValue FROM RequestDtl WHERE ColumnName = 'MarriageDate' AND RequestHdrID = @RequestHdrID AND PersonQueueNumber = @PersonQueueNumber) AS 'MarriageDate',
       (SELECT 
       CASE
       WHEN FamilyType = 1 THEN 'Mother'
       WHEN FamilyType = 2 THEN 'Father'
         WHEN FamilyType = 3 THEN 'Sibling'
       WHEN FamilyType = 4 THEN 'Spouse'
       WHEN FamilyType = 5 THEN 'Child'
           WHEN FamilyType = 6 THEN 'Mother-In-Law'
       WHEN FamilyType = 7 THEN 'Father-In-Law'
       END AS 'FamType'
     FROM RequestHdr WHERE ID = @RequestHdrID) AS 'FamType',
     (SELECT NewValue FROM RequestDtl WHERE ColumnName = 'CompanySchool' AND RequestHdrID = @RequestHdrID AND PersonQueueNumber = @PersonQueueNumber) AS 'CompanySchool'`;
        request.input("RequestHdrID", sql.Int, (obj.RequestHdrID === undefined ? obj[0].RequestHdrID : obj.RequestHdrID));
        request.input("PersonQueueNumber", sql.SmallInt, (obj.PersonQueueNumber === undefined ? obj[0].PersonQueueNumber : obj.PersonQueueNumber));
        let response = await request.query(query);
        let result = response.recordsets[0][0];

        let hasAttachment = 0;
        if (result.FamType.trim() === 'Child' || result.FamType.trim() === 'Spouse') {
          hasAttachment = 1;
        }

        request = new sql.Request(transaction);
        query = `INSERT INTO [UE database]..Family
          (EmployeeCode, FullName, Birthdate, Occupation, MarriageDate, FamType, CompanySchool, HasAttachment)
          VALUES 
          (@EmployeeCode, @FullName, @Birthdate, @Occupation, @MarriageDate, @FamType, @CompanySchool, @HasAttachment)`;
        request.input("EmployeeCode", sql.VarChar, result.EmployeeCode.trim());
        request.input("FullName", sql.VarChar, result.FullName.trim());
        request.input("Birthdate", sql.Date, result.Birthdate);
        request.input("Occupation", sql.VarChar, result.Occupation.trim());
        request.input("MarriageDate", sql.Date, result.MarriageDate);
        request.input("FamType", sql.VarChar, result.FamType.trim());
        request.input("CompanySchool", sql.VarChar, result.CompanySchool.trim());
        request.input("HasAttachment", sql.Bit, hasAttachment);
        response = await request.query(query);
        if (response.rowsAffected[0] === 0) {
          throw "No rows affected"
        }

        // ------------------------------------------------- SPOUSE -------------------------------------------------
        if (result.FamType === "Spouse") {
          await manipulateFolder(transaction, obj[0].RequestHdrID, "MARRIAGE CERTIFICATE", "approved", result.EmployeeCode);
        }
        // ------------------------------------------------- SPOUSE -------------------------------------------------
      }

    }
    // ------------------------------------------------- FAMILY BACKGROUNDS -------------------------------------------------

    // ------------------------------------------------- EDUCATIONAL BACKGROUNDS -------------------------------------------------
    if (educationalBackgroundsRequestHdrID !== 0) {
      let request = new sql.Request(transaction);
      let query = `SELECT 
  (SELECT CreatedBy FROM RequestHdr WHERE ID = @RequestHdrID) AS 'employee_code',
  (SELECT NewValue FROM RequestDtl WHERE ColumnName = 'From' AND RequestHdrID = @RequestHdrID) AS 'from',
  (SELECT NewValue FROM RequestDtl WHERE ColumnName = 'To' AND RequestHdrID = @RequestHdrID) AS 'to',
  (SELECT NewValue FROM RequestDtl WHERE ColumnName = 'DiplomaDegreeHonor' AND RequestHdrID = @RequestHdrID) AS 'diploma',
  (SELECT NewValue FROM RequestDtl WHERE ColumnName = 'Institution' AND RequestHdrID = @RequestHdrID) AS 'institution_name',
  (SELECT NewValue FROM RequestDtl WHERE ColumnName = 'InstitutionAddress' AND RequestHdrID = @RequestHdrID) AS 'institution_address'`;
      request.input("RequestHdrID", sql.Int, educationalBackgroundsRequestHdrID);
      let response = await request.query(query);
      let result = response.recordsets[0][0];

      request = new sql.Request(transaction);
      query = `INSERT INTO [UE database]..Education 
           (EmployeeCode, [From], [To], DiplomaDegreeHonor, Institution, InstitutionAddress, IsDiplomaSubmitted, IsTranscriptSubmitted, IsFinish, HasAttachment)
           VALUES 
           (@EmployeeCode, @From, @To, @DiplomaDegreeHonor, @Institution, @InstitutionAddress, 1, 1, 1, 1)`;
      request.input("EmployeeCode", sql.VarChar, result.employee_code);
      request.input("From", sql.VarChar, result.from);
      request.input("To", sql.VarChar, result.to);
      request.input("DiplomaDegreeHonor", sql.VarChar, result.diploma);
      request.input("Institution", sql.VarChar, result.institution_name);
      request.input("InstitutionAddress", sql.VarChar, result.institution_address);
      response = await request.query(query);
      if (response.rowsAffected[0] === 0) {
        throw "No rows affected"
      }
    }
    // ------------------------------------------------- EDUCATIONAL BACKGROUNDS -------------------------------------------------


    // ------------------------------------------------- TRAINING OR SEMINAR -------------------------------------------------
    if (trainingOrSeminarRequestHdrID !== 0) {
      let request = new sql.Request(transaction);
      let query = `SELECT 
      (SELECT CreatedBy FROM RequestHdr WHERE ID = @RequestHdrID) AS 'employee_code',
      (SELECT NewValue FROM RequestDtl WHERE ColumnName = 'TrainingOrSeminarName' AND RequestHdrID = @RequestHdrID) AS 'training_or_seminar_name',
      (SELECT NewValue FROM RequestDtl WHERE ColumnName = 'IssuedBy' AND RequestHdrID = @RequestHdrID) AS 'issued_by',
      (SELECT NewValue FROM RequestDtl WHERE ColumnName = 'FromDate' AND RequestHdrID = @RequestHdrID) AS 'from_date',
      (SELECT NewValue FROM RequestDtl WHERE ColumnName = 'ToDate' AND RequestHdrID = @RequestHdrID) AS 'to_date',
      (SELECT NewValue FROM RequestDtl WHERE ColumnName = 'Place' AND RequestHdrID = @RequestHdrID) AS 'place'`;
      request.input("RequestHdrID", sql.Int, trainingOrSeminarRequestHdrID);
      let response = await request.query(query);
      let result = response.recordsets[0][0];

      request = new sql.Request(transaction);
      query = `INSERT INTO HR..EmployeeCompletedTrainingOrSeminar 
           (EmployeeCode, TrainingOrSeminarName, IssuedBy, FromDate, ToDate, Place, CreatedBy)
           VALUES 
           (@EmployeeCode, @TrainingOrSeminarName, @IssuedBy, @FromDate, @ToDate, @Place, @CreatedBy)`;
      request.input("EmployeeCode", sql.VarChar, result.employee_code);
      request.input("TrainingOrSeminarName", sql.VarChar, result.training_or_seminar_name);
      request.input("IssuedBy", sql.VarChar, result.issued_by);
      request.input("FromDate", sql.VarChar, result.from_date);
      request.input("ToDate", sql.VarChar, result.to_date);
      request.input("Place", sql.VarChar, result.place);
      request.input("CreatedBy", sql.VarChar, result.employee_code);
      response = await request.query(query);
      if (response.rowsAffected[0] === 0) {
        throw "No rows affected"
      }
    }
    // ------------------------------------------------- TRAINING OR SEMINAR -------------------------------------------------


    await transaction.commit();

  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

async function setHRRemarks(conn, employeeID, data) {
  let transaction;
  try {
    transaction = new sql.Transaction(conn);
    await transaction.begin();

    let requestHDRID = 0;

    for (let id of data.ids) {
      if (requestHDRID === 0) {
        let request = new sql.Request(transaction);
        let query = `SELECT TOP 1 
        RequestHdrID
        FROM RequestDtl
        WHERE ID = @ID`;
        request.input("ID", sql.Int, id);
        let response = await request.query(query);
        requestHDRID = response.recordset[0].RequestHdrID;

        request = new sql.Request(transaction);
        query = `UPDATE [UE database]..RequestHdr 
          SET ShouldHighlightedToRequester = 1
          WHERE ID = @ID`;
        request.input("ID", sql.Int, requestHDRID);
        response = await request.query(query);
        if (response.rowsAffected[0] === 0) {
          throw "No rows affected"
        }
      }

      let request = new sql.Request(transaction);
      let query = `UPDATE [UE database]..RequestDtl 
      SET RemarksBy = @RemarksBy, DateTimeRemarks = GETDATE(), HRRemarks = @HRRemarks, IsComplied = 0
      WHERE ID = @ID`;
      request.input("RemarksBy", sql.VarChar, employeeID);
      request.input("HRRemarks", sql.VarChar, data.hr_remarks.trim());
      request.input("ID", sql.Int, id);
      let response = await request.query(query);
      if (response.rowsAffected[0] === 0) {
        throw "No rows affected"
      }
    }

    await transaction.commit();

  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

async function manipulateFolder(transaction, requestID, type, statusFolder, employeeID = 0, requestDtlID = 0) {
  let request = new sql.Request(transaction);
  let query = `SELECT TOP 1 
  D.OldValue AS 'old_value',
  D.NewValue AS 'new_value',
   CASE
      WHEN H.RequestType = '0' THEN 'to'
      WHEN H.RequestType = '1' THEN 'value'
   END AS 'folder'
  FROM RequestDtl AS D
  INNER JOIN RequestHdr AS H
  ON D.RequestHdrID = H.ID
  WHERE D.RequestHdrID = @RequestHdrID AND D.ColumnName = @Type`;

  if (requestDtlID !== 0) {
    query += " AND D.ID = @ID";
    request.input("ID", sql.Int, requestDtlID);
  }

  request.input("RequestHdrID", sql.Int, requestID);
  request.input("Type", sql.VarChar, type);

  let response = await request.query(query);
  let newValueFileName = response.recordset[0].new_value.trim();
  let oldValueFileName = response.recordset[0].old_value;
  let folder = response.recordset[0].folder;

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  let directoryPath = __dirname.slice(0, -6);
  directoryPath = directoryPath.replaceAll("\\", "/");
  let sourcePath = directoryPath + "uploaded/requests/pending/" + requestID;

  let isFound = false;

  if (await helperMethods.isExist(sourcePath + "/" + folder + "/" + newValueFileName) === true) {
    isFound = true;
  }
  else if (await helperMethods.isExist(sourcePath + "/" + (folder === "to" ? "value" : "to") + "/" + newValueFileName) === true) {
    isFound = true;
    folder = folder === "to" ? "value" : "to";
  }
  else {
    throw `File : ${newValueFileName} was not found, inside of ${requestID} folder.`;
  }

  if (isFound === true) {

    let destinationPath = directoryPath + "uploaded/requests/" + statusFolder + "/" + requestID;

    if (type === "BIRTH CERTIFICATE") {
      await helperMethods.createFolder(destinationPath + "/" + folder);
      await helperMethods.copyFile(sourcePath + "/" + folder + "/" + newValueFileName, destinationPath + "/" + folder);
    } else {
      await helperMethods.createFolder(destinationPath);
      await helperMethods.copyFiles(sourcePath, destinationPath);
    }

    // --------------------------- PENDING -> APPROVED FOLDER ---------------------------
    if (statusFolder === "approved" && employeeID > 0) {
      let path = directoryPath + "uploaded/current_files/" + employeeID;

      if (type === "MARRIAGE CERTIFICATE") {
        path += "/family_backgrounds/spouse";
      }
      else if (type === "BIRTH CERTIFICATE") {
        path += "/family_backgrounds/children/birth_certificate";
      }
      else if (type === "PRC ID") {
        path += "/licenses/";
      }
      else if (type === "DIPLOMA") {
        path += "/educational_backgrounds/";
        request = new sql.Request(transaction);
        query = `SELECT TOP 1 
         ISNULL(TRIM(D.NewValue), '') AS 'diploma_name'
         FROM RequestDtl AS D
         INNER JOIN RequestHdr AS H
         ON D.RequestHdrID = H.ID
         WHERE D.RequestHdrID = @RequestHdrID AND D.ColumnName = 'DiplomaDegreeHonor'`;
        request.input("RequestHdrID", sql.Int, requestID);
        let response = await request.query(query);
        path += response.recordset[0].diploma_name + "/";
      }
      else if (type === "TRAINING OR SEMINAR CERTIFICATE") {
        path += "/trainings_or_seminars";
      }
      else {
        throw "Invalid value of type.";
      }

      if (await helperMethods.isExist(path + oldValueFileName) === true) {
        await helperMethods.deleteFile(path + oldValueFileName);
      }

      if (type === "BIRTH CERTIFICATE") {
        await helperMethods.createFolder(path);
        await helperMethods.copyFile(sourcePath + "/" + folder + "/" + newValueFileName, path);
      } else {
        await helperMethods.createFolder(path);
        await helperMethods.copyFiles(sourcePath + "/" + folder, path);
      }
    }
    // --------------------------- PENDING -> APPROVED FOLDER ---------------------------

    if (type === "BIRTH CERTIFICATE") {
      await helperMethods.deleteFile(sourcePath + "/" + folder + "/" + newValueFileName);
      if (await helperMethods.isFolderEmpty(sourcePath + "/" + folder + "/") === true) { await helperMethods.deleteFolder(sourcePath); }
    } else {
      await helperMethods.deleteFiles(sourcePath);
      if (await helperMethods.isFolderEmpty(sourcePath) === true) { await helperMethods.deleteFolder(sourcePath); }
    }
  }
}

async function requestNotHighLightedToHR(conn, requestID) {
  let transaction;
  try {
    transaction = new sql.Transaction(conn);
    await transaction.begin();
    let request = new sql.Request(transaction);
    let query = `UPDATE [UE DATABASE]..RequestHdr SET ShouldHighlightedToHR = 0 WHERE ID = @ID`;
    request.input("ID", sql.Int, requestID);
    let response = await request.query(query);
    if (response.rowsAffected[0] === 0) {
      throw "No rows affected"
    }
    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

async function getMinimumDateWithPendingRequest(conn) {
  let con = conn;
  let query = `SELECT TOP 1 
    CAST(H.DateTimeCreated AS DATE) AS 'DateTimeCreated'
    FROM [UE database]..RequestHdr AS H
    INNER JOIN [UE database]..RequestDtl AS D
    ON H.ID = D.RequestHdrID
    WHERE D.ApprovedBy IS NULL AND D.DateTimeApproved IS NULL
    ORDER BY H.DateTimeCreated ASC`;
  let response = await con.request()
    .query(query);
  return (response.recordsets[0][0] !== undefined) ? response.recordsets[0][0].DateTimeCreated : '1900-01-01';
}


export default {
  get,
  getPending,
  getMyApproved,
  approveRequest,
  setHRRemarks,
  renameColumnName,
  getDescription,
  getRequestedFields,
  requestNotHighLightedToHR,
  getMinimumDateWithPendingRequest
}