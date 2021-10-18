/* eslint-disable consistent-return */
// View all Jobs with Search and Filter
// Summury of all jobs
// Save/Un-Save a Job
// Apply a Job
// View Applied Jobs
// View saved Jobs

const express = require('express');
const { check } = require('express-validator');
const { checkJwtJobSeeker, jwtErrorHandler } = require('../../middleware/authMiddleware');
const extractEmailPayload = require('../../middleware/userEmailMiddleware');
const Job = require('../../models/JobModel');
const User = require('../../models/UserModel');
const Application = require('../../models/ApplicationModel');
const { saveUser } = require('../commonController');
const { validationErrorCheck } = require('../commonController');
const { jobSeekerAppLogger } = require('../../utils/logger');
const {
  APPLIED, REJECTED, L1, L2, HR, SELECTED,
} = require('../../utils/constants');

const router = express.Router();

/* View all category wise Jobs by Job-Seeker after login-in
http://127.0.0.1:8000/jobseeker/job/viewjobs/Software Development/?pageNo=1&perPage=2&searchKey=software
*/
router.get('/viewjobs/:category/', [
  checkJwtJobSeeker,
  jwtErrorHandler,
  extractEmailPayload,
], async (req, res) => {
  try {
    const { user } = req;
    let { pageNo, perPage, searchKey } = req.query;
    pageNo = Math.abs(parseInt(pageNo, 10));
    perPage = Math.abs(parseInt(perPage, 10));
    const { category } = req.params;

    let totalJobs;
    let jobData;
    if (searchKey) {
      searchKey = searchKey.toLowerCase();
      const filterQuery = {
        active: true,
        category,
        $or: [{ position: { $regex: new RegExp(`${searchKey}`, 'i') } },
          { companyName: { $regex: new RegExp(`${searchKey}`, 'i') } }],
      };

      totalJobs = await Job.find(filterQuery).count();
      jobData = await Job.find(filterQuery)
        .select(['-plan', '-dateOfPurchase', '-dateOfExpiry', '-createdBy', '-updatedBy', 'applications'])
        .sort([['updatedAt', -1]]).limit(perPage)
        .skip(perPage * (pageNo - 1))
        .catch((err) => {
          if (err) {
            jobSeekerAppLogger('error', `Error in viewing jobs Error: ${err}`);
            res.json({
              status: 'FAILURE',
              payload: {},
              message: {
                code: '400',
                details: 'Error in viewing jobs',
              },
            });
          }
        });
    } else {
      totalJobs = await Job.find({ active: true, category }).count();
      jobData = await Job.find({ active: true, category })
        .select(['-plan', '-dateOfPurchase', '-dateOfExpiry', '-createdBy', '-updatedBy'])
        .limit(perPage)
        .skip(perPage * (pageNo - 1))
        .catch((err) => {
          if (err) {
            jobSeekerAppLogger('error', `Error in viewing jobs Error: ${err}`);
            res.json({
              status: 'FAILURE',
              payload: {},
              message: {
                code: '400',
                details: 'Error in viewing jobs',
              },
            });
          }
        });
    }

    const totalPages = Math.ceil(totalJobs / perPage);

    jobSeekerAppLogger('debug', `Jobs viewed successfully by ${user}`);
    res.json({
      status: 'SUCCESS',
      payload: { jobData, totalPages },
      message: {
        code: '200',
        details: 'Job viewed successfully',
      },
    });
  } catch (err) {
    jobSeekerAppLogger('error', `Error occured while viewing Jobs; Error: ${err.message}`);
    res.json({
      status: 'FAILURE',
      payload: {},
      message: {
        code: '500',
        details: 'Not able to view job server error',
      },
    });
  }
});

/* View Summury of Jobs by Job-Seeker without login-in
http://127.0.0.1:8000/jobseeker/job/homejobs
*/
router.get('/homejobs', [
  // checkJwtJobSeeker,
  // extractEmailPayload,
], async (req, res) => {
  try {
    const jobData = await Job.aggregate(
      [
        { $match: { active: true } },
        { $sort: { category: 1, createdAt: -1 } },
        {
          $project: {
            plan: 0,
            dateOfPurchase: 0,
            dateOfExpiry: 0,
            createdBy: 0,
            applications: 0,
          },
        },
        {
          $group: {
            _id: '$category',
            docs: { $push: '$$ROOT' },
          },
        },
        {
          $project: {
            jobs: {
              $slice: ['$docs', 3],
            },
          },
        },
      ],
    )
      .catch((err) => {
        if (err) {
          jobSeekerAppLogger('error', `Error in viewing jobs Error: ${err}`);
          res.json({
            status: 'FAILURE',
            payload: {},
            message: {
              code: '400',
              details: 'Error in viewing jobs',
            },
          });
        }
      });

    // jobSeekerAppLogger('debug', `Jobs viewed successfully by ${user}`);
    res.json({
      status: 'SUCCESS',
      payload: { jobData },
      message: {
        code: '200',
        details: 'Job viewed successfully',
      },
    });
  } catch (err) {
    jobSeekerAppLogger('error', `Error occured while viewing Jobs; Error: ${err.message}`);
    res.json({
      status: 'FAILURE',
      payload: {},
      message: {
        code: '500',
        details: 'Not able to view job server error',
      },
    });
  }
});

