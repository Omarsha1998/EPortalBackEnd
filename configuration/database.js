import helperMethods from "../utility/helperMethods.js";
import dotenv from "dotenv";
dotenv.config();

export const database = {
    user : process.env.USER,
    password : process.env.PASSWORD,
    server: process.env.SERVER,
    database: process.env.DATABASE,
    options:{
        trustedconnection: helperMethods.toBoolean(process.env.TRUSTED_CONNECTION),
        enableArithAbort : helperMethods.toBoolean(process.env.OPTIONS_ENABLE_ARITH_ABORT), 
        trustServerCertificate: helperMethods.toBoolean(process.env.OPTIONS_TRUST_SERVER_CERTIFICATE),
        encrypt: helperMethods.toBoolean(process.env.OPTIONS_ENCRYPT),
        instancename : process.env.INSTANCE_NAME,
        useUTC : helperMethods.toBoolean(process.env.OPTIONS_USE_UTC) 
    },
    port : helperMethods.toNumber(process.env.DATABASE_PORT)
};

export const database2 = {
    user : process.env.USER2,
    password : process.env.PASSWORD2,
    server: process.env.SERVER2,
    database: process.env.DATABASE2,
    options:{
        trustedconnection: helperMethods.toBoolean(process.env.TRUSTED_CONNECTION2),
        enableArithAbort : helperMethods.toBoolean(process.env.OPTIONS_ENABLE_ARITH_ABORT2), 
        trustServerCertificate: helperMethods.toBoolean(process.env.OPTIONS_TRUST_SERVER_CERTIFICATE2),
        encrypt: helperMethods.toBoolean(process.env.OPTIONS_ENCRYPT2),
        instancename : process.env.INSTANCE_NAME2,
        useUTC : helperMethods.toBoolean(process.env.OPTIONS_USE_UTC2) 
    },
    port : helperMethods.toNumber(process.env.DATABASE_PORT2)
};

const databaseConfig = { database, database2 }; 

export default databaseConfig;
