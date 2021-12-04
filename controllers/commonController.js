/* eslint-disable no-underscore-dangle */
const { validationResult } = require('express-validator');
const { recruiterAppLogger, jobSeekerAppLogger } = require('../utils/logger');
const User = require('../models/UserModel');
const Application = require('../models/ApplicationModel');
const Job = require('../models/JobModel');

// function to check what all errors found during validatation
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

// function to save a user and if already exists returns user object
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

// function to find applications count recieved by a recruiter in last 30 days
const getLast30Applications = async (user) => {
  try {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    date.setHours(0, 0, 0, 0);

    const jobs = await Job.find({ createdBy: user.toLowerCase() }, { _id: 1 });
    const ids = jobs.map((job) => job._id);
    const application = await Application.find({ jobId: { $in: ids }, createdAt: { $gt: date } });
    return application.length;
  } catch {
    recruiterAppLogger('error', `Error in getting applications count by ${user}`);
  }
};

module.exports = {
  validationErrorCheck,
  saveUser,
  getLast30Applications,
};
