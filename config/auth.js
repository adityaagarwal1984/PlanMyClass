module.exports = {
  ensureAdmin: function (req, res, next) {
    if (req.session && req.session.user && req.session.user.role === 'admin') {
      return next();
    }
    return res.redirect('/login');
  },
  ensureFaculty: function (req, res, next) {
    if (req.session && req.session.user && req.session.user.role === 'faculty') {
      return next();
    }
    return res.redirect('/login');
  }
};
