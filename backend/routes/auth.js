const express = require('express');
const router = express.Router();
const mongoose = require('mongoose'); // Required for ObjectId generation
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const Trip = require('../models/Trip');
const User = require('../models/User');

// Authentication middleware to protect routes
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader)
    return res.status(401).json({ error: 'No token provided' });
    
  const token = authHeader.split(' ')[1]; // Expecting "Bearer <token>"
  try {
    const decoded = jwt.verify(token, 'your_jwt_secret');
    req.user = decoded; // decoded contains uid
    next();
  } catch (error) {
    res.status(401).json({ error: 'Unauthorized' });
  }
};

// ------------- Trip Routes (Protected) ---------------

// Get all trips for the logged-in user
router.get('/trips', authMiddleware, async (req, res) => {
  try {
    const trips = await Trip.find({ userUid: req.user.uid });
    res.json(trips);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch trips' });
  }
});

// Get a single trip (ensuring it belongs to the user)
router.get('/trips/:id', authMiddleware, async (req, res) => {
  try {
    const trip = await Trip.findOne({ _id: req.params.id, userUid: req.user.uid });
    if (!trip) return res.status(404).json({ error: 'Trip not found' });
    res.json({ trip });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch trip' });
  }
});

// Create a new trip for the logged-in user
router.post('/trips', authMiddleware, async (req, res) => {
  try {
    const tripData = { ...req.body, userUid: req.user.uid };
    const newTrip = new Trip(tripData);
    const savedTrip = await newTrip.save();
    res.status(201).json({ trip: savedTrip });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add trip' });
  }
});

// Update a trip (only if it belongs to the user)
router.put('/trips/:id', authMiddleware, async (req, res) => {
  try {
    const updatedTrip = await Trip.findOneAndUpdate(
      { _id: req.params.id, userUid: req.user.uid },
      req.body,
      { new: true }
    );
    if (!updatedTrip) return res.status(404).json({ error: 'Trip not found' });
    res.json({ trip: updatedTrip });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update trip' });
  }
});

// Delete a trip (only if it belongs to the user)
router.delete('/trips/:id', authMiddleware, async (req, res) => {
  try {
    const deletedTrip = await Trip.findOneAndDelete({ _id: req.params.id, userUid: req.user.uid });
    if (!deletedTrip) return res.status(404).json({ error: 'Trip not found' });
    res.json({ message: 'Trip deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete trip' });
  }
});

// ------------- Authentication Routes (Signup & Login) ---------------

// Signup route
router.post('/signup', async (req, res) => {
  const { email, password } = req.body;
  try {
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ error: 'User already exists' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    // Generate a unique uid using mongoose.Types.ObjectId()
    const newUser = new User({ email, password: hashedPassword, uid: new mongoose.Types.ObjectId() });
    await newUser.save();
    const token = jwt.sign({ uid: newUser.uid }, 'your_jwt_secret', { expiresIn: '1d' });
    res.status(201).json({ token, user: { email: newUser.email, uid: newUser.uid } });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Login route
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ uid: user.uid }, 'your_jwt_secret', { expiresIn: '1d' });
    res.json({ token, user: { email: user.email, uid: user.uid } });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
