/* eslint-disable consistent-return */
// Update Applicant Status
// View all Applicants with sort applied-time/experience, pagination, filter
// Add a Note for Applicant

const express = require('express');
const { check } = require('express-validator');
const { checkJwtRecruiter, jwtErrorHandler } = require('../../middleware/authMiddleware');
const extractEmailPayload = require('../../middleware/userEmailMiddleware');
const Application = require('../../models/ApplicationModel');
const { validationErrorCheck } = require('../commonController');
const { recruiterAppLogger } = require('../../utils/logger');
const {
  APPLIED, REJECTED, L1, L2, HR, SELECTED,
} = require('../../utils/constants');

const router = express.Router();

/* Update a Application status by ID by Recruiter after login-in
http://127.0.0.1:8000/recruiter/applicants/updateappstatus/6169b89d34f1bc10acc748d5
*/
router.patch('/updateappstatus/:appId', [
  checkJwtRecruiter,
  jwtErrorHandler,
  extractEmailPayload,
  check('status', 'Invalid status').isIn([APPLIED, REJECTED, L1, L2, HR, SELECTED]),
], async (req, res) => {
  try {
    validationErrorCheck(req, res, 'updateappstatus');
    const { user } = req;
    const { status } = req.body;
    const { appId } = req.params;
    const application = await Application.findById(appId).populate('jobId');

    const job = application.jobId;
    if (job.createdBy.toLowerCase() !== user.toLowerCase()) {
      recruiterAppLogger('debug', `User ${user} not authorized to update application with ID ${appId}`);
      return res.json({
        status: 'FAILURE',
        payload: {},
        message: {
          code: '401',
          details: 'User not authorized to update application',
        },
      });
    }
    application.statusUpdatedBy = user;
    application.applicationStatus = status;
    await application.save();
    recruiterAppLogger('debug', `Application with id ${appId} updated successfully by ${user}`);
    res.json({
      status: 'SUCCESS',
      payload: {},
      message: {
        code: '200',
        details: 'Application updated successfully',
      },
    });
  } catch (err) {
    recruiterAppLogger('error', `Error occured while updating Application; Error: ${err.message}`);
    res.json({
      status: 'FAILURE',
      payload: {},
      message: {
        code: '500',
        details: 'Not able to update Application server error',
      },
    });
  }
});

/* Write a note on an application by Recruiter after login-in
http://127.0.0.1:8000/recruiter/applicants/updatenote/6169b89d34f1bc10acc748d5
*/
router.patch('/updatenote/:appId', [
  checkJwtRecruiter,
  jwtErrorHandler,
  extractEmailPayload,
], async (req, res) => {
  try {
    const { user } = req;
    const { note } = req.body;
    const { appId } = req.params;
    const application = await Application.findById(appId).populate('jobId');

    const job = application.jobId;
    if (job.createdBy.toLowerCase() !== user.toLowerCase()) {
      recruiterAppLogger('debug', `User ${user} not authorized to update note with application ID ${appId}`);
      return res.json({
        status: 'FAILURE',
        payload: {},
        message: {
          code: '500',
          details: 'User not authorized to update note',
        },
      });
    }
    // application.statusUpdatedBy = user;
    application.note = note;
    await application.save();
    recruiterAppLogger('debug', `Application with id ${appId} updated note successfully by ${user}`);
    res.json({
      status: 'SUCCESS',
      payload: {},
      message: {
        code: '200',
        details: 'Note updated successfully',
      },
    });
  } catch (err) {
    recruiterAppLogger('error', `Error occured while updating note; Error: ${err.message}`);
    res.json({
      status: 'FAILURE',
      payload: {},
      message: {
        code: '500',
        details: 'Not able to update note server error',
      },
    });
  }
});

module.exports = router;