/* Save/Unsave a Job by ID by Job-seeker after login-in
http://127.0.0.1:8000/jobseeker/job/saveunsavejob/6159622cce9274eec27b3a99
*/
router.patch('/saveunsavejob/:id', [
  checkJwtJobSeeker,
  jwtErrorHandler,
  extractEmailPayload,
], async (req, res) => {
  try {
    const { user } = req;
    const jobId = req.params.id;
    const job = await Job.findById(jobId).catch((err) => {
      if (err) {
        jobSeekerAppLogger('error', `No Job with ID ${jobId} save/unsave a job failed with Error: ${err}`);
        return res.json({
          status: 'FAILURE',
          payload: {},
          message: {
            code: '400',
            details: 'No job found to save/unsave',
          },
        });
      }
    });

    const userObject = await saveUser(user);
    const isJobIdPresent = userObject.savedJobs.includes(jobId);
    let msg;
    if (isJobIdPresent) {
      userObject.savedJobs.pull(jobId);
      await userObject.save();
      msg = 'unsaved';
    } else {
      userObject.savedJobs.push(jobId);
      await userObject.save();
      msg = 'saved';
    }
    jobSeekerAppLogger('debug', `Job with position ${job.position} ${msg} successfully by ${user}`);
    res.json({
      status: 'SUCCESS',
      payload: { saved: !isJobIdPresent },
      message: {
        code: '200',
        details: `Job ${msg} successfully`,
      },
    });
  } catch (err) {
    jobSeekerAppLogger('error', `Error occured while save/unsave Job; Error: ${err.message}`);
    res.json({
      status: 'FAILURE',
      payload: {},
      message: {
        code: '500',
        details: 'Not able to save/unsave job server error',
      },
    });
  }
});

/* Apply for a Job by ID by Job-seeker after login-in
http://127.0.0.1:8000/jobseeker/job/applyjob/6159622cce9274eec27b3a99
*/
router.patch('/applyjob/:id', [
  // checkJwtJobSeeker,
  // jwtErrorHandler,
  // extractEmailPayload,
  check('userFName', 'Please add First Name').notEmpty(),
  check('userLName', 'Please add Last Name').notEmpty(),
  check('userContact', 'Please add valid Contact Number').isNumeric(),
  check('userExp', 'Please add valid Experience').isNumeric(),
  check('userLinkedIn', 'Invalid LinkedIn URL').optional().isURL(),
  check('userGitHub', 'Invalid GitHub URL').optional().isURL(),
  check('userPortfolio', 'Invalid Portfolio URL').optional().isURL(),
  check('userWebsite', 'Invalid Website URL').optional().isURL(),
], async (req, res) => {
  try {
    validationErrorCheck(req, res, 'applyjob');
    // const { user } = req;
    const user = "mbhupendrads@gmail.com";
    const jobId = req.params.id;
    const userDetails = req.body;
    const job = await Job.findById(jobId).catch((err) => {
      if (err) {
        jobSeekerAppLogger('error', `No Job with ID ${jobId} save/unsave a job failed with Error: ${err}`);
        res.json({
          status: 'FAILURE',
          payload: {},
          message: {
            code: '400',
            details: 'No job found to save/unsave',
          },
        });
      }
    });

    const userObject = await saveUser(user, userDetails);
    const isJobApplied = userObject.appliedJobs.includes(jobId);
    const isJobActive = job.active;
    if (isJobApplied || !isJobActive) {
      return res.json({
        status: 'FAILURE',
        payload: {},
        message: {
          code: '400',
          details: 'Already applied this job or not active job',
        },
      });
    }

    const application = new Application({
      userId: user.toLowerCase(),
      jobId,
      // resume,
      applicationStatus: APPLIED,
      statusUpdatedBy: user.toLowerCase(),
    });
    await application.save();

    job.applications.push(application.id);
    await job.save();

    userObject.appliedJobs.push(jobId);
    await userObject.save();

    jobSeekerAppLogger('debug', `Job with id ${jobId} applied successfully by ${user}`);
    res.json({
      status: 'SUCCESS',
      payload: { },
      message: {
        code: '200',
        details: 'Job applied successfully',
      },
    });
  } catch (err) {
    jobSeekerAppLogger('error', `Error occured while applying Job; Error: ${err.message}`);
    res.json({
      status: 'FAILURE',
      payload: {},
      message: {
        code: '500',
        details: 'Not able to apply job server error',
      },
    });
  }
});

