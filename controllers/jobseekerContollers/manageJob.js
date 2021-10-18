// View all Jobs with Search and Filter
// Summury of all jobs
// Save/Un-Save a Job
// Apply a Job
// View Applied Jobs

const express = require('express');
// const { check } = require('express-validator');
const { checkJwtJobSeeker } = require('../../middleware/authMiddleware');
const extractEmailPayload = require('../../middleware/userEmailMiddleware');
const Job = require('../../models/JobModel');
// const validationErrorCheck = require('../commonController');
const { jobSeekerAppLogger } = require('../../utils/logger');
// const {
//   SFW_DEV, CUST_SERV, MKT, FT, PT, ATS, URL, ONE_MONTH, THREE_MONTH, SIX_MONTH, ONE_YEAR,
// } = require('../../utils/constants');

const router = express.Router();

/* View all category wise Jobs by Job-Seeker after login-in
http://127.0.0.1:8000/jobseeker/job/viewjobs/Software Development/?pageNo=1&perPage=2&searchKey=software
*/
router.get('/viewjobs/:category/', [
  checkJwtJobSeeker,
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
      jobData = await Job.find(filterQuery).sort([['updatedAt', -1]]).limit(perPage)
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
        details: 'Not able to post job server error',
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
          $group: {
            _id: '$category',
            docs: { $push: '$$ROOT' },
          },
        },
        {
          $project: { // remove sensitive info
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
        details: 'Not able to post job server error',
      },
    });
  }
});

// /* Activate/Deactivate a Job by ID by Recruiter after login-in
// http://127.0.0.1:8000/recruiter/job/activatedeactivatejob/6159622cce9274eec27b3a99
// */
// router.patch('/activatedeactivatejob/:id', [
//   checkJwtRecruiter,
//   extractEmailPayload,
// ], async (req, res) => {
//   try {
//     const { user } = req;
//     const job = await Job.findById(req.params.id).catch((err) => {
//       if (err) {
//         recruiterAppLogger('error', `No Job with ID ${req.params.id} activate/deactivate a job failed with Error: ${err}`);
//         return res.json({
//           status: 'FAILURE',
//           payload: {},
//           message: {
//             code: '400',
//             details: 'No job found to activate/deactivate',
//           },
//         });
//       }
//     });

//     if (job.createdBy.toLowerCase() !== user) {
//       res.json({
//         status: 'FAILURE',
//         payload: {},
//         message: {
//           code: '500',
//           details: 'User not authorized to update job',
//         },
//       });
//     }

//     job.updatedBy = user;
//     job.active = !job.active;
//     await job.save();
//     recruiterAppLogger('debug', `Job with position ${job.position} activated/deactivated successfully by ${job.updatedBy}`);
//     res.json({
//       status: 'SUCCESS',
//       payload: {},
//       message: {
//         code: '200',
//         details: 'Job activated/deactivated successfully',
//       },
//     });
//   } catch (err) {
//     recruiterAppLogger('error', `Error occured while activating/deactivating Job; Error: ${err.message}`);
//     res.json({
//       status: 'FAILURE',
//       payload: {},
//       message: {
//         code: '500',
//         details: 'Not able to activate/deactivate job server error',
//       },
//     });
//   }
// });

// /* Delete a Job by ID by Recruiter after login-in
// http://127.0.0.1:8000/recruiter/job/deletejob/6159622cce9274eec27b3a99
// */
// router.delete('/deletejob/:id', [
//   checkJwtRecruiter,
//   extractEmailPayload,
// ], async (req, res) => {
//   try {
//     const { user } = req;
//     const job = await Job.findById(req.params.id).catch((err) => {
//       if (err) {
//         recruiterAppLogger('error', `No Job with ID ${req.params.id} deleting a job failed with Error: ${err}`);
//         return res.json({
//           status: 'FAILURE',
//           payload: {},
//           message: {
//             code: '400',
//             details: 'No job found to delete',
//           },
//         });
//       }
//     });

//     if (job.createdBy.toLowerCase() !== user) {
//       recruiterAppLogger('error', `User not ${user} authorized to update job`);
//       res.json({
//         status: 'FAILURE',
//         payload: {},
//         message: {
//           code: '500',
//           details: 'User not authorized to delete job',
//         },
//       });
//     }

//     const dbRes = await job.delete();

//     // const job = await Job.findByIdAndDelete(req.params.id).catch((err) => {
//     //   if (err) {
//     //     return res.json({
//     //       status: 'FAILURE',
//     //       payload: {},
//     //       message: {
//     //         code: '400',
//     //         details: 'Not job found to delete',
//     //       },
//     //     });
//     //   }
//     // });

//     recruiterAppLogger('debug', `Job with ID ${req.params.id} deleted successfully by ${user}`);
//     res.json({
//       status: 'SUCCESS',
//       payload: { dbRes },
//       message: {
//         code: '200',
//         details: 'Job deleted successfully',
//       },
//     });

//     res.json({
//       status: 'FAILURE',
//       payload: {},
//       message: {
//         code: '400',
//         details: 'No job found to delete',
//       },
//     });
//   } catch (err) {
//     recruiterAppLogger('error', `Error occured while deleting Job; Error: ${err.message}`);
//     res.json({
//       status: 'FAILURE',
//       payload: {},
//       message: {
//         code: '500',
//         details: 'Not able to delete job server error',
//       },
//     });
//   }
// });

// /* View a Job by Recruiter after login-in
// http://127.0.0.1:8000/recruiter/job/viewjob/615af78f535b7cc7a1fd0eee
// */
// router.get('/viewjob/:id', [
//   checkJwtRecruiter,
//   extractEmailPayload,
// ], async (req, res) => {
//   try {
//     const { user } = req;
//     const jobData = await Job.findById(req.params.id).catch((err) => {
//       if (err) {
//         recruiterAppLogger('error', `No Job with ID ${req.params.id} view a job failed with Error: ${err}`);
//         return res.json({
//           status: 'FAILURE',
//           payload: {},
//           message: {
//             code: '400',
//             details: 'No job found to view',
//           },
//         });
//       }
//     });

//     if (jobData.createdBy.toLowerCase() !== user) {
//       recruiterAppLogger('error', `User ${user} not authorized to view job`);
//       res.json({
//         status: 'FAILURE',
//         payload: {},
//         message: {
//           code: '500',
//           details: 'User not authorized to view job',
//         },
//       });
//     }

//     recruiterAppLogger('debug', `Job with ID ${jobData.id} viewed successfully by ${jobData.createdBy}`);
//     res.json({
//       status: 'SUCCESS',
//       payload: { jobData },
//       message: {
//         code: '200',
//         details: 'Job posted successfully',
//       },
//     });
//   } catch (err) {
//     recruiterAppLogger('error', `Error occured while updating Job; Error: ${err.message}`);
//     res.json({
//       status: 'FAILURE',
//       payload: {},
//       message: {
//         code: '500',
//         details: 'Not able to post job server error',
//       },
//     });
//   }
// });

module.exports = router;
