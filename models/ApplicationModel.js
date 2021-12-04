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
  fullName: {
    type: String,
  },
  email: {
    type: String,
  },
  phone: {
    type: String,
  },
  exp: {
    type: Number,
  },
  resume: {
    type: String,
  },
  applicationStatus: {
    type: String, // applied, rejected, l1, l2, hr, selected
  },
  note: {
    type: String,
    default: '',
  },
  statusUpdatedBy: {
    type: String, // appliedBy or Job-manager email-id
  },
}, { timestamps: true });

module.exports = mongoose.model('Application', ApplicationSchema);
