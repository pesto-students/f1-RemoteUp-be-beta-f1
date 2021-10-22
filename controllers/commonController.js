const { validationResult } = require('express-validator');
const { recruiterAppLogger, jobSeekerAppLogger } = require('../utils/logger');
const User = require('../models/UserModel');

function validationErrorCheck(req, res, method) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    recruiterAppLogger('error', `Validation Error occured during ${method}; Error: ${errors.array()}`);
    return res.json({
      status: 'FAILURE',
      errors: errors.array(),
      message: {
        code: '400',
        details: `Found validation error during ${method}`,
      },
    });
  }
  return true;
}

const saveUser = async (userEmailId) => {
  const userIdLower = userEmailId.toLowerCase();
  const userObject = await User.findOne({ userId: userIdLower });
  if (userObject) {
    return userObject;
  }
  const user = new User({
    userId: userIdLower,
  });
  const userData = await user.save();
  jobSeekerAppLogger('debug', `User with id ${userIdLower} saved successfully with details`);
  return userData;
};

module.exports = {
  validationErrorCheck,
  saveUser,
};
