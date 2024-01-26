import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import fileUpload from "express-fileupload";
import {
  index,
  getCurrentMarriageCertificate,
  getCurrentPRCID,
  getCurrentTOROrDiploma,
  getCurrentBirthCertificate,
  getCurrentTrainingOrSeminarCertificate,
  getMarriageCertificate,
  getBirthCertificate,
  getPRCID,
  getTOROrDiploma,
  getTrainingOrSeminarCertificate,
} from "../controllers/uploadsController.js";

const router = express.Router();

router.post('/',
  protect,
  fileUpload({ createParentPath: true }),
  index
)


router.route("/get-current-marriage-certificate").get(getCurrentMarriageCertificate);
router.route("/get-current-prc-id").get(getCurrentPRCID);
router.route("/get-current-tor-or-diploma").get(getCurrentTOROrDiploma);
router.route("/get-current-birth-certificate").get(getCurrentBirthCertificate);
router.route("/get-current-training-or-seminar-certificate").get(getCurrentTrainingOrSeminarCertificate);
router.route("/get-marriage-certificate").get(getMarriageCertificate);
router.route("/get-birth-certificate").get(getBirthCertificate);
router.route("/get-prc-id").get(getPRCID);
router.route("/get-tor-or-diploma").get(getTOROrDiploma);
router.route("/get-training-or-seminar-certificate").get(getTrainingOrSeminarCertificate);

export default router;