/* eslint-disable no-underscore-dangle */
/* eslint-disable consistent-return */
// Update Applicant Status
// Add a Note for Applicant
// View all Applicants with sort applied-time/experience, pagination, filter

const express = require('express');
const { check } = require('express-validator');
const { checkJwtRecruiter, jwtErrorHandler } = require('../../middleware/authMiddleware');
const extractEmailPayload = require('../../middleware/userEmailMiddleware');
const Application = require('../../models/ApplicationModel');
// const Job = require('../../models/JobModel');
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
http://127.0.0.1:8000/recruiter/applicants/updatenote/616bc20bc5b2db3310e3d5a4
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

/* View all Applications by Recruiter after login-in
http://127.0.0.1:8000/recruiter/applicants/viewapplications/?pageNo=1&perPage=2
applied-time/experience, filter
*/
router.get('/viewapplications/:jobId', [
  checkJwtRecruiter,
  jwtErrorHandler,
  extractEmailPayload,
], async (req, res) => {
  try {
    const { user } = req;
    const { jobId } = req.params;
    let { pageNo, perPage } = req.query;
    pageNo = Math.abs(parseInt(pageNo, 10));
    perPage = Math.abs(parseInt(perPage, 10));

    Application.find({ jobId })
    // .select(['-planType', '-dateOfPurchase', '-dateOfExpiry', '-createdBy', '-updatedBy'])
      .sort([['userExp', -1], ['updatedAt', -1]])
      .limit(perPage)
      .skip(perPage * (pageNo - 1))
      .exec((err, applications) => {
        if (err) {
          recruiterAppLogger('error', `Error in viewing applications by ${user} Error: ${err}`);
          return res.json({
            status: 'FAILURE',
            payload: {},
            message: {
              code: '500',
              details: 'Not able to view applications server error',
            },
          });
        }
        const totalApplications = applications.length;
        const totalPages = Math.ceil(totalApplications / perPage);
        recruiterAppLogger('info', `applications viewed by ${user} successfully`);
        res.json({
          status: 'SUCCESS',
          payload: { applications, totalPages, totalApplications },
          message: {
            code: '200',
            details: 'applications viewed successfully',
          },
        });
      });
  } catch (err) {
    recruiterAppLogger('error', `Error occured while viewing applications; Error: ${err.message}`);
    res.json({
      status: 'FAILURE',
      payload: {},
      message: {
        code: '500',
        details: 'Not able to view applications server error',
      },
    });
  }
});

/* View one Application by Recruiter after login-in
http://127.0.0.1:8000/recruiter/applicants/viewapplication/617295174a65f8bf77a55252
applied-time/experience, filter
*/
router.get('/viewapplication/:id', [
  checkJwtRecruiter,
  jwtErrorHandler,
  extractEmailPayload,
], async (req, res) => {
  try {
    const { user } = req;
    const { id } = req.params;

    Application.findById(id)
      .exec((err, application) => {
        if (err) {
          recruiterAppLogger('error', `Error in viewing application ${id} by ${user} Error: ${err}`);
          return res.json({
            status: 'FAILURE',
            payload: {},
            message: {
              code: '500',
              details: 'Not able to view application server error',
            },
          });
        }
        recruiterAppLogger('info', `application ${id} viewed by ${user} successfully`);
        res.json({
          status: 'SUCCESS',
          payload: { application },
          message: {
            code: '200',
            details: 'application viewed successfully',
          },
        });
      });
  } catch (err) {
    recruiterAppLogger('error', `Error occured while viewing application; Error: ${err.message}`);
    res.json({
      status: 'FAILURE',
      payload: {},
      message: {
        code: '500',
        details: 'Not able to view application server error',
      },
    });
  }
});

module.exports = router;
