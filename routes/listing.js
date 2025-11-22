const express = require('express');
const router = express.Router();
const wrapAsync = require('../utils/wrapAsync');
const ExpressError = require('../utils/ExpressError');
const { listingSchema } = require('../schema');
const { isLoggedIn, isOwner } = require('../middleware');
const listingController = require('../controllers/listings');
const multer = require('multer');
const upload = multer({ storage: require('../cloudConfig.js').storage });
const Listing = require('../models/listing');

// Middleware: validate listing before creating/updating
const validateListing = (req, res, next) => {
  const { error } = listingSchema.validate(req.body);
  if (error) {
    const errmsg = error.details.map(el => el.message).join(', ');
    throw new ExpressError(errmsg, 400);
  } else {
    next();
  }
};

// search route
router.get("/search", async (req, res) => {
  try {
    const query = req.query.q;

    if (!query) {
      return res.redirect("/listings");
    }

    const listings = await Listing.find({
      $or: [
        { title: { $regex: query, $options: "i" } },
        { description: { $regex: query, $options: "i" } },
        { location: { $regex: query, $options: "i" } },
        { country: { $regex: query, $options: "i" } }
      ]
    });

    const popular = await Listing.find().limit(12); // 👈 Add this

    res.render("listings/index.ejs", { 
      allListings: listings,
      popular,
      noResults: listings.length === 0,
      query
    });

  } catch (err) {
    console.log(err);
    res.render("listings/index.ejs", { 
      allListings: [],
      popular: [],
      noResults: true,
      query: ""
    });
  }
});




// INDEX ROUTE - show all listings
router
  .route('/')
  .get(wrapAsync(listingController.index))
 // CREATE ROUTE - create new listing (with multer upload)
  .post(
    isLoggedIn,
    upload.single('image'), // key name must match form input name
    //validateListing,
    wrapAsync(listingController.createListing)
  );
 
// NEW ROUTE - render form to create new listing
router.get('/new', isLoggedIn, listingController.renderNewForm);

// SHOW ROUTE - show one listing
router.get('/:id', wrapAsync(listingController.showListing));

// EDIT ROUTE - render form to edit listing
router.get('/:id/edit', isLoggedIn, isOwner, wrapAsync(listingController.renderEditForm));

// UPDATE ROUTE - apply edits to listing
router.put(
  '/:id',
  isLoggedIn,
  isOwner,
  upload.single('image'),
  validateListing,
  wrapAsync(listingController.updateListing)
);

// COUNTRY ROUTE
router.get("/country/:country", wrapAsync(listingController.countryPage));



// DELETE ROUTE - delete listing
router.delete('/:id', isLoggedIn, isOwner, wrapAsync(listingController.deleteListing));

module.exports = router;




