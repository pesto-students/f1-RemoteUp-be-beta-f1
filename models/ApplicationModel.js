const mongoose = require('mongoose');

const ApplicationSchema = mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
  },
  resume: {
    type: String, // path
    required: true,
  },
  dateApplied: {
    type: Date,
    default: Date.now,
  },
  applicationStatus: {
    type: String, // applied, rejected, l1, l2, hr, selected
    required: true,
  },
});

module.exports = mongoose.model('Application', ApplicationSchema);
