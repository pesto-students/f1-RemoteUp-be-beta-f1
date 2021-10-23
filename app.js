require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const con = require('./utils/databaseConfig');
const taskJobExpiry = require('./utils/tasks');

// Databse connection
con.on('open', () => {
  console.log('connected');
});

// Express setup
const app = express();
app.use(cors());
app.use(express.json());

// cors middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// Define routers or controllers
// app.use('/auth', require('./controllers/authControllers/authController'));
app.use('/public/job', require('./controllers/publicControllers/manageJob'));
app.use('/jobseeker/job', require('./controllers/jobseekerContollers/manageJob'));
app.use('/recruiter/applicants', require('./controllers/recruiterContollers/manageApplicants'));
app.use('/recruiter/job', require('./controllers/recruiterContollers/manageJob'));
// app.use('/notify', require('./controllers/notificationControllers/notifyController'));

// Start the server @ port
const { PORT } = process.env;

app.listen(PORT, () => {
  console.log(`server started at ${PORT}`);
});

// cron-job to mark expired job as inactive at everyday midnight
// cron.schedule('0 0 0 * * *', () => { taskJobExpiry(); });
cron.schedule('*/1 * * * *', () => { taskJobExpiry(); });
