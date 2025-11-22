const mongoose = require('mongoose');   
const Review = require('./review'); // <-- capital R
const Schema = mongoose.Schema;

const ListingSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  price: Number,
  location: String,
  country: String,
  reviews: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Review'
    }
  ],
  image: {
    filename: {
      type: String,
      default: "defaultimage"
    },
    url: {
      type: String,
      default: "https://assets-news.housing.com/news/wp-content/uploads/2022/03/31010142/Luxury-house-design-Top-10-tips-to-add-luxury-to-your-house-FEATURE-compressed.jpg"
    }
  },
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  
   geometry: {
    type: {
      type: String,
      enum: ['Point'],
      required: true
    },
    coordinates: {
      type: [Number], // [lng, lat]
      required: true
    }
  }
});

// Post middleware to delete associated reviews
ListingSchema.post('findOneAndDelete', async function(doc) {
  if (doc) {
    await Review.deleteMany({ _id: { $in: doc.reviews } });
    console.log("Associated reviews deleted");
  }
});

const Listing = mongoose.model('Listing', ListingSchema);
module.exports = Listing;
