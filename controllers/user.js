const User = require('../models/user');
const passport = require('passport');

module.exports.renderSignupForm = (req, res) => {
  res.render('users/signup');
};

module.exports.signup = async (req, res) => {
  try {
    const { email, username, password } = req.body;
    const newUser = new User({ email, username });

    await User.register(newUser, password);

    // Auto login after signup
    passport.authenticate('local')(req, res, () => {
      req.flash('success', 'Welcome to Wanderlust!');
      const redirectUrl = res.locals.redirectUrl || '/listings';
      res.redirect(redirectUrl);
      console.log('✅ New user registered:', newUser);
    });
  } catch (e) {
    req.flash('error', e.message);
    res.redirect('/users/signup');
  }
};

module.exports.renderLoginForm = (req, res) => {
  res.render('users/login');
};

module.exports.login = async (req, res) => {
  req.flash('success', 'Welcome back!');
  const redirectUrl = res.locals.redirectUrl || '/listings';
  delete req.session.redirectUrl; // clear after use
  res.redirect(redirectUrl);
};

module.exports.logout = (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    req.flash('success', 'You have been logged out!');
    res.redirect('/users/login');
  });
};
