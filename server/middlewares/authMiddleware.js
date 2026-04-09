const jwt = require('jsonwebtoken');
const SECRET_KEY = '30cb38c05fd1519a13daac5b47f58f62';

function authenticateToken(req, res, next) {
  const token = req.headers['authorization'];
  if (!token) return res.sendStatus(403);

  jwt.verify(token.split(' ')[1], SECRET_KEY, (err, user) => {
    if (err) return res.sendStatus(403);
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

module.exports = authenticateToken;
