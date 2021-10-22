// View all Jobs with Search and Filter
// Summury of all jobs
// View a Job

const express = require('express');
const Job = require('../../models/JobModel');
// const User = require('../../models/UserModel');
// const Application = require('../../models/ApplicationModel');
const { publicAppLogger } = require('../../utils/logger');

const router = express.Router();

/* View all category wise Jobs by public without login-in
http://127.0.0.1:8000/public/job/viewjobs/Software Development/?pageNo=1&perPage=2&searchKey=software
*/
router.get('/viewjobs/:category/', async (req, res) => {
  try {
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
        .select(['-planType', '-dateOfPurchase', '-dateOfExpiry', '-createdBy', '-updatedBy', '-applications'])
        .sort([['updatedAt', -1]])
        .limit(perPage)
        .skip(perPage * (pageNo - 1))
        .catch((err) => {
          if (err) {
            publicAppLogger('error', `Error in viewing jobs Error: ${err}`);
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
        .select(['-planType', '-dateOfPurchase', '-dateOfExpiry', '-createdBy', '-updatedBy', '-applications'])
        .limit(perPage)
        .skip(perPage * (pageNo - 1))
        .catch((err) => {
          if (err) {
            publicAppLogger('error', `Error in viewing jobs Error: ${err}`);
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

    publicAppLogger('debug', 'Jobs viewed successfully');
    res.json({
      status: 'SUCCESS',
      payload: { jobData, totalPages },
      message: {
        code: '200',
        details: 'Job viewed successfully',
      },
    });
  } catch (err) {
    publicAppLogger('error', `Error occured while viewing Jobs; Error: ${err.message}`);
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

/* View Summury of Jobs by public without login-in
http://127.0.0.1:8000/public/job/homejobs/?searchKey=software
*/
router.get('/homejobs/', async (req, res) => {
  try {
    let { searchKey } = req.query;
    let filterQuery;
    if (searchKey) {
      searchKey = searchKey.toLowerCase();
      filterQuery = {
        active: true,
        $or: [{ position: { $regex: new RegExp(`${searchKey}`, 'i') } },
          { companyName: { $regex: new RegExp(`${searchKey}`, 'i') } }],
      };
    } else {
      filterQuery = { active: true };
    }

    const jobData = await Job.aggregate(
      [
        { $match: filterQuery },
        { $sort: { category: -1, createdAt: -1 } }, // {category: []}
        {
          $project: {
            planType: 0,
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
          publicAppLogger('error', `Error in viewing jobs Error: ${err}`);
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

    publicAppLogger('debug', 'Jobs viewed successfully');
    res.json({
      status: 'SUCCESS',
      payload: { jobData },
      message: {
        code: '200',
        details: 'Job viewed successfully',
      },
    });
  } catch (err) {
    publicAppLogger('error', `Error occured while viewing Jobs; Error: ${err.message}`);
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

/* View a Job by public without login-in
http://127.0.0.1:8000/public/job/viewjob/615af78f535b7cc7a1fd0eee
*/
router.get('/viewjob/:id', async (req, res) => {
  try {
    const jobData = await Job.findById(req.params.id).catch((err) => {
      if (err) {
        publicAppLogger('error', `No Job with ID ${req.params.id} view a job failed with Error: ${err}`);
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

    publicAppLogger('debug', `Job with ID ${jobData.id} viewed successfully by ${jobData.createdBy}`);
    res.json({
      status: 'SUCCESS',
      payload: { jobData },
      message: {
        code: '200',
        details: 'Job posted successfully',
      },
    });
  } catch (err) {
    publicAppLogger('error', `Error occured while updating Job; Error: ${err.message}`);
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
