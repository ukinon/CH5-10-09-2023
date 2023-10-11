const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const { Auth, User } = require("../models");

const ApiError = require("../utils/apiError");

const register = async (req, res, next) => {
  try {
    const { name, age, address, email, password, confirmPassword } = req.body;

    //validation for checking email registered or not
    const user = await Auth.findOne({
      where: {
        email,
      },
    });

    if (user) {
      next(new ApiError("Email has already been taken", 400));
    }

    const passwordLength = password <= 8;
    if (passwordLength) {
      next(new ApiError("Password must be at least 8 characters", 400));
    }

    if (password != confirmPassword) {
      next(new ApiError("Password does not match", 400));
    }

    const saltRounds = 10;
    const hashedPassword = bcrypt.hashSync(password, saltRounds);
    const hashedConfirmPassword = bcrypt.hashSync(confirmPassword, saltRounds);

    const newUser = await User.create({
      name,
      address,
      age,
    });

    await Auth.create({
      email,
      password: hashedPassword,
      confirmPassword: hashedConfirmPassword,
      userId: newUser.id,
    });

    res.status(201).json({
      status: "success",
      data: {
        user: {
          ...newUser.name,
          ...newUser.age,
          ...newUser.address,
          email,
        },
      },
    });
  } catch (err) {
    next(new ApiError(err.message, 400));
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await Auth.findOne({
      where: {
        email,
      },
      include: ["User"],
    });

    if (user && bcrypt.compareSync(password, user.password)) {
      const token = jwt.sign(
        {
          id: user.userId,
          username: user.User.name,
          role: user.User.role,
          email: user.email,
        },
        process.env.JWT_SECRET
      );

      res.status(200).json({
        status: "success",
        message: "Logged in successfully",
        data: token,
      });
    } else {
      next(new ApiError("wrong credentials or user does not exist", 400));
    }
  } catch (err) {
    next(new ApiError(err.message, 500));
  }
};

module.exports = {
  register,
  login,
};
