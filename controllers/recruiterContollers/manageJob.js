/* eslint-disable consistent-return */
// Post a Job
// Edit a Job
// Activate/Deactivate a Job
// Delete a Job
// View a Job
// View all Jobs Posted
// Renew a Job Post

const express = require('express');
const { check } = require('express-validator');
const { checkJwtRecruiter, jwtErrorHandler } = require('../../middleware/authMiddleware');
const extractEmailPayload = require('../../middleware/userEmailMiddleware');
const Job = require('../../models/JobModel');
const { validationErrorCheck } = require('../commonController');
const { recruiterAppLogger } = require('../../utils/logger');
const {
  SFW_DEV, CUST_SERV, MKT, FT, PT, ATS, URL, ONE_MONTH, TWO_MONTH, THREE_MONTH, SIX_MONTH,
} = require('../../utils/constants');

const router = express.Router();

/* Post a Job by Recruiter after login-in
http://127.0.0.1:8000/recruiter/job/postjob
request body: {{
    "position": "Sr. Software Engineer",
    "category": "Software Development",
    "jobType": "Full-Time",
    "salary": "",
    "candidateRegion": "",
    "applyType": "URL",
    "applyURL": "abc@xyz.com",
    "jobDessription": "Lorem ipsum dolor sit amet",
    "companyName": "ABC CO.",
    "companyWebsite": "https://www.abccompany.com",
    "companyTagline": "Lorem ipsum dolor sit amet",
    "companyLogo": "https://www.xyz.com/file/",
    "companyAbout": "Lorem ipsum dolor sit amet",
    "plan": "3-month",
}} */
router.post('/postjob', [
  checkJwtRecruiter,
  jwtErrorHandler,
  extractEmailPayload,
  check('position', 'Please add position').notEmpty(),
  check('category', 'Please add category').isIn([SFW_DEV, CUST_SERV, MKT]),
  check('jobType', 'Invalid Job type').isIn([FT, PT]),
  check('salary', 'Please add valid salary').optional().isNumeric(),
  check('candidateRegion', 'Please add valid candidate region').optional().notEmpty(),
  check('applyType', 'Invalid apply type').isIn([ATS, URL]),
  check('applyURL', 'Invalid URL').optional().isURL(),
  check('jobDescription', 'Please add job description').notEmpty(),
  check('companyName', 'Please add company name').notEmpty(),
  check('companyWebsite', 'Invalid URL').isURL(),
  check('companyTagline', 'Invalid company tagline').optional().notEmpty(),
  check('companyLogo', 'Please attach company logo').isURL(), // BE should store image
  check('companyAbout', 'Invalid company about').optional().notEmpty(),
  check('plan', 'Invalid plan').isIn([ONE_MONTH, TWO_MONTH, THREE_MONTH, SIX_MONTH]),
], async (req, res) => {
  try {
    validationErrorCheck(req, res, 'postjob');
    const { user } = req;
    const {
      position, category, jobType, salary, candidateRegion, applyType, jobDescription,
      companyName, companyWebsite, companyTagline, companyLogo, companyAbout,
      plan,
    } = req.body;

    let { applyURL } = req.body;

    if (applyType === 'ATS') {
      applyURL = '';
    }

    const job = new Job({
      position,
      category,
      jobType,
      salary,
      candidateRegion,
      applyType,
      applyURL,
      jobDescription,
      companyName,
      companyWebsite,
      companyTagline,
      companyLogo,
      companyAbout,
      plan,
      createdBy: user,
    });

    const jobData = await job.save();
    recruiterAppLogger('debug', `Job with position ${position} posted successfully by ${job.createdBy}`);
    res.json({
      status: 'SUCCESS',
      payload: { jobData },
      message: {
        code: '200',
        details: 'Job posted successfully',
      },
    });
  } catch (err) {
    recruiterAppLogger('error', `Error occured while posting Job; Error: ${err.message}`);
    res.json({
      status: 'FAILURE',
      payload: {},
      message: {
        code: '500',
        details: 'Not able to post job server error',
      },
    });
  }
});