/* View all saved Jobs by Job-Seeker after login-in
http://127.0.0.1:8000/jobseeker/job/viewsavedjobs/?pageNo=1&perPage=2&searchKey=software
*/
router.get('/viewsavedjobs/', [
  checkJwtJobSeeker,
  jwtErrorHandler,
  extractEmailPayload,
], async (req, res) => {
  try {
    const { user } = req;
    let { pageNo, perPage, searchKey } = req.query;
    pageNo = Math.abs(parseInt(pageNo, 10));
    perPage = Math.abs(parseInt(perPage, 10));

    let filterQuery;
    if (searchKey) {
      searchKey = searchKey.toLowerCase();
      filterQuery = {
        active: true,
        $or: [{ position: { $regex: new RegExp(`${searchKey}`, 'i') } },
          { companyName: { $regex: new RegExp(`${searchKey}`, 'i') } }],
      };
    } else {
      filterQuery = {};
    }

    const totalJobsQuery = await User.findOne({ userId: user });
    const totalJobs = totalJobsQuery.savedJobs.length;
    User.findOne({ userId: user })
      .populate({
        path: 'savedJobs',
        options: {
          sort: { createdAt: -1 },
          limit: perPage,
          skip: perPage * (pageNo - 1),
        },
        select: {
          plan: 0,
          dateOfPurchase: 0,
          dateOfExpiry: 0,
          createdBy: 0,
          applications: 0,
        },
        match: filterQuery,
      })
      .exec((err, jobs) => {
        if (err) {
          res.json({
            status: 'FAILURE',
            payload: {},
            message: {
              code: '500',
              details: 'Not able to view saved jobs server error',
            },
          });
        }
        const totalPages = Math.ceil(totalJobs / perPage);

        jobSeekerAppLogger('debug', `Saved Jobs viewed successfully by ${user}`);
        res.json({
          status: 'SUCCESS',
          payload: { jobData: jobs.savedJobs, totalPages },
          message: {
            code: '200',
            details: 'Saved Job viewed successfully',
          },
        });
      });
  } catch (err) {
    jobSeekerAppLogger('error', `Error occured while viewing saved Jobs; Error: ${err.message}`);
    res.json({
      status: 'FAILURE',
      payload: {},
      message: {
        code: '500',
        details: 'Not able to view saved job server error',
      },
    });
  }
});

/* View all category wise Jobs by Job-Seeker after login-in
http://127.0.0.1:8000/jobseeker/job/viewappliedjobs/?pageNo=1&perPage=2&searchKey=software
*/
router.get('/viewappliedjobs/', [
  checkJwtJobSeeker,
  jwtErrorHandler,
  extractEmailPayload,
], async (req, res) => {
  try {
    const { user } = req;
    let { pageNo, perPage, searchKey } = req.query;
    pageNo = Math.abs(parseInt(pageNo, 10));
    perPage = Math.abs(parseInt(perPage, 10));

    let filterQuery;
    if (searchKey) {
      searchKey = searchKey.toLowerCase();
      filterQuery = {
        active: true,
        $or: [{ position: { $regex: new RegExp(`${searchKey}`, 'i') } },
          { companyName: { $regex: new RegExp(`${searchKey}`, 'i') } }],
      };
    } else {
      filterQuery = {};
    }

    const totalJobsQuery = await User.findOne({ userId: user });
    const totalJobs = totalJobsQuery.appliedJobs.length;
    User.findOne({ userId: user })
      .populate({
        path: 'appliedJobs',
        options: {
          sort: { createdAt: -1 },
          limit: perPage,
          skip: perPage * (pageNo - 1),
        },
        select: {
          plan: 0,
          dateOfPurchase: 0,
          dateOfExpiry: 0,
          createdBy: 0,
          applications: 0,
        },
        match: filterQuery,
      })
      .exec((err, jobs) => {
        if (err) {
          res.json({
            status: 'FAILURE',
            payload: {},
            message: {
              code: '500',
              details: 'Not able to view applied job server error',
            },
          });
        }
        const totalPages = Math.ceil(totalJobs / perPage);

        jobSeekerAppLogger('debug', `Applied Jobs viewed successfully by ${user}`);
        res.json({
          status: 'SUCCESS',
          payload: { jobData: jobs.appliedJobs, totalPages },
          message: {
            code: '200',
            details: 'Applied Job viewed successfully',
          },
        });
      });
  } catch (err) {
    jobSeekerAppLogger('error', `Error occured while viewing applied Jobs; Error: ${err.message}`);
    res.json({
      status: 'FAILURE',
      payload: {},
      message: {
        code: '500',
        details: 'Not able to view applied job server error',
      },
    });
  }
});

module.exports = router;
