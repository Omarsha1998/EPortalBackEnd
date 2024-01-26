import { database } from "../configuration/database.js";
import sql from 'mssql';

async function get(conn, employeeID) {
  let con = conn;
  let query = `SELECT 
  dateFrom AS 'date_from',
  dateTo AS 'date_to',
  ISNULL(TRIM(Company), '') AS 'company_name',
  ISNULL(TRIM(Position), '') AS 'job_position'
  FROM HR..EmpWorkExp
  WHERE deleted = 0 AND employeeCode = @EmployeeID`;
  let response = await con.request()
    .input("EmployeeID", sql.VarChar, employeeID)
    .query(query);
  return response.recordsets[0];
}

export default {
  get
}