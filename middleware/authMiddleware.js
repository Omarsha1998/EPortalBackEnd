import jwt from "jsonwebtoken";
import redis from "redis";

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {

    try {
      token = req.headers.authorization.split(" ")[1];
      jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json("The token is not valid");
    }

    try {  
      const user = jwt.decode(token).user;
      const employeeID = jwt.decode(token).user.employee_id;
      const redisClient = redis.createClient();
      await redisClient.connect();
      const responseToken = await redisClient.get("UERMEmployeePortal_" + employeeID)
      if (responseToken !== token) {
        return res.status(401).json("The token is not white listed.");
      }
      req.user = user;
      next();
    } catch (error) {
      return res.status(500).send("An error has occured in isTokenWhitelisted(). Error Message : " + error);
    }

  }

  if (!token) {
    return res.status(401).json("Token is required to access this route");
  }
};

export { protect };