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

// const saveUser = async (userEmailId, userDetails = null) => {
//   const userIdLower = userEmailId.toLowerCase();
//   const userObject = await User.findOne({ userId: userIdLower });
//   if (userDetails) {
//     const {
//       userFName, userLName, userContact, userExp, userLinkedIn,
//       userGitHub, userPortfolio, userWebsite,
//     } = userDetails;
//     if (userObject) {
//       userObject.userFName = userFName;
//       userObject.userLName = userLName;
//       userObject.userContact = userContact;
//       userObject.userExp = userExp;
//       userObject.userLinkedIn = userLinkedIn;
//       userObject.userGitHub = userGitHub;
//       userObject.userPortfolio = userPortfolio;
//       userObject.userWebsite = userWebsite;
//       const userData = await userObject.save();
//       jobSeekerAppLogger('debug', `User with id ${userIdLower} updated successfully with details`);
//       return userData;
//     }
//     const user = new User({
//       userId: userIdLower,
//       userFName,
//       userLName,
//       userContact,
//       userExp,
//       userLinkedIn,
//       userGitHub,
//       userPortfolio,
//       userWebsite,
//     });
//     const userData = await user.save();
//     jobSeekerAppLogger('debug', `User with id ${userIdLower} saved successfully with details`);
//     return userData;
//   }
//   if (userObject) {
//     return userObject;
//   }
//   const user = new User({ userId: userIdLower });
//   const userData = await user.save();
//   jobSeekerAppLogger('debug', `User with id ${userIdLower} saved successfully`);
//   return userData;
// };

const saveUser = async (userEmailId) => {
  const userIdLower = userEmailId.toLowerCase();
  const userObject = await User.findOne({ userId: userIdLower });
  if (userObject) {
    jobSeekerAppLogger('debug', `User with id ${userIdLower} updated successfully with details`);
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
