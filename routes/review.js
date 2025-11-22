const express = require('express');
const router = express.Router({ mergeParams: true });
const wrapAsync = require('../utils/wrapAsync');
const ExpressError = require('../utils/ExpressError');
const { reviewSchema } = require('../schema');
const Review = require('../models/review');
const Listing = require('../models/listing');
const { isLoggedIn, isReviewAuthor,validateReview} = require('../middleware');
const  reviewController = require('../controllers/reviews');

// POST review
router.post('/', isLoggedIn, validateReview, wrapAsync(reviewController.createReview));

// DELETE review
router.delete('/:reviewId',isLoggedIn, isReviewAuthor, wrapAsync(async (req, res) => {
    const { id, reviewId } = req.params;
    await Listing.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
    await Review.findByIdAndDelete(reviewId);
    req.flash('success', 'Review deleted successfully');
    res.redirect(`/listings/${id}`);
}));

module.exports = router;