/* Update a Job by ID by Recruiter after login-in
http://127.0.0.1:8000/recruiter/job/editjob/6159622cce9274eec27b3a99
request body: {{
    "position": "Sr. Software Engineer",
    "category": "Software Development",
    "jobType": "Full-Time",
    "salary": "",
    "candidateRegion": "",
    "applyType": "URL",
    "applyURL": "abc@xyz.com",
    "jobDessription": "Lorem ipsum dolor sit amet",
    "companyName": "ABC CO.",
    "companyWebsite": "https://www.abccompany.com",
    "companyTagline": "Lorem ipsum dolor sit amet",
    "companyLogo": "https://www.xyz.com/file/",
    "companyAbout": "Lorem ipsum dolor sit amet",
    "plan": "3-month",
}} */
router.patch('/editjob/:id', [
  checkJwtRecruiter,
  jwtErrorHandler,
  extractEmailPayload,
  check('position', 'Please add position').optional().notEmpty(),
  check('category', 'Please add category').optional().isIn([SFW_DEV, CUST_SERV, MKT]),
  check('jobType', 'Invalid Job type').optional().isIn([FT, PT]),
  check('salary', 'Please add valid salary').optional().isNumeric(),
  check('candidateRegion', 'Please add valid candidate region').optional().notEmpty(),
  check('applyType', 'Invalid apply type').optional().isIn([ATS, URL]),
  check('applyURL', 'Invalid URL').optional().isURL(),
  check('jobDescription', 'Please add job description').optional().notEmpty(),
  check('companyName', 'Please add company name').optional().notEmpty(),
  check('companyWebsite', 'Invalid URL').optional().isURL(),
  check('companyTagline', 'Invalid company tagline').optional().notEmpty(),
  check('companyLogo', 'Please attach company logo').optional().isURL(), // BE should store image
  check('companyAbout', 'Invalid company about').optional().notEmpty(),
  check('plan', 'Invalid plan').optional().isIn([ONE_MONTH, TWO_MONTH, THREE_MONTH, SIX_MONTH]),
], async (req, res) => {
  try {
    validationErrorCheck(req, res, 'editjob');
    const { user } = req;
    const {
      position, category, jobType, salary, candidateRegion, applyType, applyURL, jobDescription,
      companyName, companyWebsite, companyTagline, companyLogo, companyAbout,
      plan,
    } = req.body;

    const job = await Job.findById(req.params.id).catch((err) => {
      if (err) {
        recruiterAppLogger('error', `No Job with ID ${req.params.id} updation a job failed with Error: ${err}`);
        res.json({
          status: 'FAILURE',
          payload: {},
          message: {
            code: '400',
            details: 'No job found to update',
          },
        });
      }
    });

    if (job.createdBy.toLowerCase() !== user) {
      recruiterAppLogger('error', `User not ${user} authorized to update job`);
      res.json({
        status: 'FAILURE',
        payload: {},
        message: {
          code: '500',
          details: 'User not authorized to update job',
        },
      });
    }

    if (position) job.position = position;
    if (category) job.category = category;
    if (jobType) job.jobType = jobType;
    if (salary) job.salary = salary;
    if (candidateRegion) job.candidateRegion = candidateRegion;
    if (applyType) job.applyType = applyType;
    if (applyURL) job.applyURL = applyURL;
    if (jobDescription) job.jobDescription = jobDescription;
    if (companyName) job.companyName = companyName;
    if (companyWebsite) job.companyWebsite = companyWebsite;
    if (companyTagline) job.companyTagline = companyTagline;
    if (companyLogo) job.companyLogo = companyLogo;
    if (companyAbout) job.companyAbout = companyAbout;
    if (plan) job.plan = plan;
    job.updatedBy = user;

    await job.save();
    recruiterAppLogger('debug', `Job with position ${position} updated successfully by ${job.updatedBy}`);
    res.json({
      status: 'SUCCESS',
      payload: {},
      message: {
        code: '200',
        details: 'Job updated successfully',
      },
    });
  } catch (err) {
    recruiterAppLogger('error', `Error occured while updating Job; Error: ${err.message}`);
    res.json({
      status: 'FAILURE',
      payload: {},
      message: {
        code: '500',
        details: 'Not able to update job server error',
      },
    });
  }
});

/* Activate/Deactivate a Job by ID by Recruiter after login-in
http://127.0.0.1:8000/recruiter/job/activatedeactivatejob/6159622cce9274eec27b3a99
*/
router.patch('/activatedeactivatejob/:id', [
  checkJwtRecruiter,
  jwtErrorHandler,
  extractEmailPayload,
], async (req, res) => {
  try {
    const { user } = req;
    const job = await Job.findById(req.params.id).catch((err) => {
      if (err) {
        recruiterAppLogger('error', `No Job with ID ${req.params.id} activate/deactivate a job failed with Error: ${err}`);
        res.json({
          status: 'FAILURE',
          payload: {},
          message: {
            code: '400',
            details: 'No job found to activate/deactivate',
          },
        });
      }
    });

    if (job.createdBy.toLowerCase() !== user) {
      res.json({
        status: 'FAILURE',
        payload: {},
        message: {
          code: '500',
          details: 'User not authorized to update job',
        },
      });
    }

    job.updatedBy = user;
    job.active = !job.active;
    await job.save();
    let msg;
    if (job.active) {
      msg = 'activated';
    } else {
      msg = 'deactivated';
    }
    recruiterAppLogger('debug', `Job with position ${job.position} ${msg} successfully by ${job.updatedBy}`);
    res.json({
      status: 'SUCCESS',
      payload: {},
      message: {
        code: '200',
        details: `Job ${msg} successfully`,
      },
    });
  } catch (err) {
    recruiterAppLogger('error', `Error occured while activating/deactivating Job; Error: ${err.message}`);
    res.json({
      status: 'FAILURE',
      payload: {},
      message: {
        code: '500',
        details: 'Not able to activate/deactivate job server error',
      },
    });
  }
});

