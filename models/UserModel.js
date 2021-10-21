const mongoose = require('mongoose');

const UserSchema = mongoose.Schema({
  userId: {
    type: String, // email-id
    required: true,
    unique: true,
  },
  // userFName: {
  //   type: String,
  //   // required: true,
  // },
  // userLName: {
  //   type: String,
  //   // required: true,
  // },
  // userContact: {
  //   type: Number,
  //   // required: true,
  // },
  // userExp: {
  //   type: Number,
  // },
  // userLinkedIn: {
  //   type: String,
  // },
  // userGitHub: {
  //   type: String,
  // },
  // userPortfolio: {
  //   type: String,
  // },
  // userWebsite: {
  //   type: String,
  // },
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
