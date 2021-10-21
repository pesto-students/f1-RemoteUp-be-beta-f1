const mongoose = require('mongoose');

const ApplicationSchema = mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.String,
    ref: 'User',
  },
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
  },
  userFName: {
    type: String,
    // required: true,
  },
  userLName: {
    type: String,
    // required: true,
  },
  userContact: {
    type: Number,
    // required: true,
  },
  userExp: {
    type: Number,
  },
  userLinkedIn: {
    type: String,
  },
  userGitHub: {
    type: String,
  },
  userPortfolio: {
    type: String,
  },
  userWebsite: {
    type: String,
  },
  resume: {
    type: String, // path
    // required: true,
  },
  applicationStatus: {
    type: String, // applied, rejected, l1, l2, hr, selected
    // required: true,
  },
  note: {
    type: String,
  },
  statusUpdatedBy: {
    type: String, // appliedBy or Job-manager email-id
    // required: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('Application', ApplicationSchema);
