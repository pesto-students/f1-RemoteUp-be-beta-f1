// User application status change notification
// Recruiter Job renewal notification

const { notificationAppLogger } = require('../../utils/logger');
const Notification = require('../../models/notificatonModel');

const saveNotification = (notificationObject) => {
  try {
    const notification = new Notification(notificationObject);
    const notificationResp = notification.save();
    notificationAppLogger('info', `Notification object saved sucessfully for application id: ${notificationObject.applicationId}`);
    return notificationResp;
  } catch {
    notificationAppLogger('error', `Error while saving notification object for application id: ${notificationObject.applicationId}`);
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
      notificationType: 'statusChange',
      notificationText,
      jobId,
      applicationId: _id,
    };
    return saveNotification(notificationObject);
  } catch {
    notificationAppLogger('error', 'Error while creating notification object');
  }
};

module.exports = {
  notifyUserStatusChange,
};
