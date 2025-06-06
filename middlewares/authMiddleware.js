const jwt = require('jsonwebtoken');

const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET;

const NON_SECURE_PATH = ["/api/users/login","/auth/google","/auth/google/callback","/api/users/send-email-forgot-password"];

const authenticateTokenMiddleware = (req, res, next) => {
  if (NON_SECURE_PATH.includes(req.path)) {
    return next();
  }
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization header must start with Bearer' });
  }

  const token = authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Access token required' });

  try {
    const user = jwt.verify(token, accessTokenSecret);
    req.user = user;
    return next();
  } catch (error) {
    console.error(error);
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

module.exports = { authenticateTokenMiddleware };
