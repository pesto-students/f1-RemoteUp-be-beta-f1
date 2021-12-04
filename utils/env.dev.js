const dotenv = require('dotenv');

dotenv.config();

// const serverPort = process.env.SERVER_PORT;
// const clientOriginUrl = process.env.CLIENT_ORIGIN_URL;
const audienceJobSeeker = process.env.AUTH0_AUDIENCE_JOBSEEKER;
const audienceRecruiter = process.env.AUTH0_AUDIENCE_RECRUITER;
const domainJobSeeker = process.env.AUTH0_DOMAIN_JOBSEEKER;
const domainRecruiter = process.env.AUTH0_DOMAIN_RECRUITER;
const emailPayload = process.env.EMAIL_PAYLOAD;

if (!audienceJobSeeker || !audienceRecruiter) {
  throw new Error(
    '.env is missing the definition of an AUTH0_AUDIENCE environmental variable',
  );
}

if (!domainJobSeeker || !domainRecruiter) {
  throw new Error(
    '.env is missing the definition of an AUTH0_DOMAIN environmental variable',
  );
}

// if (!serverPort) {
//   throw new Error(
//     '.env is missing the definition of a API_PORT environmental variable',
//   );
// }

// if (!clientOriginUrl) {
//   throw new Error(
//     '.env is missing the definition of a APP_ORIGIN environmental variable',
//   );
// }

// const clientOrigins = ['http://localhost:4040'];

module.exports = {
  // serverPort,
  // clientOriginUrl,
  // clientOrigins,
  audienceJobSeeker,
  audienceRecruiter,
  domainJobSeeker,
  domainRecruiter,
  emailPayload,
};
