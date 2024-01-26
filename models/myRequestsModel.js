import { database } from "../configuration/database.js";
import sql from 'mssql';
import OtherRequestsModel from './otherRequestsModel.js';
import helperMethods from "../utility/helperMethods.js";

async function get(conn, employeeID, dateRangeSearch) {
  let myRequests = dateRangeSearch.my_requests;

 return {
  minimum_date_with_pending_request: await getMinimumDateWithPendingRequest(conn, employeeID),
  pending: await getPending(conn, employeeID, myRequests.pending.date_from, myRequests.pending.date_to),
  approved: await getApproved(conn, employeeID, myRequests.approved.date_from, myRequests.approved.date_to),
 }
}

async function getPending(conn, employeeID, dateFrom, dateTo) {
  let con = conn;
  let query = `SELECT DISTINCT
                  (
                  CAST((SELECT COUNT(*) FROM [UE database]..RequestDtl 
                  WHERE CurrentStatus = 0 AND ApprovedBy IS NULL 
                  AND DateTimeApproved IS NULL AND H.CreatedBy = @EmployeeID 
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
                  H.ShouldHighlightedToRequester AS 'should_high_lighted_to_requester',
                  '' AS 'requested_fields',
                  '' AS 'details',
                  '' AS 'description'
                  FROM [UE database]..RequestHdr AS H
                  INNER JOIN [UE database]..RequestDtl AS D
                  ON D.RequestHdrID = H.ID
                  INNER JOIN [UE database]..Employee AS E
                  ON H.CreatedBy = E.EmployeeCode
                  WHERE D.CurrentStatus = 0
                  AND D.ApprovedBy IS NULL
                  AND D.DateTimeApproved IS NULL
                  AND H.CreatedBy = @EmployeeID
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
        D.DateTimeRemarks AS 'date_time_remarks',
        D.IsComplied AS 'is_complied'
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
            table_rows: OtherRequestsModel.renameColumnName(response.recordsets[0])
          };
          dtl.push(obj);

          requestHdr[index].details = totalLength > 1 ? dtl : OtherRequestsModel.renameColumnName(response.recordsets[0]);
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
                  D.DateTimeRemarks AS 'date_time_remarks',
                  D.IsComplied AS 'is_complied'
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
            table_rows: OtherRequestsModel.renameColumnName(response.recordsets[0])
          };
          dtl.push(obj);
          requestHdr[index].details = totalLength > 1 ? dtl : OtherRequestsModel.renameColumnName(response.recordsets[0]);
        }
      }
      // ------------------------------------------------- EDIT -------------------------------------------------
      else {
        throw 'Invalid request type in getPending()';
      }

    }

    requestHdr[index].description = await OtherRequestsModel.getDescription(conn, requestHdr[index].created_by, requestHdr[index].request_id);
    let statusID = 0;
    requestHdr[index].requested_fields = await OtherRequestsModel.getRequestedFields(conn, requestHdr[index].request_id, statusID);
  }

  return requestHdr;
}

async function getApproved(conn, employeeID, dateFrom, dateTo) {
  let con = conn;
  let query = `SELECT DISTINCT
                  (
                  CAST((SELECT COUNT(*) FROM [UE database]..RequestDtl 
                  WHERE CurrentStatus = 1 AND ApprovedBy IS NOT NULL 
                  AND DateTimeApproved IS NOT NULL AND H.CreatedBy = @EmployeeID
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
                  AND H.CreatedBy = @EmployeeID
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
        D.DateTimeApproved AS 'date_time_approved',
        TRIM(E.LastName + ', ' + E.FirstName + ' ' + LEFT(E.MiddleName, 1) + '. ' + E.ExtName) AS 'approved_by',
        TRIM(D.ColumnName) AS 'column_name',
        TRIM(D.NewValue) AS 'value'
        FROM RequestDtl AS D
        INNER JOIN [UE database]..Employee AS E
        ON D.ApprovedBy = E.EmployeeCode
        WHERE D.RequestHdrID = @RequestHdrID
        AND D.CurrentStatus = 1
        AND D.ApprovedBy IS NOT NULL
        AND D.DateTimeApproved IS NOT NULL`;

        if (item.person_queue_number !== null) {
          query += " AND D.PersonQueueNumber = @PersonQueueNumber";
          query += " ORDER BY D.DateTimeApproved ASC";
          response = await con.request()
            .input("RequestHdrID", sql.Int, requestHdr[index].request_id)
            .input("PersonQueueNumber", sql.Int, item.person_queue_number)
            .query(query);
        } else {
          query += " ORDER BY D.DateTimeApproved ASC";
          response = await con.request()
            .input("RequestHdrID", sql.Int, requestHdr[index].request_id)
            .query(query);
        }

        if (response.recordsets[0].length > 0) {
          const obj = {
            table_rows: OtherRequestsModel.renameColumnName(response.recordsets[0])
          };
          dtl.push(obj);
          requestHdr[index].details = totalLength > 1 ? dtl : OtherRequestsModel.renameColumnName(response.recordsets[0]);
        }
      }
      // ------------------------------------------------- CREATE -------------------------------------------------
      // ------------------------------------------------- EDIT -------------------------------------------------
      else if (requestHdr[index].request_type === 'edit' && item.person_queue_number === null) {
        query = `SELECT 
        D.ID AS 'id',
        D.DateTimeApproved AS 'date_time_approved',
        TRIM(E.LastName + ', ' + E.FirstName + ' ' + LEFT(E.MiddleName, 1) + '. ' + E.ExtName) AS 'approved_by',
        TRIM(D.ColumnName) AS 'column_name',
        TRIM(D.OldValue) AS 'from',
        TRIM(D.NewValue) AS 'to'
        FROM RequestDtl AS D
        INNER JOIN [UE database]..Employee AS E
        ON D.ApprovedBy = E.EmployeeCode
        WHERE D.RequestHdrID = @RequestHdrID
        AND D.CurrentStatus = 1
        AND D.ApprovedBy IS NOT NULL
        AND D.DateTimeApproved IS NOT NULL`;

        if (item.family_id !== null) {
          query += " AND D.FamilyRecno = @FamilyRecno";
          query += " ORDER BY D.DateTimeApproved ASC";
          response = await con.request()
            .input("RequestHdrID", sql.Int, requestHdr[index].request_id)
            .input("FamilyRecno", sql.Int, item.family_id)
            .query(query);
        } else {
          query += " ORDER BY D.DateTimeApproved ASC";
          response = await con.request()
            .input("RequestHdrID", sql.Int, requestHdr[index].request_id)
            .query(query);
        }

        if (response.recordsets[0].length > 0) {
          const obj = {
            sibling_or_child_full_name: item.sibling_or_child_full_name,
            table_rows: OtherRequestsModel.renameColumnName(response.recordsets[0])
          };
          dtl.push(obj);
          requestHdr[index].details = totalLength > 1 ? dtl : OtherRequestsModel.renameColumnName(response.recordsets[0]);
        }
      }
      // ------------------------------------------------- EDIT -------------------------------------------------
      else {
        throw 'Invalid request type in getApproved()';
      }

    }

    requestHdr[index].description = await OtherRequestsModel.getDescription(conn, requestHdr[index].created_by, requestHdr[index].request_id);
    let statusID = 1;
    requestHdr[index].requested_fields = await OtherRequestsModel.getRequestedFields(conn, requestHdr[index].request_id, statusID);
  }

  return requestHdr;
}

async function submitComply(conn, data) {
  let transaction;
  try {
    let isString = false;
    let newValue = data.value;
    if (helperMethods.isString(newValue) === true) {
      newValue = newValue.trim();
      isString = true;
    }

    transaction = new sql.Transaction(conn);
    await transaction.begin();
    let request = new sql.Request(transaction);
    let query = `UPDATE [UE database]..RequestDtl 
      SET `;
    if (isString === true) {
      query += "NewValue = @NewValue, ";
      request.input("NewValue", sql.VarChar, newValue);
    }
    query += "IsComplied = 1 "
    query += "WHERE ID = @ID";
    request.input("ID", sql.Int, data.request_details_id);
    let response = await request.query(query);
    if (response.rowsAffected[0] === 0) {
      throw "No rows affected"
    }

    request = new sql.Request(transaction);
    query = `SELECT TOP 1 
    RequestHdrID
    FROM RequestDtl
    WHERE ID = @ID`;
    request.input("ID", sql.Int, data.request_details_id);
    response = await request.query(query);
    let requestHDRID = response.recordset[0].RequestHdrID;

    request = new sql.Request(transaction);
    query = `UPDATE [UE database]..RequestHdr 
      SET ShouldHighlightedToHR = 1
      WHERE ID = @ID`;
    request.input("ID", sql.Int, requestHDRID);
    response = await request.query(query);
    if (response.rowsAffected[0] === 0) {
      throw "No rows affected"
    }

    await transaction.commit();

  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

async function requestNotHighLightedToRequester(conn, requestID) {
  let transaction;
  try {
    transaction = new sql.Transaction(conn);
    await transaction.begin();
    let request = new sql.Request(transaction);
    let query = `UPDATE [UE DATABASE]..RequestHdr SET ShouldHighlightedToRequester = 0 WHERE ID = @ID`;
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

async function getMinimumDateWithPendingRequest(conn, employeeID) {
  let query = `SELECT TOP 1 
  CAST(H.DateTimeCreated AS DATE) AS 'DateTimeCreated'
  FROM [UE database]..RequestHdr AS H
  INNER JOIN [UE database]..RequestDtl AS D
  ON H.ID = D.RequestHdrID
  WHERE D.ApprovedBy IS NULL AND D.DateTimeApproved IS NULL 
  AND H.CreatedBy = @EmployeeID
  ORDER BY H.DateTimeCreated ASC`;
  let response = await conn.request()
    .input("EmployeeID", sql.Int, employeeID)
    .query(query);
    return (response.recordsets[0][0] !== undefined) ? response.recordsets[0][0].DateTimeCreated : '1900-01-01';
}

export default {
  get,
  submitComply,
  requestNotHighLightedToRequester
}