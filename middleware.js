const Listing = require('./models/listing');
const { reviewSchema } = require('./schema');
const ExpressError = require('./utils/ExpressError');
const Review = require('./models/review'); // 👈 make sure this is imported

module.exports.isLoggedIn = (req, res, next) => {
  if (!req.isAuthenticated()) {
    req.session.redirectUrl = req.originalUrl; // ✅ save current URL
    req.flash('error', 'You must be signed in first!');
    return res.redirect('/users/login');
  }
  next();
};

// ✅ Save redirect URL for later use (optional for templates)
module.exports.saveRedirectUrl = (req, res, next) => {
  if (req.session.redirectUrl) {
    res.locals.redirectUrl = req.session.redirectUrl;
  }
  next();
};

module.exports.isOwner = async (req, res, next) => {
  const { id } = req.params;
  const listing = await Listing.findById(id);
  if (!listing.owner.equals(req.user._id)) {
    req.flash('error', 'You do not have permission to edit this listing');
    return res.redirect(`/listings/${id}`);
  }
  next();
};

module.exports.validateReview = (req, res, next) => {
  const { error } = reviewSchema.validate(req.body);
  if (error) {
    const errmsg = error.details.map(el => el.message).join(', ');
    throw new ExpressError(errmsg, 400);
  } else {
    next();
  }
};

module.exports.isReviewAuthor = async (req, res, next) => {
  const { id, reviewId } = req.params; // 👈 include id here
  const review = await Review.findById(reviewId);
  if (!review.author.equals(req.user._id)) {
    req.flash('error', 'You do not have permission to delete this review');
    return res.redirect(`/listings/${id}`);
  }
  next();
};
