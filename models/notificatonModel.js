const mongoose = require('mongoose');

const NotificationSchema = mongoose.Schema({
  read: {
    type: Boolean,
    default: false,
  },
  recipientId: {
    type: mongoose.Schema.Types.String,
    ref: 'User',
  },
  senderId: {
    type: mongoose.Schema.Types.String,
    ref: 'User',
  },
  notificationType: {
    type: String,
  },
  notificationText: {
    type: String,
  },
  applicationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Application',
  },
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
  },
}, { timestamps: true });

module.exports = mongoose.model('Notification', NotificationSchema);
