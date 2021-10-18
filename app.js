require('dotenv').config();
const express = require('express');
const con = require('./utils/databaseConfig');
// const { httpLogger } = require('./utils/logger');

// Databse connection
con.on('open', () => {
  console.log('connected');
});

// Express setup
const app = express();
app.use(express.json());
// app.use(httpLogger);

// Define routers or controllers
// app.use('/auth', require('./controllers/authControllers/authController'));
app.use('/jobseeker/job', require('./controllers/jobseekerContollers/manageJob'));
// app.use('/recruiter/applicants', require('./controllers/recruiterContollers/manageApplicants'));
app.use('/recruiter/job', require('./controllers/recruiterContollers/manageJob'));
// app.use('/notify', require('./controllers/notificationControllers/notifyController'));

// Start the server @ port
const { PORT } = process.env;

app.listen(PORT, () => {
  console.log(`server started at ${PORT}`);
});
