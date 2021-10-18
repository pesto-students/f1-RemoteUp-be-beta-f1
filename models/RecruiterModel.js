const mongoose = require('mongoose');

const RecruiterSchema = mongoose.Schema({
  companyName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  signupTS: {
    type: Date,
    default: Date.now,
  },
  lastLoginTS: {
    type: Date,
  },
  lastLogoutTS: {
    type: Date,
  },
});

module.exports = mongoose.model('Recruiter', RecruiterSchema);
