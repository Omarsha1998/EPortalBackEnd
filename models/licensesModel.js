import { database } from "../configuration/database.js";
import sql from 'mssql';
import helperMethods from "../utility/helperMethods.js";
import UploadsModel from '../models/uploadsModel.js';

async function get(conn, employeeID, token) {
  let url = process.env.PROTOCOL + process.env.DOMAIN + ':' + process.env.APP_PORT + "/api/uploads/get-current-prc-id?token=" + token;
  url += "&licenseName=";
  url = url.trim();

  let con = conn;
  let query = `SELECT
  ISNULL(TRIM(License), '') AS 'license_name',
  ISNULL(TRIM(LicenseNo), '') AS 'license_no',
  ISNULL(Rate, 0) AS 'rate',
  ISNULL(TRIM(YearTaken), '') AS 'year_taken',
  ISNULL(ExpirationDate, '') AS 'expiration_date',
  ISNULL(DateTimeUpdated, '') AS 'date_time_updated',
  @URL + TRIM(License) AS 'url'
  FROM [UE database]..License
  WHERE EmployeeCode = @EmployeeID AND PrcLicense = 1
  ORDER BY YearTaken DESC`;
  let response = await con.request()
    .input("EmployeeID", sql.VarChar, employeeID)
    .input("URL", sql.VarChar, url)
    .query(query);
  return response.recordsets[0];
}

async function getExpirationDate(conn, employeeID, licenseNo) {
  let con = conn;
  let query = `SELECT TOP 1
  ISNULL(ExpirationDate, '') AS 'expiration_date'
  FROM [UE database]..License
  WHERE EmployeeCode = @EmployeeID AND LicenseNo = @LicenseNo AND PrcLicense = 1`;
  let response = await con.request()
    .input("EmployeeID", sql.VarChar, employeeID)
    .input("LicenseNo", sql.VarChar, licenseNo)
    .query(query);
  return response.recordset[0].expiration_date;
}

async function isLicensedEmployee(conn, employeeID) {
  let con = conn;
  let query = `SELECT TOP 1 EmployeeCode 
               FROM [UE database]..License 
               WHERE EmployeeCode = @EmployeeID`;
  let response = await con.request()
    .input("EmployeeID", sql.VarChar, employeeID)
    .query(query);
  let length = response.recordsets[0].length;
  return (length > 0 ? true : false);
}

async function isExpired(conn, employeeID) {
  let con = conn;
  let query = ` SELECT TOP 1 EmployeeCode
                FROM [UE database]..License 
                WHERE EmployeeCode = @EmployeeID 
                AND
                ExpirationDate < CAST(GETDATE() as DATE)`;
  let response = await con.request()
    .input("EmployeeID", sql.VarChar, employeeID)
    .query(query);
  let length = response.recordsets[0].length;
  return (length > 0 ? true : false);
}

async function isAllExpired(conn, employeeID) {
  let con = conn;
  let query = `SELECT COUNT(*) AS 'total_licenses' FROM [UE database]..License WHERE EmployeeCode = @EmployeeID`;
  let response = await con.request()
    .input("EmployeeID", sql.VarChar, employeeID)
    .query(query);
  let totalLicenses = response.recordset[0].total_licenses;

  con = await sql.connect(database);
  query = `SELECT COUNT(*) AS 'total_expired_licenses'
   FROM [UE database]..License 
   WHERE EmployeeCode = @EmployeeID 
   AND
   ExpirationDate < CAST(GETDATE() as DATE)`;
  response = await con.request()
    .input("EmployeeID", sql.VarChar, employeeID)
    .query(query);
  let totalExpiredLicenses = response.recordset[0].total_expired_licenses;
  return totalLicenses == totalExpiredLicenses ? true : false;
}

async function createRequest(conn, data) {
  let transaction;
  try {
    let requestID;
    transaction = new sql.Transaction(conn);
    await transaction.begin();
    const createdBy = data.employee_id;
    const destinationTable = "License";
    const requestType = 0; // 0 = Edit

    let request = new sql.Request(transaction);
    let query = `INSERT INTO [UE database]..RequestHdr 
             (CreatedBy, DateTimeCreated, DestinationTable, RequestType, LicenseNo)
             VALUES 
             (@CreatedBy, GETDATE(), @DestinationTable, @RequestType, @LicenseNo)`;
    request.input("CreatedBy", sql.VarChar, createdBy);
    request.input("DestinationTable", sql.VarChar, destinationTable);
    request.input("RequestType", sql.SmallInt, requestType);
    request.input("LicenseNo", sql.VarChar, data.license_no);
    let response = await request.query(query);
    if (response.rowsAffected[0] === 0) {
      throw "No rows affected"
    }

    request = new sql.Request(transaction);
    query = `SELECT TOP 1 ID AS 'id' FROM [UE database]..RequestHdr ORDER BY DateTimeCreated DESC`;
    response = await request.query(query);
    requestID = response.recordset[0].id;

    const currentExpirationDate = helperMethods.removeTime(data.current_expiration_date);
    const newExpirationDate = data.new_expiration_date;


    request = new sql.Request(transaction);
    query = `INSERT INTO [UE database]..RequestDtl 
             (RequestHdrID, ColumnName, OldValue, NewValue)
             VALUES 
             (@RequestHdrID, @ColumnName, @OldValue, @NewValue)`;
    request.input("RequestHdrID", sql.Int, requestID);
    request.input("ColumnName", sql.VarChar, "ExpirationDate");
    request.input("OldValue", sql.VarChar, (currentExpirationDate === '1900-01-01' ? null : currentExpirationDate));
    request.input("NewValue", sql.VarChar, newExpirationDate);
    response = await request.query(query);
    if (response.rowsAffected[0] === 0) {
      throw "No rows affected"
    }

    let currentCurrentPRCIDFileName = "";
    let resultPath = await UploadsModel.getCurrentPRCID(createdBy, data.license_name);
    if (resultPath !== "") {
      const array = resultPath.split("/");
      const lastIndex = array.length - 1;
      currentCurrentPRCIDFileName = array[lastIndex];
      currentCurrentPRCIDFileName.trim();
    } 

    let newValue = data.license_name + "." + data.attach_prc_id.split('.').pop();

    request = new sql.Request(transaction);
    query = "INSERT INTO [UE database]..RequestDtl (RequestHdrID, ColumnName, "
    query += currentCurrentPRCIDFileName === "" ?
      "NewValue)" : "OldValue, NewValue)";
    query += " VALUES (@RequestHdrID, @ColumnName, ";
    query += currentCurrentPRCIDFileName === "" ?
      "@NewValue)" : "@OldValue, @NewValue)";

    request.input("RequestHdrID", sql.Int, requestID);
    request.input("ColumnName", sql.VarChar, "PRC ID");
    if (currentCurrentPRCIDFileName !== ""){
      request.input("OldValue", sql.VarChar, currentCurrentPRCIDFileName);
    }
    request.input("NewValue", sql.VarChar, newValue);
    response = await request.query(query);
    if (response.rowsAffected[0] === 0) {
      throw "No rows affected"
    }

    await transaction.commit();
    return requestID
  } catch (error) {
    await transaction.rollback();
    throw error;
  } 
}

export default {
  isLicensedEmployee,
  isExpired,
  createRequest,
  get,
  getExpirationDate,
  isAllExpired,
}