const Job = require('../models/JobModel');
const { notifyRecruiterJobExpiry, notifyRecruiterPreJobExpiry } = require('../controllers/notificationControllers/notificationUtils');
const { taskAppLogger } = require('./logger');
const {
  JOB_EXPIRY_REMINDER_DAYS,
} = require('./constants');

const taskJobExpiry = async () => {
  try {
    const jobs = await Job.find({ active: true });
    // const jobs = await Job.find({ active: true }, {
    //   _id: 1, planType: 1, dateOfExpiry: 1, createdAt: 1,
    // });
    jobs.forEach(async (job) => {
      const { _id, dateOfExpiry, planType } = job;
      const currentDate = new Date();
      const dateOfReminder = dateOfExpiry;
      dateOfReminder.setDate(dateOfReminder.getDate() - JOB_EXPIRY_REMINDER_DAYS);
      dateOfReminder.setHours(0, 0, 0, 0);

      if (dateOfExpiry && currentDate > dateOfExpiry) {
        const jobObject = await Job.findById(_id).select({ active: 1 });
        jobObject.active = false;
        await jobObject.save();
        taskAppLogger('info', `Job with id ${String(_id)} deactivated successfully by cronjob`);
        notifyRecruiterJobExpiry(job);
      } else if (!dateOfExpiry) {
        const jobObject = await Job.findById(_id).select({ dateOfExpiry: 1 });
        const planInMonths = Number(planType.split(' ')[0]);
        const planIndays = 30 * planInMonths + 1;
        const dateOfExp = new Date();
        dateOfExp.setDate(dateOfExp.getDate() + planIndays);
        dateOfExp.setHours(0, 0, 0, 0);
        jobObject.dateOfExpiry = dateOfExp;
        await jobObject.save();
        taskAppLogger('info', `Job with id ${String(_id)} dateOfExpiry updated successfully by cronjob`);
      } else if (dateOfExpiry && currentDate === dateOfReminder) {
        notifyRecruiterPreJobExpiry(job);
      }
    });
  } catch (err) {
    taskAppLogger('error', 'Error while taskJobExpiry cronjob is running');
  }
};

module.exports = taskJobExpiry;
