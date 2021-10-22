const mongoose = require('mongoose');

const UserSchema = mongoose.Schema({
  userId: {
    type: String, // email-id
    required: true,
    unique: true,
  },
  savedJobs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
  }],
  appliedJobs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
  }],
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
