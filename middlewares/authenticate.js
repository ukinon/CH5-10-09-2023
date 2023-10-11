const jwt = require("jsonwebtoken");

const { User, Auth } = require("../models");
const ApiError = require("../utils/apiError");

module.exports = async (req, res, next) => {
  try {
    const tokenBearer = req.headers.authorization;

    if (!tokenBearer) {
      next(new ApiError("token is unavailable", 401));
    }

    const token = tokenBearer.split("Bearer ")[1];
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    const user = await Auth.findByPk(payload.id, {
      include: ["User"],
    });

    req.user = user;
    next();
  } catch (err) {
    next(new ApiError(err.message, 500));
  }
};
