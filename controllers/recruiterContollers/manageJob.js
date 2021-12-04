/* eslint-disable no-underscore-dangle */
/* eslint-disable consistent-return */
// Post a Job
// Edit a Job
// Activate/Deactivate a Job
// Delete a Job
// View all Jobs Posted
// Renew a Job Post

const express = require('express');
const { check } = require('express-validator');
const stripe = require("stripe")(
  "sk_test_51JpykoSAQwW5QLe0DswGhxeNsXnLgMOnFNhJYT9WBWYrFuwfAhgRhGXxV0Deu578EZFgikfQakRF0ZKpVrifOsoC00jSYxUKI3"
);
const { checkJwtRecruiter, jwtErrorHandler } = require('../../middleware/authMiddleware');
const extractEmailPayload = require('../../middleware/userEmailMiddleware');
const Job = require('../../models/JobModel');
const { validationErrorCheck, getLast30Applications } = require('../commonController');
const { recruiterAppLogger } = require('../../utils/logger');
const {
  SFW_DEV, CUST_SERV, MKT, FT, PT, INTERN, ATS, URL, EMAIL,
  ONE_MONTH, TWO_MONTH, THREE_MONTH, SIX_MONTH,
} = require('../../utils/constants');

const router = express.Router();

/* Post a Job by Recruiter after login-in
http://127.0.0.1:8000/recruiter/job/postjob
request body: {
    "position": "Sr. Software Engineer",
    "category": "Software Development",
    "jobType": "Full-Time",
    "salary": "",
    "candidateRegion": "",
    "applyType": "URL",
    "applyValue": "abc@xyz.com",
    "jobDescription": "Lorem ipsum dolor sit amet",
    "jobDescriptionState": {"name": "something", "add": "lorem"},
    "companyName": "ABC CO.",
    "companyWebsite": "https://www.abccompany.com",
    "companyTagline": "Lorem ipsum dolor sit amet",
    "companyLogo": "https://www.xyz.com/file/",
    "companyDescriptionState": {"name": "something", "add": "lorem"},
    "logoFile": {"name": "File1", "size": "123Kb"},
    "companyDescription": "Lorem ipsum dolor sit amet",
    "planType": "3 Month",
} */
router.post('/postjob', [
  checkJwtRecruiter,
  jwtErrorHandler,
  extractEmailPayload,
  check('position', 'Please add position').notEmpty(),
  check('category', 'Please add category').isIn([SFW_DEV, CUST_SERV, MKT]),
  check('jobType', 'Invalid Job type').isIn([FT, PT, INTERN]),
  // check('salary', 'Please add valid salary').optional().isNumeric(),
  // check('candidateRegion', 'Please add valid candidate region').optional().notEmpty(),
  check('applyType', 'Invalid apply type').isIn([ATS, URL, EMAIL]),
  // check('applyValue', 'Invalid URL').optional().isURL(),
  check('jobDescription', 'Please add job description').notEmpty(),
  check('companyName', 'Please add company name').notEmpty(),
  check('companyWebsite', 'Invalid URL').isURL(),
  // check('companyTagline', 'Invalid company tagline').optional().notEmpty(),
  check('companyLogo', 'Please attach company logo').notEmpty(), // .isURL(), // BE should store image
  // check('companyDescription', 'Invalid company about').optional().notEmpty(),
  check('planType', 'Invalid planType').isIn([ONE_MONTH, TWO_MONTH, THREE_MONTH]),
], async (req, res) => {
  try {
    validationErrorCheck(req, res, 'postjob');
    const { user } = req;
    const {
      position, category, jobType, salary, candidateRegion, applyType, jobDescription,
      companyName, companyWebsite, companyTagline, companyLogo, logoFile, companyDescription,
      planType, jobDescriptionState, companyDescriptionState,
    } = req.body;

    let { applyValue } = req.body;

    if (applyType === 'ATS') {
      applyValue = '';
    }

    const planInMonths = Number(planType.split(' ')[0]);
    const planIndays = 30 * planInMonths + 1;
    const dateOfExpiry = new Date();
    dateOfExpiry.setDate(dateOfExpiry.getDate() + planIndays);
    dateOfExpiry.setHours(0, 0, 0, 0);

    const job = new Job({
      position,
      category,
      jobType,
      salary,
      candidateRegion,
      applyType,
      applyValue,
      jobDescription,
      companyName,
      companyWebsite,
      companyTagline,
      companyLogo,
      logoFile,
      companyDescription,
      planType,
      jobDescriptionState,
      companyDescriptionState,
      dateOfExpiry,
      createdBy: user,
    });

    const jobData = await job.save();
    recruiterAppLogger('debug', `Job with position ${position} posted successfully by ${job.createdBy}`);
    
    let price;
    if (jobData.planType === "1 Month") {
      price = 19900;
    } else if (jobData.planType === "2 Month") {
      price = 29900;
    } else {
      price = 39900;
    }
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      customer_email: user,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: jobData.position,
              description:
                "Plan: " + jobData.planType + " JobID: " + jobData._id,
            },
            unit_amount: price,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `https://remote-up.netlify.app/dashboard?session_id={CHECKOUT_SESSION_ID}&job_id=${jobData._id}`,
      cancel_url: `https://remote-up.netlify.app/dashboard?session_id={CHECKOUT_SESSION_ID}&job_id=${jobData._id}`,
    });
  
    res.json({
      status: "SUCCESS",
      payload: { jobData },
      message: {
        sessionURL: session.url,
        sessionID: session.id,
        code: "200",
        details: "Job posted successfully",
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
request body: {
    "position": "Sr. Software Engineer",
    "category": "Software Development",
    "jobType": "Full-Time",
    "salary": "",
    "candidateRegion": "",
    "applyType": "URL",
    "applyValue": "abc@xyz.com",
    "jobDescription": "Lorem ipsum dolor sit amet",
    "jobDescriptionState": {"name": "something", "add": "lorem"},
    "companyName": "ABC CO.",
    "companyWebsite": "https://www.abccompany.com",
    "companyTagline": "Lorem ipsum dolor sit amet",
    "companyLogo": "https://www.xyz.com/file/",
    "companyDescriptionState": {"name": "something", "add": "lorem"},
    "logoFile": {"name": "File1", "size": "123Kb"},
    "companyDescription": "Lorem ipsum dolor sit amet",
    "planType": "3-month",
} */
router.patch('/editjob/:id', [
  checkJwtRecruiter,
  jwtErrorHandler,
  extractEmailPayload,
  check('position', 'Please add position').optional().notEmpty(),
  check('category', 'Please add category').optional().isIn([SFW_DEV, CUST_SERV, MKT]),
  check('jobType', 'Invalid Job type').optional().isIn([FT, PT]),
  // check('salary', 'Please add valid salary').optional().isNumeric(),
  // check('candidateRegion', 'Please add valid candidate region').optional().notEmpty(),
  check('applyType', 'Invalid apply type').optional().isIn([ATS, URL]),
  // check('applyValue', 'Invalid URL').optional().isURL(),
  check('jobDescription', 'Please add job description').optional().notEmpty(),
  check('companyName', 'Please add company name').optional().notEmpty(),
  check('companyWebsite', 'Invalid URL').optional().isURL(),
  // check('companyTagline', 'Invalid company tagline').optional().notEmpty(),
  check('companyLogo', 'Please attach company logo').optional().isURL(), // BE should store image
  // check('companyDescription', 'Invalid company about').optional().notEmpty(),
  // check('planType', 'Invalid planType').optional().isIn([ONE_MONTH, TWO_MONTH, THREE_MONTH, SIX_MONTH]),
], async (req, res) => {
  try {
    validationErrorCheck(req, res, 'editjob');
    const { user } = req;
    const {
      position, category, jobType, salary, candidateRegion, applyType, applyValue, jobDescription,
      companyName, companyWebsite, companyTagline, companyLogo, logoFile, companyDescription,
      jobDescriptionState, companyDescriptionState,
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
    if (applyValue) job.applyValue = applyValue;
    if (jobDescription) job.jobDescription = jobDescription;
    if (companyName) job.companyName = companyName;
    if (companyWebsite) job.companyWebsite = companyWebsite;
    if (companyTagline) job.companyTagline = companyTagline;
    if (companyLogo) job.companyLogo = companyLogo;
    if (logoFile) job.logoFile = logoFile;
    if (companyDescription) job.companyDescription = companyDescription;
    // if (planType) job.planType = planType;
    if (jobDescriptionState) job.jobDescriptionState = jobDescriptionState;
    if (companyDescriptionState) job.companyDescriptionState = companyDescriptionState;
    job.updatedBy = user;

    await job.save();
    recruiterAppLogger('debug', `Job with position ${job.position} updated successfully by ${job.updatedBy}`);
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
    pageNo = Math.abs(parseInt(pageNo, 10)) || 1;
    perPage = Math.abs(parseInt(perPage, 10)) || 1000;

    const totalActiveJobs = await Job.find({ createdBy: user, active: true }).count();

    const totalJobs = await Job.find({ createdBy: user }).count();
    const totalPages = Math.ceil(totalJobs / perPage);

    const jobData = await Job.find({ createdBy: user },
      "_id position category jobType planType applyType createdAt applications")
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

    const totalApplication = await getLast30Applications(user);

    recruiterAppLogger('debug', `Jobs viewed successfully by ${user}`);
    res.json({
      status: 'SUCCESS',
      payload: {
        jobData, totalPages, totalActiveJobs, totalApplication,
      },
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

/* Renew a Job by ID by Recruiter after login-in
http://127.0.0.1:8000/recruiter/job/renewjob/6159622cce9274eec27b3a99
request body: {
    "planType": "3-month",
} */
router.patch('/renewjob/:id', [
  checkJwtRecruiter,
  jwtErrorHandler,
  extractEmailPayload,
], async (req, res) => {
  try {
    const { user } = req;
    const { planType } = req.body;
    const job = await Job.findById(req.params.id).catch((err) => {
      if (err) {
        recruiterAppLogger('error', `No Job with ID ${req.params.id} renew a job failed with Error: ${err}`);
        res.json({
          status: 'FAILURE',
          payload: {},
          message: {
            code: '400',
            details: 'No job found to renew',
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
          details: 'User not authorized to renew job',
        },
      });
    }

    const { dateOfExpiry } = job;

    const planInMonths = Number(planType.split(' ')[0]);
    const planIndays = 30 * planInMonths + 1;
    const newDateOfExpiry = dateOfExpiry;
    newDateOfExpiry.setDate(newDateOfExpiry.getDate() + planIndays);
    newDateOfExpiry.setHours(0, 0, 0, 0);

    await Job.findByIdAndUpdate(job._id, {
      active: true,
      updatedBy: user,
      planType,
      dateOfExpiry: newDateOfExpiry,
      dateOfPurchase: new Date(),
    });

    recruiterAppLogger('debug', `Job with position ${job.position} Renewed successfully by ${job.updatedBy}`);
    res.json({
      status: 'SUCCESS',
      payload: {},
      message: {
        code: '200',
        details: 'Job Renewed successfully',
      },
    });
  } catch (err) {
    recruiterAppLogger('error', `Error occured while renewing Job; Error: ${err.message}`);
    res.json({
      status: 'FAILURE',
      payload: {},
      message: {
        code: '500',
        details: 'Not able to renew job server error',
      },
    });
  }
});

module.exports = router;
