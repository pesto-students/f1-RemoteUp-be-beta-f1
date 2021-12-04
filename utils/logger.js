const log4js = require('log4js');

log4js.configure({
  appenders: {
    recruiterApp: { type: 'file', filename: 'logs/recruiterApp.log' },
    jobSeekerApp: { type: 'file', filename: 'logs/jobSeekerApp.log' },
    publicApp: { type: 'file', filename: 'logs/publicApp.log' },
    taskApp: { type: 'file', filename: 'logs/taskApp.log' },
    notificationApp: { type: 'file', filename: 'logs/notificationApp.log' },
    out: { type: 'stdout' },
  },
  categories: {
    default: { appenders: ['recruiterApp', 'out'], level: 'debug' },
    jobSeekerApp: { appenders: ['jobSeekerApp', 'out'], level: 'debug' },
    publicApp: { appenders: ['publicApp', 'out'], level: 'debug' },
    taskApp: { appenders: ['taskApp', 'out'], level: 'debug' },
    notificationApp: { appenders: ['notificationApp', 'out'], level: 'debug' },
  },
});

const recruiterLogger = log4js.getLogger('recruiterApp');
const jobSeekerLogger = log4js.getLogger('jobSeekerApp');
const publicLogger = log4js.getLogger('publicApp');
const taskLogger = log4js.getLogger('taskApp');
const notificationLogger = log4js.getLogger('notificationApp');

module.exports = {
  recruiterAppLogger(level, text) {
    if (level === 'info') recruiterLogger.info(text);
    else if (level === 'debug') recruiterLogger.debug(text);
    else if (level === 'warn') recruiterLogger.warn(text);
    else if (level === 'error') recruiterLogger.error(text);
  },
  jobSeekerAppLogger(level, text) {
    if (level === 'info') jobSeekerLogger.info(text);
    else if (level === 'debug') jobSeekerLogger.debug(text);
    else if (level === 'warn') jobSeekerLogger.warn(text);
    else if (level === 'error') jobSeekerLogger.error(text);
  },
  publicAppLogger(level, text) {
    if (level === 'info') publicLogger.info(text);
    else if (level === 'debug') publicLogger.debug(text);
    else if (level === 'warn') publicLogger.warn(text);
    else if (level === 'error') publicLogger.error(text);
  },
  taskAppLogger(level, text) {
    if (level === 'info') taskLogger.info(text);
    else if (level === 'debug') taskLogger.debug(text);
    else if (level === 'warn') taskLogger.warn(text);
    else if (level === 'error') taskLogger.error(text);
  },
  notificationAppLogger(level, text) {
    if (level === 'info') notificationLogger.info(text);
    else if (level === 'debug') notificationLogger.debug(text);
    else if (level === 'warn') notificationLogger.warn(text);
    else if (level === 'error') notificationLogger.error(text);
  },
};
