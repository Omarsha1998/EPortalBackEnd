import mssql from 'mssql'


const DTRModel = {

  getDTRDetails: async (conn, startDate, endDate, employeeCode, additionalParameter) => {
    try {
      const DTRQuery = `
        EXEC HR.dbo.Usp_jf_DTRv2 
          '${startDate}',
          '${endDate}',
          '${employeeCode}',
          '${additionalParameter}';
      `;

      const result = await conn
        .request()
        .query(DTRQuery);

      return result.recordset;
    } catch (error) {
      console.error(error);
      return { status: 500, message: 'Failed to retrieve DTR Details' };
    }
  },


};

export default DTRModel;