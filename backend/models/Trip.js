const mongoose = require('mongoose');
const TripSchema = new mongoose.Schema({
  tripName: { type: String, required: true },
  destination: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
});


module.exports = mongoose.model('Trip', TripSchema);
