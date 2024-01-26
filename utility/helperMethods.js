function toBoolean(stringVariable) {
    return stringVariable === 'true' ? true : false;
}

function toNumber(stringVariable) {
    return Number(stringVariable);
}

function removeTime(dateTime) {
    // FORMAT = 2023-05-05T00:00:00.000Z
    return dateTime.slice(0, 10);
}

import sql from 'mssql';
import { database } from "../configuration/database.js";
import colors from "colors";

async function testDatabaseConnection(url, environment, portNumber) {
    try {
        await sql.connect(database);
        console.log(`--------------------------------------------------------------------------------------------------------`.yellow);
        console.log(`--------------------------------------------------------------------------------------------------------`.yellow);
        console.log(`                          Successfully connected in sql server database                                 `.yellow);
        console.log(`                          Server running in ${environment} mode on port ${portNumber}                   `.yellow);
        console.log(`                          Link: ${url}                                                                  `.yellow);
        console.log(`--------------------------------------------------------------------------------------------------------`.yellow);
        console.log(`--------------------------------------------------------------------------------------------------------`.yellow);
    }
    catch (error) {
        let message = "An error has occured in testDatabaseConnection(url, environment, portNumber). Error Message: " + error;
        console.log(message);
    }
}

import jwt from "jsonwebtoken";
const generateToken = (user) => {
    return jwt.sign({ user }, process.env.JWT_SECRET, {
        expiresIn: "3d",
    });
};

function decode(token) {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded;
}

import fs from "fs";
import path from "path";

async function isExist(filePath) {
    try {
        await fs.promises.stat(filePath);
        return true;
    } catch {
        return false;
    }
}

import { promises as fsPromises } from 'fs';

async function renameFile(filePath, newFileName) {
    try {
        const newFilePath = path.join(path.dirname(filePath), newFileName);
        await fsPromises.rename(filePath, newFilePath);
    } catch (err) {
        throw 'Error renaming file: ' + err;
    }
  }



import fsExtra from 'fs-extra';

async function copyFiles(sourceDir, destinationDir) {
  try {
    await fsExtra.copy(sourceDir, destinationDir);
  } catch (err) {
    throw 'Error copying files:' + err;
  }
}

async function deleteFiles(filePath) {
    try {
        await fsExtra.emptyDir(filePath);
      } catch (err) {
        throw 'Error deleting files:' + err;
      }
}

async function copyFile(sourcePath, destinationDirectory) {
    const fileExists = await fs.promises.access(sourcePath, fs.constants.F_OK)
        .then(() => true)
        .catch(() => false);

    if (!fileExists) {
        throw new Error('Source file does not exist.');
    }

    const directoryExists = await fs.promises.access(destinationDirectory, fs.constants.F_OK)
        .then(() => true)
        .catch(() => false);

    if (!directoryExists) {
        throw new Error('Destination directory does not exist.');
    }

    const fileName = sourcePath.substring(sourcePath.lastIndexOf('/') + 1);
    const destinationPath = `${destinationDirectory}/${fileName}`;

    await fs.promises.copyFile(sourcePath, destinationPath);
}

async function deleteFile(filePath) {
    return new Promise((resolve, reject) => {
        fs.unlink(filePath, (err) => {
            if (err) {
                reject(err);
                return;
            }
            resolve();
        });
    });
}

async function createFolder(path) {
    if (await isFolderExist(path) === false) {
        return new Promise((resolve, reject) => {
            fs.mkdir(path, { recursive: true }, (err) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve();
            });
        });
    }
}

async function isFolderExist(folderPath) {
    try {
        await fs.promises.access(folderPath, fs.constants.F_OK);
        return true;
    } catch (error) {
        if (error.code === 'ENOENT') {
            return false;
        }
        throw error;
    }
}

async function isFolderEmpty(folderPath) {
    const files = await fs.promises.readdir(folderPath);
    return files.length === 0;
}

async function deleteFolder(folderPath) {
    await fs.promises.rmdir(folderPath, { recursive: true });
}

function isString(value) {
    return typeof value === 'string';
  }
  

export default {
    toBoolean,
    toNumber,
    testDatabaseConnection,
    generateToken,
    decode,
    removeTime,
    isExist,
    copyFile,
    deleteFile,
    createFolder,
    isFolderEmpty,
    deleteFolder,
    copyFiles,
    deleteFiles,
    isFolderExist,
    renameFile,
    isString
}