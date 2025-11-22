const Listing = require('../models/listing');
const ExpressError = require('../utils/ExpressError');
const { listingSchema } = require('../schema');
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapToken = process.env.MAPBOX_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapToken });
const heroImages = require("../utils/heroImages");

// Show all listings
module.exports.index = async (req, res) => {
  const allListings = await Listing.find({});

  // ⭐ Popular: all countries (unique)
  const popular = [];
  const seen = new Set();

  allListings.forEach(item => {
    if (!seen.has(item.country)) {
      seen.add(item.country);
      popular.push({
        country: item.country,
        title: item.title,
        category: detectCategory(item) // 👈 NEW
      });
    }
  });

  res.render("listings/index", {
    allListings,
    popular
  });
};

// ⭐ Simple category classifier
function detectCategory(item) {
  const text = `${item.title} ${item.description}`.toLowerCase();

  if (text.includes("beach") || text.includes("sea") || text.includes("ocean"))
    return "beach";

  if (text.includes("mountain") || text.includes("cabin"))
    return "mountain";

  if (text.includes("museum") || text.includes("history"))
    return "arts";

  if (text.includes("hike") || text.includes("forest"))
    return "outdoors";

  return "popular";
}



// Render new listing form
module.exports.renderNewForm = (req, res) => {
  res.render('listings/new');
};

// Create a new listing
module.exports.createListing = async (req, res, next) => {
  try {
    console.log("📦 Request body:", req.body);

    const response = await geocodingClient
      .forwardGeocode({
        query: `${req.body.location}, ${req.body.country}`,
        limit: 1,
      })
      .send();

    // 🧭 Get geometry (make sure it exists)
    const geometry = response.body.features[0]?.geometry;
    if (!geometry) {
      throw new ExpressError('Could not find location on map', 400);
    }

    // 🖼️ Handle image upload safely
    let url, filename;
    if (req.file) {
      url = req.file.path;
      filename = req.file.filename;
    } else {
      url = 'https://defaultimage.jpg';
      filename = 'defaultimage';
    }

    // 🧾 Validate input
    const { error } = listingSchema.validate(req.body);
    if (error) {
      const msg = error.details.map(el => el.message).join(',');
      throw new ExpressError(msg, 400);
    }

    // 🏗️ Create listing
    const newListing = new Listing(req.body);
    newListing.owner = req.user._id;
    newListing.image = { url, filename };
    newListing.geometry = geometry;

    // 💾 Save to DB
    const saveListing = await newListing.save();
    console.log('✅ Saved listing:', saveListing);

    // 🔁 Redirect
    req.flash('success', 'Successfully made a new listing!');
    res.redirect(`/listings/${newListing._id}`);
  } catch (err) {
    next(err);
  }
};


// Show a particular listing
module.exports.showListing = async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id)
    .populate({
      path: 'reviews',
      populate: { path: 'author' },
    })
    .populate('owner');

  if (!listing) throw new ExpressError('Listing not found', 404);
  res.render('listings/show', { listing });
};

// Render edit form
module.exports.renderEditForm = async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id);
  if (!listing) throw new ExpressError('Cannot edit: Listing not found', 404);
  res.render('listings/edit', { listing });
};

module.exports.updateListing = async (req, res) => {
  
  try {
    const { id } = req.params;

    let listing = await Listing.findById(id);
    if (!listing) {
      req.flash('error', 'Listing not found!');
      return res.redirect('/listings');
    }

    if (!listing.owner.equals(res.locals.currentUser._id)) {
      req.flash('error', 'You do not have permission to edit this listing');
      return res.redirect(`/listings/${id}`);
    }

    // Update main fields
    listing = await Listing.findByIdAndUpdate(id, { ...req.body }, { new: true, runValidators: true });

    // Handle new image upload (if any)
    if (req.file) {
      const url = req.file.path;
      const filename = req.file.filename;
      listing.image = { url, filename };
      await listing.save();
    }

    req.flash('success', 'Listing updated successfully!');
    res.redirect(`/listings/${id}`);
  } catch (err) {
    console.error('❌ Update Listing Error:', err);
    req.flash('error', 'Something went wrong while updating the listing!');
    res.redirect('/listings');
  }
};

// country route
module.exports.countryPage = async (req, res) => {
  const heroImages = require("../utils/heroImages");

  let country = req.params.country;

  // Convert "United-States" → "United States"
  const titleCase = country
    .split("-")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  const listings = await Listing.find({ country: titleCase });

  const heroImage = heroImages[titleCase] || 
    "https://images.unsplash.com/photo-1503264116251-35a269479413";

  res.render("listings/country", {
    listings,
    heroImage,
    titleCase,   // 🔥 SEND titleCase
    noListings: listings.length === 0
  });
};

// Delete listing
module.exports.deleteListing = async (req, res) => {
  const { id } = req.params;
  const deletedListing = await Listing.findByIdAndDelete(id);
  if (!deletedListing) throw new ExpressError('Cannot delete: Listing not found', 404);
  req.flash('success', 'Listing deleted successfully');
  res.redirect('/listings');
};
