require('dotenv').config();
console.log("Loaded ENV:", process.env.CLOUD_NAME);


const express = require('express');
const mongoose = require('mongoose');
const methodOverride = require('method-override');
const ejsMate = require('ejs-mate');
const path = require('path');
const ExpressError = require('./utils/ExpressError');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const User = require('./models/user');
const flash = require('connect-flash');

// Routes
const listingsRoutes = require('./routes/listing');
const reviewRoutes = require('./routes/review');
const userRoutes = require('./routes/user');

const app = express();
const dbUrl = process.env.ATLASDB_URL;


// =================== DATABASE CONNECTION =================== //
console.log("Loaded DB URL:", process.env.ATLASDB_URL);

async function startServer() {
  try {
    await mongoose.connect(process.env.ATLASDB_URL, {
  serverSelectionTimeoutMS: 10000
});


    console.log("🔥 Mongoose connection OPEN");
    console.log("✅ Connected to MongoDB");

    app.listen(8080, () => console.log("🚀 Server running on port 8080"));
  } catch (err) {
    console.error("❌ DB Connection Error:", err);
  }
}

mongoose.connection.on("error", err => {
  console.log("🔥 Mongoose connection error:", err);
});

startServer();

// =================== EJS SETUP =================== //
app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// =================== MIDDLEWARE =================== //
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));

// =================== SESSION CONFIG =================== //
const store = MongoStore.create({
  mongoUrl: dbUrl,
  crypto: {
    secret: 'mysupersecretcode',
  },
  touchAfter: 24 * 60 * 60
});

store.on("error", function(e) {
  console.log("SESSION STORE ERROR", e);
});

const sessionOptions = {
  store: store,
  secret: 'mysupersecretcode',
  resave: false,
  saveUninitialized: true,
  cookie: {
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000, 
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true
  }
};



app.use(session(sessionOptions));
app.use(flash());

// =================== PASSPORT CONFIG =================== //
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
  res.locals.currentUser = req.user;
  next();
});

// =================== payment razorpay =================== //
app.use("/", require("./routes/payment"));

// =================== FLASH MESSAGE MIDDLEWARE =================== //
app.use((req, res, next) => {
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  next();
});

app.use((req, res, next) => {
  res.locals.noResults = false;
  res.locals.query = "";
  next();
});

// =================== ROUTES =================== //

app.get('/fakeUser', async (req, res) => {
  const fakeUser = new User({ email: 'student@gmail.com', username: 'student' });
  const registeredUser = await User.register(fakeUser, 'helloworld');
  res.send(registeredUser);
});

// Mount user routes
app.use('/users', userRoutes);
app.use('/listings', listingsRoutes);
app.use('/listings/:id/reviews', reviewRoutes);

// =================== ERROR HANDLING =================== //
app.use((req, res, next) => {
  next(new ExpressError('Page Not Found', 404));
});

app.use((err, req, res, next) => {
  const { statusCode = 500 } = err;
  if (!err.message) err.message = "Something went wrong";
  res.status(statusCode).render('listings/error', { err });
});
