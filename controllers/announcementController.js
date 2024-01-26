import Announcement from '../models/announcementModel.js'

const AnnouncementController = {
  
  getAnnouncements: async (req, res) => {
    try {

      const success = await Announcement.getAnnouncements(req.app.locals.conn);
  
      if (success) {
        return res.status(200).json(success);
      } else {
        return res.status(400).json({ error: 'Internal Server Error' });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'No Leave Details' });
    }
  },

};



export default AnnouncementController;