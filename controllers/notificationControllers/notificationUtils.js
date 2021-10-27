/* eslint-disable no-underscore-dangle */
/* eslint-disable consistent-return */
// User application status change notification
// Recruiter Job expiry notification

const { notificationAppLogger } = require('../../utils/logger');
const Notification = require('../../models/notificatonModel');
const {
  STATUS_CHANGE, JOB_EXPIRY, JOB_EXPIRY_REMINDER,
} = require('../../utils/constants');

const saveNotification = async (notificationObject) => {
  try {
    const notification = new Notification(notificationObject);
    const notificationResp = await notification.save();
    notificationAppLogger('info', `Notification object saved sucessfully with id: ${notificationResp._id}`);
    return notificationResp;
  } catch {
    notificationAppLogger('error', 'Error while saving notification object');
  }
};

const notifyUserStatusChange = (status, jobObject, applicationObject) => {
  try {
    const { jobId, position, companyName } = jobObject;
    const { _id, userId, statusUpdatedBy } = applicationObject;
    const notificationText = `Your job application status is changed to ${status} for ${position} with ${companyName}`;
    const notificationObject = {
      recipientId: userId,
      senderId: statusUpdatedBy,
      notificationType: STATUS_CHANGE,
      notificationText,
      jobId,
      applicationId: _id,
    };
    return saveNotification(notificationObject);
  } catch {
    notificationAppLogger('error', 'Error while creating notification object for notifyUserStatusChange');
  }
};

const notifyRecruiterJobExpiry = (jobObject) => {
  try {
    const {
      jobId, position, companyName, createdBy,
    } = jobObject;
    const notificationText = `Your job with position: ${position} and company name: ${companyName} is expired`;
    const notificationObject = {
      recipientId: createdBy,
      senderId: 'system',
      notificationType: JOB_EXPIRY,
      notificationText,
      jobId,
    };
    return saveNotification(notificationObject);
  } catch {
    notificationAppLogger('error', 'Error while creating notification object for notifyRecruiterJobExpiry');
  }
};

const notifyRecruiterPreJobExpiry = (jobObject) => {
  try {
    const {
      jobId, position, companyName, createdBy,
    } = jobObject;
    const notificationText = `Your job with position: ${position} and company name: ${companyName} will expire in 3 days`;
    const notificationObject = {
      recipientId: createdBy,
      senderId: 'system',
      notificationType: JOB_EXPIRY_REMINDER,
      notificationText,
      jobId,
    };
    return saveNotification(notificationObject);
  } catch {
    notificationAppLogger('error', 'Error while creating notification object for notifyRecruiterPreJobExpiry');
  }
};

module.exports = {
  notifyUserStatusChange,
  notifyRecruiterJobExpiry,
  notifyRecruiterPreJobExpiry,
};
