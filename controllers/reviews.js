const Listing = require('../models/listing');
const Review = require('../models/review');

module.exports.createReview = async (req, res) => {
    const listing = await Listing.findById(req.params.id);

    if (!listing) {
        req.flash('error', 'Listing not found!');
        return res.redirect('/listings');
    }

    const newReview = new Review(req.body.review);
    newReview.author = req.user._id; // ✅ assign logged-in user
    await newReview.save();

    listing.reviews.push(newReview);
    await listing.save();

    console.log("✅ New review saved with author:", req.user.username);
    req.flash('success', 'Review added successfully');
    res.redirect(`/listings/${listing._id}`);
}