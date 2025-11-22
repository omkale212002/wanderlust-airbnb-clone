const express = require('express');
const router = express.Router();
const passport = require('passport');
const { saveRedirectUrl } = require('../middleware');
const userController = require('../controllers/user'); // ✅ import controller

// Signup form
router.get('/signup', userController.renderSignupForm);

// Signup POST
router.post('/signup', userController.signup);

// Login form
router.get('/login', userController.renderLoginForm);

// Login POST
router.post(
  '/login',
  saveRedirectUrl,
  passport.authenticate('local', {
    failureRedirect: '/users/login',
    failureFlash: true,
  }),
  userController.login
);

// Logout route
router.get('/logout', userController.logout);

module.exports = router;
