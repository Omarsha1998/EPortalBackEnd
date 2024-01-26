// import express from "express";
// import dotenv from "dotenv";
// import morgan from "morgan";
// import cors from "cors";
// import bodyParser from "body-parser";
// import databaseConfig from "./configuration/database.js"
// import mssql from "mssql"

// import { notFound } from "./middleware/notFoundMiddleware.js";

// import indexRoutes from "./routes/indexRoutes.js";
// import personalInformationsRoutes from "./routes/personalInformationsRoutes.js";
// import familyBackgroundsRoutes from "./routes/familyBackgroundsRoutes.js";
// import educationalBackgroundsRoutes from "./routes/educationalBackgroundsRoutes.js";
// import trainingsOrSeminarsRoutes from "./routes/trainingsOrSeminarsRoutes.js";
// import attachmentArchivesRoutes from "./routes/attachmentArchivesRoutes.js";
// import workExperiencesRoutes from "./routes/workExperiencesRoutes.js";
// import licensesRoutes from "./routes/licensesRoutes.js";
// import usersRoutes from "./routes/usersRoutes.js";
// import otherRequestsRoutes from "./routes/otherRequestsRoutes.js";
// import myRequestsRoutes from "./routes/myRequestsRoutes.js";
// import uploadsRoutes from "./routes/uploadsRoutes.js";
// import leaveRoutes from './routes/leaveRoutes.js'
// import announcement from './routes/announcementsRoutes.js'
// import dtr from './routes/dtrRoutes.js'


// dotenv.config();

// const app = express();
// const PORT = process.env.APP_PORT;
// const ENVIRONMENT = process.env.APP_ENVIRONMENT;

// // if (ENVIRONMENT === "development") {
// //   app.use(morgan("dev"));
// // }


// import { fileURLToPath } from 'url';
// import { dirname } from 'path';
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = dirname(__filename);
// app.set("views", __dirname + "\\views");
// app.set("view engine", "ejs");

// app.use(express.static("public"));
// app.use(express.static("uploaded"));

// app.use(bodyParser.urlencoded({ extended: true }));
// app.use(bodyParser.json());
// app.use(cors({
//   origin: "*",
// }));




// import helperMethods from "./utility/helperMethods.js";
// const url = process.env.PROTOCOL + process.env.DOMAIN + ':' + PORT;



// (async () => {
//   const conn = new mssql.ConnectionPool(databaseConfig.database);

//   try {
//     await conn.connect();
//     console.log("Connected to SQL Server");
//   } catch (error) {
//     console.error("Database Connection Failed! Bad Config: ", error);
//     process.exit();
//   }

//   app.locals.conn = conn;

//   app.use("/", indexRoutes);
//   app.use("/api/personal-informations", personalInformationsRoutes);
//   app.use("/api/family-backgrounds", familyBackgroundsRoutes);
//   app.use("/api/educational-backgrounds", educationalBackgroundsRoutes);
//   app.use("/api/licenses", licensesRoutes);
//   app.use("/api/trainings-or-seminars", trainingsOrSeminarsRoutes);
//   app.use("/api/attachment-archives", attachmentArchivesRoutes);
//   app.use("/api/work-experiences", workExperiencesRoutes);
//   app.use("/api/users", usersRoutes);
//   app.use("/api/other-requests", otherRequestsRoutes);
//   app.use("/api/my-requests", myRequestsRoutes);
//   app.use("/api/uploads", uploadsRoutes);
//   app.use("/leave", leaveRoutes);
//   app.use("/announcement", announcement)
//   // app.use("/dtrdetails", dtr)
//   app.use("/dtrdetails", async (req, res, next) => {
//     const connDtr = new mssql.ConnectionPool(databaseConfig.database2);
//     try {
//       await connDtr.connect();
//       console.log("Connected to SQL Server for /dtrdetails route");
//       req.app.locals.conn = connDtr; // Set the new connection pool for /dtrdetails route
//       next();
//     } catch (error) {
//       console.error("Database Connection Failed! Bad Config (for /dtrdetails route): ", error);
//       process.exit();
//     }
//   }, dtr);
  
//   app.use(notFound);

//   app.listen(PORT, helperMethods.testDatabaseConnection(url, ENVIRONMENT, PORT));

// })();


