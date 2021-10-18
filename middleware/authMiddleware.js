const jwt = require('express-jwt');
const jwksRsa = require('jwks-rsa');
const {
  audienceJobSeeker, audienceRecruiter, domainJobSeeker, domainRecruiter,
} = require('../utils/env.dev');

const checkJwtJobSeeker = jwt({
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `https://${domainJobSeeker}/.well-known/jwks.json`,
  }),

  audience: audienceJobSeeker,
  issuer: `https://${domainJobSeeker}/`,
  algorithms: ['RS256'],
});

const checkJwtRecruiter = jwt({
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `https://${domainRecruiter}/.well-known/jwks.json`,
  }),

  audience: audienceRecruiter,
  issuer: `https://${domainRecruiter}/`,
  algorithms: ['RS256'],
});

module.exports = {
  checkJwtJobSeeker,
  checkJwtRecruiter,
};
