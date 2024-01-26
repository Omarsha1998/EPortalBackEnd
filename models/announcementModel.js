import mssql from 'mssql'


const AnnouncementModel = {

  getAnnouncements: async (conn) => {
    try {

      const announcementQuery = `
        SELECT *
        FROM
          [HR]..Announcements
        WHERE
          Active = '1'
          AND App = 'WebApps'
      `
      const result = await conn
        .request()
        .query(announcementQuery);
      return result.recordset;
    } catch (error) {
      console.error(error);
      return { status: 500, message: 'Failed to retrieve Forfeited Leaves' };
    }
  },

};

export default AnnouncementModel;