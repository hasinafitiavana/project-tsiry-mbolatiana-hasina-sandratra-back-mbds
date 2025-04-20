const jwt = require('jsonwebtoken');

const ACCESS_SECRET = process.env.ACCESS_TOKEN_SECRET;
const REFRESH_SECRET = process.env.REFRESH_TOKEN_SECRET;

function generateAccessToken(user) {
  return jwt.sign(user, ACCESS_SECRET, { expiresIn: '30m' }); // short-lived
}

function generateRefreshToken(user) {
  return jwt.sign(user, REFRESH_SECRET, { expiresIn: '5d' }); // longer-lived
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
};
