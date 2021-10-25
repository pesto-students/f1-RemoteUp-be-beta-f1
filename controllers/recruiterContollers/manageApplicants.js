/* eslint-disable no-underscore-dangle */
/* eslint-disable consistent-return */
// Update Applicant Status
// Add a Note for Applicant
// View all Applicants with sort applied-time/experience, pagination, filter
// View one Application
// Get total Apllications on Recruiter's jobs

const express = require('express');
const { check } = require('express-validator');
const { checkJwtRecruiter, jwtErrorHandler } = require('../../middleware/authMiddleware');
const extractEmailPayload = require('../../middleware/userEmailMiddleware');
const Application = require('../../models/ApplicationModel');
const Job = require('../../models/JobModel');
const { validationErrorCheck } = require('../commonController');
const { recruiterAppLogger } = require('../../utils/logger');
const { notifyUserStatusChange } = require('../notificationControllers/notificationUtils');
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

    if (application.applicationStatus === status) {
      return res.json({
        status: 'FAILURE',
        payload: {},
        message: {
          code: '400',
          details: `Application is already at same status ${status}`,
        },
      });
    }

    application.statusUpdatedBy = user;
    application.applicationStatus = status;
    await application.save();

    notifyUserStatusChange(status, job, application);

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

/* Get total Application on Recruiter's all jobs posted in 30 days after login-in
http://127.0.0.1:8000/recruiter/applicants/gettotalapplication
*/
router.get('/gettotalapplication', [
  checkJwtRecruiter,
  jwtErrorHandler,
  extractEmailPayload,
], async (req, res) => {
  try {
    const { user } = req;

    const date = new Date();
    date.setDate(date.getDate() - 30);
    date.setHours(0, 0, 0, 0);

    Job.find({ createdBy: user.toLowerCase() }, { _id: 1 }, (err, jobs) => {
      if (!err) {
        const ids = jobs.map((job) => job._id);

        Application.find({ jobId: { $in: ids }, createdAt: { $gt: date } })
          .exec((errApp, application) => {
            if (errApp) {
              recruiterAppLogger('error', `Error in getting applications count by ${user} Error: ${err}`);
              return res.json({
                status: 'FAILURE',
                payload: {},
                message: {
                  code: '500',
                  details: 'Not able to get applications count server error',
                },
              });
            }
            const totalApplication = application.length;
            recruiterAppLogger('info', `applications count generated by ${user} successfully`);
            res.json({
              status: 'SUCCESS',
              payload: { totalApplication },
              message: {
                code: '200',
                details: 'applications count generated successfully',
              },
            });
          });
      }
    });
  } catch (err) {
    recruiterAppLogger('error', `Error occured while getting applications count; Error: ${err.message}`);
    res.json({
      status: 'FAILURE',
      payload: {},
      message: {
        code: '500',
        details: 'Not able to get applications count, server error',
      },
    });
  }
});

module.exports = router;
