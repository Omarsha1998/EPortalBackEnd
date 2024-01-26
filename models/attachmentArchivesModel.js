import { database } from "../configuration/database.js";
import sql from 'mssql';
import helperMethods from "../utility/helperMethods.js";

async function getAllDepartments(conn) {
  let con = conn;
  let query = `SELECT 
  DeptCode AS 'department_id', 
  [Description] AS 'department_name'
  FROM [UE database]..Department 
  WHERE College = '' AND DeptCode != 'N/A'
  ORDER BY [Description] ASC`;
  let response = await con.request()
    .query(query);
  return response.recordsets[0];
}

async function searchEmployee(conn, departmentID, employeeIDOrEmployeeName) {
  let con = conn;
  let query = `SELECT 
  E.EmployeeCode AS 'employee_id',
  E.LastName AS 'last_name',
  E.FirstName AS 'first_name',
  E.MiddleName AS 'middle_name',
  D.[Description] AS 'department'
  FROM [UE database]..Employee AS E
  INNER JOIN [UE database]..Department AS D
  ON E.DeptCode = D.DeptCode 
  WHERE E.EmployeeCode = @EmployeeID
  OR (E.LastName LIKE @EmployeeName OR E.FirstName LIKE @EmployeeName OR E.MiddleName LIKE @EmployeeName) `

  if (departmentID !== '0') {
    query += `AND D.DeptCode = @DepartmentID `;
  }

  query += `ORDER BY E.LastName ASC`;

  let response;

  if (departmentID !== '0') {
    response = await con.request()
      .input("EmployeeID", sql.VarChar, employeeIDOrEmployeeName)
      .input("EmployeeName", sql.VarChar, '%' + employeeIDOrEmployeeName + '%')
      .input("DepartmentID", sql.VarChar, departmentID)
      .query(query);
  } else {
    response = await con.request()
      .input("EmployeeID", sql.VarChar, employeeIDOrEmployeeName)
      .input("EmployeeName", sql.VarChar, '%' + employeeIDOrEmployeeName + '%')
      .query(query);
  }

  return response.recordsets[0];
}

async function getTotalPRCIDs(conn, employeeID) {
  // PRC ID (LICENSE)
  let query = `SELECT  
   COUNT(EmployeeCode) AS 'total'
   FROM [UE database]..License 
   WHERE EmployeeCode = @EmployeeID AND ExpirationDate IS NOT NULL`;
  let totalPRCIDs = await getResponse(conn, query, employeeID);
  return totalPRCIDs;
}

async function getTotalBirthCertificates(conn, employeeID) {
  // BIRTH CERTIFICATE (FOR CHILDREN)
  let query = `SELECT COUNT(Recno) AS 'total' 
  FROM [UE database]..Family
  WHERE EmployeeCode = @EmployeeID  AND FamType = 'Child' AND HasAttachment = 1`;
  let totalBirthCertificates = await getResponse(conn, query, employeeID);
  return totalBirthCertificates;
}

async function getTotalMarriageCertificates(conn, employeeID) {
  // MARRIAGE CERTIFICATE (FOR SPOUSE)
  let query = `SELECT 
  COUNT(Recno) AS 'total'
  FROM [UE database]..Family
  WHERE EmployeeCode = @EmployeeID  AND FamType = 'Spouse' AND HasAttachment = 1`;
  let totalMarriageCertificate = await getResponse(conn, query, employeeID);
  return totalMarriageCertificate;
}

async function getTotalTORs(conn, employeeID) {
  // TOR (EDUCATIONAL BACKGROUND)
  let query = `SELECT 
  COUNT(EmployeeCode) AS 'total'
  FROM [UE database]..Education
  WHERE EmployeeCode = @EmployeeID AND IsTranscriptSubmitted = 1 AND IsFinish = 1 AND HasAttachment = 1`;
  let totalTORs = await getResponse(conn, query, employeeID);
  return totalTORs;
}

async function getTotalDiplomas(conn, employeeID) {
  // DIPLOMA (EDUCATIONAL BACKGROUND) 
  let query = `SELECT 
  COUNT(EmployeeCode) AS 'total'
  FROM [UE database]..Education
  WHERE EmployeeCode = @EmployeeID AND IsDiplomaSubmitted = 1 AND IsFinish = 1 AND HasAttachment = 1`;
  let totalDiplomas = await getResponse(conn, query, employeeID);
  return totalDiplomas;
}

async function getTotalTrainingsOrSeminars(conn, employeeID) {
  // TRAINING/SEMINAR CERTIFICATE
  let query = `SELECT 
  COUNT(EmployeeCode) AS 'total'
  FROM HR..EmployeeCompletedTrainingOrSeminar
  WHERE EmployeeCode = @EmployeeID`;
  let totalTrainingsOrSeminars = await getResponse(conn, query, employeeID);
  return totalTrainingsOrSeminars;
}

async function getNamesAndLinksPRCIDs(conn, employeeID, token) {
  let link = process.env.PROTOCOL + process.env.DOMAIN + ':' + process.env.APP_PORT + "/api/uploads/get-current-prc-id?token=" + token + "&licenseName=";
  let query = `SELECT 
  License AS 'name',
  @LINK + TRIM(License) AS 'link'
  FROM [UE database]..License 
  WHERE EmployeeCode = @EmployeeID AND ExpirationDate IS NOT NULL`;

  return await getResponse(conn,query, employeeID, link);
}

