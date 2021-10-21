const log4js = require('log4js');

log4js.configure({
  appenders: {
    recruiterApp: { type: 'file', filename: 'logs/recruiterApp.log' },
    jobSeekerApp: { type: 'file', filename: 'logs/jobSeekerApp.log' },
    publicApp: { type: 'file', filename: 'logs/publicApp.log' },
    out: { type: 'stdout' },
  },
  categories: {
    default: { appenders: ['recruiterApp', 'out'], level: 'debug' },
    jobSeekerApp: { appenders: ['jobSeekerApp', 'out'], level: 'debug' },
    publicApp: { appenders: ['publicApp', 'out'], level: 'debug' },
  },
});

const recruiterLogger = log4js.getLogger('recruiterApp');
const jobSeekerLogger = log4js.getLogger('jobSeekerApp');
const publicLogger = log4js.getLogger('publicApp');

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
};
