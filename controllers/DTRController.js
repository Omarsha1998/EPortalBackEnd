import DTR from '../models/DTRModel.js';

const DTRController = {
  getDTRDetails: async (req, res) => {
    try {
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1;

      currentDate.setDate(1);
      const startDate = currentDate.toISOString().slice(0, 10);
      currentDate.setMonth(currentMonth, 0);
      const endDate = currentDate.toISOString().slice(0, 10);

      const additionalParameter = '';
      const employeeCode = req.user.employee_id;

      const success = await DTR.getDTRDetails(req.app.locals.conn, startDate, endDate, employeeCode, additionalParameter);

      if (success) {
        // Add a new 'schedule' property to each item in the array with time formatted as 'HH:mm'
        const timeZone = 'Asia/Manila';

        const dataWithFormattedTime = success.map(item => {
          const dayOfWeek = new Date(item.transDate).toLocaleString('en-US', { weekday: 'long' });
          const abbreviatedDay = dayOfWeek.slice(0, 3);

          // Format schedFrom and schedTo to 'HH:mm'
          const formattedSchedFrom = item.schedFrom ? item.schedFrom.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone }).replace(' ', '') : null;
          const formattedSchedTo = item.schedTo ? item.schedTo.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone }).replace(' ', '') : null;

          return {
            ...item,
            schedule: formattedSchedFrom && formattedSchedTo ? `${formattedSchedFrom} - ${formattedSchedTo}` : item.NOTE,
            transDate: new Date(item.transDate).toLocaleString('en-US', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).split('/').reverse().join('-'),
            dayOfWeek: abbreviatedDay,
          };
        });

        return res.status(200).json(dataWithFormattedTime);
      } else {
        return res.status(400).json({ error: 'Internal Server Error' });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'No Leave Details' });
    }
  },
};

export default DTRController;
