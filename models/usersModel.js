import sql from 'mssql';
import md5 from "md5";
import helperMethods from "../utility/helperMethods.js";
import axios from "axios"

async function getDetails(conn, employeeID) {
  try {
    const query = `
      SELECT 
        TRIM(E.EmployeeCode) AS 'employee_id',
        TRIM(U.[PASSWORD]) AS 'password',
        TRIM(E.LastName + ', ' + E.FirstName + ' ' + E.MiddleName + '. ' + E.ExtName) AS 'employee_full_name', 
        CASE
          WHEN (SELECT COUNT(RecNo) FROM HR..EmpWorkExp AS W WHERE W.Deleted = 0 AND W.EmployeeCode = E.EmployeeCode) > 0 THEN 1
          ELSE 0
        END AS 'has_work_experience',
        CASE
          WHEN (SELECT COUNT(RecNo) FROM [UE database]..License AS L WHERE L.Deleted = 0 AND L.PrcLicense = 1 AND L.EmployeeCode = E.EmployeeCode) > 0 THEN 1
          ELSE 0
        END AS 'is_license',
        CASE
          WHEN D.DeptCode = '5040' THEN 1
          ELSE 0
        END AS 'isHR'
      FROM [UE database]..Employee AS E
      INNER JOIN ITMgt..Users U ON U.CODE = E.EmployeeCode
      LEFT JOIN [UE database]..Department D ON E.DeptCode = D.DeptCode
      WHERE E.EmployeeCode = @EmployeeID`;

    const result = await conn.request()
      .input("EmployeeID", sql.VarChar, employeeID)
      .query(query);

    return result.recordsets[0][0];
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function isApprover(employeeCode, moduleName) {
  let url = process.env.ACCESS_RIGHT_REST_API;
  const accessRightResponse = await axios.get(url, {
          params: {
            appName: 'Employee Portal',
            moduleName: moduleName,
            code: employeeCode
          }
        });
  const response = accessRightResponse.data[0].isAccess;
  return response;

}


async function getToken(userData, conn) {  
let user = {
    employee_id : userData.employee_id,
    employee_full_name: userData.employee_full_name,
    has_work_experience : convertToBoolean(userData.has_work_experience),
    is_license: convertToBoolean(userData.is_license),
    // isAdmin : true,
    // is_pis_approver : true
    access_rights : {
      is_pis_approver : await isApprover(userData.employee_id, "PIS Approver"),
      is_leave_approver : await isApprover(userData.employee_id, "Leave Approver")
    } ,
    // is_HR: await isHR(userData.employee_id, conn)
  }

 let generatedToken = helperMethods.generateToken(user)

  return generatedToken;
}

function convertToBoolean(value){
 return (value === 1 ? true : false);
}


function matchPassword(enteredPassword, correctPassword) {
  return md5(enteredPassword.trim()) === correctPassword.trim();
}


export default {
  getDetails,
  matchPassword,
  getToken,
}