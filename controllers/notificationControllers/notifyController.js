// Get unread notifications count
// Get all notifications
// Update notification as read

const express = require('express');
const { checkJwtJobSeeker, jwtErrorHandler } = require('../../middleware/authMiddleware');
const extractEmailPayload = require('../../middleware/userEmailMiddleware');
const Notification = require('../../models/notificatonModel');
const { notificationAppLogger } = require('../../utils/logger');

const router = express.Router();

/* Get unread notifications count recieved by Job-Seeker after login-in
http://127.0.0.1:8000/notify/countunreadnotifications
*/
router.get('/countunreadnotifications/', [
  checkJwtJobSeeker,
  jwtErrorHandler,
  extractEmailPayload,
], async (req, res) => {
  try {
    const { user } = req;

    const totalUnreadNotification = await Notification.find(
      { recipientId: user.toLowerCase(), read: false },
    ).count();

    notificationAppLogger('debug', `Total Unread Notifications counted successfully by ${user}`);
    res.json({
      status: 'SUCCESS',
      payload: { totalUnreadNotification },
      message: {
        code: '200',
        details: 'Total Unread Notifications counted successfully',
      },
    });
  } catch (err) {
    notificationAppLogger('error', `Error occured while getting Total Unread Notifications count; Error: ${err.message}`);
    res.json({
      status: 'FAILURE',
      payload: {},
      message: {
        code: '500',
        details: 'Not able to get Total Unread Notifications counted server error',
      },
    });
  }
});

/* View all notifications recieved by Job-Seeker after login-in
http://127.0.0.1:8000/notify/viewnotifications/?pageNo=1&perPage=2
*/
router.get('/viewnotifications/', [
  // checkJwtJobSeeker,
  // jwtErrorHandler,
  extractEmailPayload,
], async (req, res) => {
  try {
    const { user } = req;
    let { pageNo, perPage } = req.query;
    pageNo = Math.abs(parseInt(pageNo, 10));
    perPage = Math.abs(parseInt(perPage, 10));

    const totalNotificationObject = await Notification.find({ recipientId: user.toLowerCase() });
    const totalNotification = totalNotificationObject.length;
    const notifications = await Notification.find({ recipientId: user.toLowerCase() })
      .sort([['read', 1], ['updatedAt', -1]])
      .limit(perPage)
      .skip(perPage * (pageNo - 1));

    const totalPages = Math.ceil(totalNotification / perPage);

    notificationAppLogger('debug', `Notifications viewed successfully by ${user}`);
    res.json({
      status: 'SUCCESS',
      payload: { notifications, totalPages },
      message: {
        code: '200',
        details: 'Notifications viewed successfully',
      },
    });
  } catch (err) {
    notificationAppLogger('error', `Error occured while viewing Notifications; Error: ${err.message}`);
    res.json({
      status: 'FAILURE',
      payload: {},
      message: {
        code: '500',
        details: 'Not able to view Notifications server error',
      },
    });
  }
});

/* Mark notification as read by Job-Seeker after login-in
http://127.0.0.1:8000/notify/markasread/61769121f58c5754be59753b
*/
router.patch('/markasread/:id', [
  checkJwtJobSeeker,
  jwtErrorHandler,
  extractEmailPayload,
], async (req, res) => {
  try {
    const { user } = req;
    const notificationId = req.params.id;

    const notification = await Notification.findById(notificationId);

    if (notification.read) {
      notificationAppLogger('info', `Notification already read by ${user}`);
      res.json({
        status: 'FAILURE',
        payload: {},
        message: {
          code: '400',
          details: 'Notification already read',
        },
      });
    }

    notification.read = true;
    notification.save();

    notificationAppLogger('debug', `Notification read successfully by ${user}`);
    res.json({
      status: 'SUCCESS',
      payload: {},
      message: {
        code: '200',
        details: 'Notification read successfully',
      },
    });
  } catch (err) {
    notificationAppLogger('error', `Error occured while reading Notifications; Error: ${err.message}`);
    res.json({
      status: 'FAILURE',
      payload: {},
      message: {
        code: '500',
        details: 'Not able to read Notification counted server error',
      },
    });
  }
});

module.exports = router;