async function getNamesAndLinksBirthCertificates(conn, employeeID, token) {
  let link = process.env.PROTOCOL + process.env.DOMAIN + ':' + process.env.APP_PORT + "/api/uploads/get-current-birth-certificate?token=" + token + "&fileName=";
  let query = `SELECT 
  FullName AS 'name',
  @LINK + TRIM(FullName) AS 'link'
  FROM [UE database]..Family WHERE EmployeeCode = @EmployeeID AND FamType = 'Child' AND HasAttachment = 1`;

  return await getResponse(conn,query, employeeID, link);
}

async function getNamesAndLinksMarriageCertificates(conn, employeeID, token) {
  let link = process.env.PROTOCOL + process.env.DOMAIN + ':' + process.env.APP_PORT + "/api/uploads/get-current-marriage-certificate?token=" + token;
  let query = `SELECT 
  FullName AS 'name',
  @LINK AS 'link'
  FROM [UE database]..Family WHERE EmployeeCode = @EmployeeID AND FamType = 'Spouse' AND HasAttachment = 1`;

  return await getResponse(conn,query, employeeID, link);
}

async function getNamesAndLinksTORs(conn, employeeID, token) {
  let link = process.env.PROTOCOL + process.env.DOMAIN + ':' + process.env.APP_PORT + "/api/uploads/get-current-tor-or-diploma?token=" + token + "&diploma=";
  let query = `SELECT 
  DiplomaDegreeHonor AS 'name',
  @LINK + TRIM(DiplomaDegreeHonor) + '&document=tor' AS 'link'
  FROM [UE database]..Education
  WHERE EmployeeCode = @EmployeeID AND IsTranscriptSubmitted = 1 AND IsFinish = 1 AND HasAttachment = 1`;

  return await getResponse(conn,query, employeeID, link);
}

async function getNamesAndLinksDiplomas(conn, employeeID, token) {
  let link = process.env.PROTOCOL + process.env.DOMAIN + ':' + process.env.APP_PORT + "/api/uploads/get-current-tor-or-diploma?token=" + token + "&diploma=";
  let query = `SELECT 
  DiplomaDegreeHonor AS 'name',
  @LINK + TRIM(DiplomaDegreeHonor) + '&document=diploma' AS 'link'
  FROM [UE database]..Education
  WHERE EmployeeCode = @EmployeeID AND IsDiplomaSubmitted = 1 AND IsFinish = 1 AND HasAttachment = 1`;

  return await getResponse(conn,query, employeeID, link);
}

async function getNamesAndLinksTrainingsOrSeminars(conn, employeeID, token) {
  let link = process.env.PROTOCOL + process.env.DOMAIN + ':' + process.env.APP_PORT + "/api/uploads/get-current-training-or-seminar-certificate?token=" + token + "&trainingOrSeminarName=";
  let query = `SELECT 
  TrainingOrSeminarName AS 'name',
  @LINK + TRIM(TrainingOrSeminarName) AS 'link'
  FROM HR..EmployeeCompletedTrainingOrSeminar WHERE EmployeeCode = @EmployeeID`;

  return await getResponse(conn,query, employeeID, link);
}

async function getEmployeeAttachments(conn, employeeID) {
  let con = conn;

  let user = {
    employee_id : employeeID,
  };

  let token = helperMethods.generateToken(user);

  let employeeAttachments = {
    totals: {
      prc_id: await getTotalPRCIDs(con, employeeID),
      birth_certificate: await getTotalBirthCertificates(con, employeeID),
      marriage_certificate: await getTotalMarriageCertificates(con, employeeID),
      tor: await getTotalTORs(con, employeeID),
      diploma: await getTotalDiplomas(con, employeeID),
      training_or_seminar: await getTotalTrainingsOrSeminars(con, employeeID),
    },
    names_and_links: {
      prc_id: await getNamesAndLinksPRCIDs(con, employeeID, token),
      birth_certificate: await getNamesAndLinksBirthCertificates(con, employeeID, token),
      marriage_certificate: await getNamesAndLinksMarriageCertificates(con, employeeID, token),
      tor: await getNamesAndLinksTORs(con, employeeID, token),
      diploma: await getNamesAndLinksDiplomas(con, employeeID, token),
      training_or_seminar: await getNamesAndLinksTrainingsOrSeminars(con, employeeID, token),
    }
  };

  return employeeAttachments;
}

async function getResponse(conn, query, employeeID, link = '') {
  if (link === '') {
    let response = await conn.request()
      .input("EmployeeID", sql.VarChar, employeeID)
      .query(query);
    return response.recordset[0].total;
  } else {
    let response = await conn.request()
      .input("EmployeeID", sql.VarChar, employeeID)
      .input("LINK", sql.VarChar, link)
      .query(query);
    return response.recordsets[0];
  }
}


export default {
  getAllDepartments,
  searchEmployee,
  getEmployeeAttachments
}