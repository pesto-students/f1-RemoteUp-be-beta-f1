const mongoose = require('mongoose');

const UserSchema = mongoose.Schema({
  userId: {
    type: String, // email-id
    required: true,
    unique: true,
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
  saved_jobs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
  }],
  applied_jobs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
  }],
});

module.exports = mongoose.model('User', UserSchema);
