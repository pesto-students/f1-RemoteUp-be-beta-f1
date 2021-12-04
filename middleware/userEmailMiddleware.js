const jwtDecode = require('jwt-decode');
const { emailPayload } = require('../utils/env.dev');

module.exports = function (req, res, next) {
  // Get the token from header (authorization)
  const { authorization } = req.headers;

  // check if the token is valid
  if (!authorization) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  try {
    const token = authorization.split(' ')[1];
    const decoded = jwtDecode(token);

    req.user = decoded[emailPayload];
    next();
  } catch (err) {
    console.error(err.message);
    return res.status(401).json({ msg: 'Invalid token, authorization denied' });
  }
};
