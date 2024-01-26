import helperMethods from "../utility/helperMethods.js";
import UsersModel from "../models/usersModel.js";

import redis from "redis";

// @desc    Auth user & get token
// @route   POST /api/users/login
// @access  Public
const login = async (req, res) => {
  try {
    // const { employee_id, password } = req.body;

   // const user = await UsersModel.getDetails(req.app.locals.conn, employee_id);
    
    // if (user !== undefined
    //   &&
    //   UsersModel.matchPassword(password, user.password) === true) {

    //   let generatedToken = await UsersModel.getToken(user);

    //   let userToken = {
    //     token: generatedToken
    //   }

    //   const redisClient = redis.createClient();
    //   await redisClient.connect();
    //   await redisClient.sendCommand(["DEL", "UERMEmployeePortal_" + employee_id]);
    //   await redisClient.set("UERMEmployeePortal_" + employee_id, generatedToken);

    //   return res.status(200).json(userToken);

    // } else {
    //   return res.status(401).json("Incorrect Employee ID and/or Password");
    // }

    
    const { employee_id } = req.body;
    const user = await UsersModel.getDetails(req.app.locals.conn, employee_id);
  
      let generatedToken = await UsersModel.getToken(user);

      let userToken = {
        token: generatedToken
      }

      const redisClient = redis.createClient();
      await redisClient.connect();
      await redisClient.sendCommand(["DEL", "UERMEmployeePortal_" + employee_id]);
      await redisClient.set("UERMEmployeePortal_" + employee_id, generatedToken);

      return res.status(200).json(userToken);

  }
  catch (error) {
    let message = "An error has occured in login(). Error Message: " + error.message + ", Stack Trace : " + error.stack;
    return res.status(500).json(message);
  }
};

// @desc    Remove the whitelisted token
// @route   POST /api/users/logout
// @access  Private
const logout = async (req, res) => {
  try {
    const { employee_id } = req.body;
    const redisClient = redis.createClient();
    await redisClient.connect();
    await redisClient.sendCommand(["DEL", "UERMEmployeePortal_" + employee_id]);
    return res.status(200).json("Successfully logout");
  }
  catch (error) {
    let message = "An error has occured in logout(). Error Message: " + error.message + ", Stack Trace : " + error.stack;
    return res.status(500).json(message);
  }
};

// @desc    Get user details
// @route   POST /api/users/get-user
// @access  Private
const getUser = async (req, res) => {
  try {
    const { token, date_range_search } = req.body;
    const employee_id = helperMethods.decode(token);
    const user = await UsersModel.getDetails(employee_id);

    if (user !== undefined) {
      return res.status(200).json(await UsersModel.getUserResponse(user, date_range_search, token));
    } else {
      return res.status(400).json("Cannot find this user with Employee ID: " + employee_id);
    }

  }
  catch (error) {
    let message = "An error has occured in getUser(). Error Message: " + error;
    return res.status(500).json(message);
  }
};

export {
  login,
  logout,
  getUser
};