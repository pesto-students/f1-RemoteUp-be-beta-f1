const { validationResult } = require('express-validator');
const { recruiterAppLogger } = require('../utils/logger');

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

module.exports = validationErrorCheck;