/* Delete a Job by ID by Recruiter after login-in
http://127.0.0.1:8000/recruiter/job/deletejob/6159622cce9274eec27b3a99
*/
router.delete('/deletejob/:id', [
  checkJwtRecruiter,
  jwtErrorHandler,
  extractEmailPayload,
], async (req, res) => {
  try {
    const { user } = req;
    const job = await Job.findById(req.params.id).catch((err) => {
      if (err) {
        recruiterAppLogger('error', `No Job with ID ${req.params.id} deleting a job failed with Error: ${err}`);
        res.json({
          status: 'FAILURE',
          payload: {},
          message: {
            code: '400',
            details: 'No job found to delete',
          },
        });
      }
    });

    if (job.createdBy.toLowerCase() !== user) {
      recruiterAppLogger('error', `User not ${user} authorized to update job`);
      res.json({
        status: 'FAILURE',
        payload: {},
        message: {
          code: '500',
          details: 'User not authorized to delete job',
        },
      });
    }

    const dbRes = await job.delete();

    // const job = await Job.findByIdAndDelete(req.params.id).catch((err) => {
    //   if (err) {
    //     return res.json({
    //       status: 'FAILURE',
    //       payload: {},
    //       message: {
    //         code: '400',
    //         details: 'Not job found to delete',
    //       },
    //     });
    //   }
    // });

    recruiterAppLogger('debug', `Job with ID ${req.params.id} deleted successfully by ${user}`);
    res.json({
      status: 'SUCCESS',
      payload: { dbRes },
      message: {
        code: '200',
        details: 'Job deleted successfully',
      },
    });

    res.json({
      status: 'FAILURE',
      payload: {},
      message: {
        code: '400',
        details: 'No job found to delete',
      },
    });
  } catch (err) {
    recruiterAppLogger('error', `Error occured while deleting Job; Error: ${err.message}`);
    res.json({
      status: 'FAILURE',
      payload: {},
      message: {
        code: '500',
        details: 'Not able to delete job server error',
      },
    });
  }
});

/* View a Job by Recruiter after login-in
http://127.0.0.1:8000/recruiter/job/viewjob/615af78f535b7cc7a1fd0eee
*/
router.get('/viewjob/:id', [
  checkJwtRecruiter,
  jwtErrorHandler,
  extractEmailPayload,
], async (req, res) => {
  try {
    const { user } = req;
    const jobData = await Job.findById(req.params.id).catch((err) => {
      if (err) {
        recruiterAppLogger('error', `No Job with ID ${req.params.id} view a job failed with Error: ${err}`);
        res.json({
          status: 'FAILURE',
          payload: {},
          message: {
            code: '400',
            details: 'No job found to view',
          },
        });
      }
    });

    if (jobData.createdBy.toLowerCase() !== user) {
      recruiterAppLogger('error', `User ${user} not authorized to view job`);
      res.json({
        status: 'FAILURE',
        payload: {},
        message: {
          code: '500',
          details: 'User not authorized to view job',
        },
      });
    }

    recruiterAppLogger('debug', `Job with ID ${jobData.id} viewed successfully by ${jobData.createdBy}`);
    res.json({
      status: 'SUCCESS',
      payload: { jobData },
      message: {
        code: '200',
        details: 'Job posted successfully',
      },
    });
  } catch (err) {
    recruiterAppLogger('error', `Error occured while updating Job; Error: ${err.message}`);
    res.json({
      status: 'FAILURE',
      payload: {},
      message: {
        code: '500',
        details: 'Not able to post job server error',
      },
    });
  }
});

/* View all Job by Recruiter after login-in
http://127.0.0.1:8000/recruiter/job/viewjobs
*/
router.get('/viewjobs', [
  checkJwtRecruiter,
  jwtErrorHandler,
  extractEmailPayload,
], async (req, res) => {
  try {
    const { user } = req;
    let { pageNo, perPage } = req.query;
    pageNo = Math.abs(parseInt(pageNo, 10));
    perPage = Math.abs(parseInt(perPage, 10));

    const totalJobs = await Job.find({ createdBy: user }).count();
    const totalPages = Math.ceil(totalJobs / perPage);

    const jobData = await Job.find({ createdBy: user })
      .limit(perPage)
      .skip(perPage * (pageNo - 1))
      .catch((err) => {
        if (err) {
          recruiterAppLogger('error', `Error in viewing jobs Error: ${err}`);
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

    recruiterAppLogger('debug', `Jobs viewed successfully by ${user}`);
    res.json({
      status: 'SUCCESS',
      payload: { jobData, totalPages },
      message: {
        code: '200',
        details: 'Job viewed successfully',
      },
    });
  } catch (err) {
    recruiterAppLogger('error', `Error occured while viewing Job; Error: ${err.message}`);
    res.json({
      status: 'FAILURE',
      payload: {},
      message: {
        code: '500',
        details: 'Not able to post job server error',
      },
    });
  }
});

module.exports = router;