import express from "express";
import dotenv from "dotenv";
import morgan from "morgan";
import cors from "cors";
import bodyParser from "body-parser";
import databaseConfig from "./configuration/database.js";
import mssql from "mssql";

import { notFound } from "./middleware/notFoundMiddleware.js";

import indexRoutes from "./routes/indexRoutes.js";
import personalInformationsRoutes from "./routes/personalInformationsRoutes.js";
import familyBackgroundsRoutes from "./routes/familyBackgroundsRoutes.js";
import educationalBackgroundsRoutes from "./routes/educationalBackgroundsRoutes.js";
import trainingsOrSeminarsRoutes from "./routes/trainingsOrSeminarsRoutes.js";
import attachmentArchivesRoutes from "./routes/attachmentArchivesRoutes.js";
import workExperiencesRoutes from "./routes/workExperiencesRoutes.js";
import licensesRoutes from "./routes/licensesRoutes.js";
import usersRoutes from "./routes/usersRoutes.js";
import otherRequestsRoutes from "./routes/otherRequestsRoutes.js";
import myRequestsRoutes from "./routes/myRequestsRoutes.js";
import uploadsRoutes from "./routes/uploadsRoutes.js";
import leaveRoutes from './routes/leaveRoutes.js'
import announcement from './routes/announcementsRoutes.js'
import dtr from './routes/dtrRoutes.js'

dotenv.config();

const app = express();
const PORT = process.env.APP_PORT;
const ENVIRONMENT = process.env.APP_ENVIRONMENT;

import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.set("views", __dirname + "\\views");
app.set("view engine", "ejs");

app.use(express.static("public"));
app.use(express.static("uploaded"));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors({
  origin: "*",
}));

import helperMethods from "./utility/helperMethods.js";
const url = process.env.PROTOCOL + process.env.DOMAIN + ':' + PORT;

// Define the connection pools
const conn = new mssql.ConnectionPool(databaseConfig.database);
const connDtr = new mssql.ConnectionPool(databaseConfig.database2);

// Connect to the default database
conn.connect()
  .then(() => {
    console.log("Connected to SQL Server");
  })
  .catch(error => {
    console.error("Database Connection Failed! Bad Config: ", error);
    process.exit();
  });

app.locals.conn = conn;

// Middleware to switch connection for specific routes
const switchDatabase = async (req, res, next) => {
  try {
    // Disconnect the connDtr if it's set
    if (req.app.locals.conn === connDtr && req.app.locals.conn.connected) {
      await req.app.locals.conn.close();
      console.log("Disconnected from SQL Server for /dtrdetails route");
    }

    // Set the appropriate connection pool based on the route
    if (req.baseUrl === "/dtrdetails") {
      req.app.locals.conn = connDtr;
    } else {
      req.app.locals.conn = conn;
    }

    // Connect to the database if not connected
    if (!req.app.locals.conn.connected) {
      await req.app.locals.conn.connect();
      console.log("Connected to SQL Server");
    }

    next();
  } catch (error) {
    console.error("Error while switching database:", error);
    res.status(500).send("Internal Server Error");
  }
};

app.use("/", indexRoutes);
app.use("/api/personal-informations", switchDatabase, personalInformationsRoutes);
app.use("/api/family-backgrounds", switchDatabase, familyBackgroundsRoutes);
app.use("/api/educational-backgrounds", switchDatabase, educationalBackgroundsRoutes);
app.use("/api/licenses", switchDatabase, licensesRoutes);
app.use("/api/trainings-or-seminars", switchDatabase, trainingsOrSeminarsRoutes);
app.use("/api/attachment-archives", switchDatabase, attachmentArchivesRoutes);
app.use("/api/work-experiences", switchDatabase, workExperiencesRoutes);
app.use("/api/users", switchDatabase, usersRoutes);
app.use("/api/other-requests", switchDatabase, otherRequestsRoutes);
app.use("/api/my-requests", switchDatabase, myRequestsRoutes);
app.use("/api/uploads", switchDatabase, uploadsRoutes);
app.use("/leave", switchDatabase, leaveRoutes);
app.use("/announcement", switchDatabase, announcement);
app.use("/dtrdetails", switchDatabase, dtr);

app.use(notFound);

app.listen(PORT, helperMethods.testDatabaseConnection(url, ENVIRONMENT, PORT));
