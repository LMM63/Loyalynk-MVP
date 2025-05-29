const mongoose = require('mongoose');

const loyaltyCardSchema = new mongoose.Schema({
  merchant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  logo: {
    type: String, // URL to the logo image
    required: true,
  },
  color: {
    type: String,
    required: true,
  },
  totalVisits: {
    type: Number,
    required: true,
  },
  currentVisits: {
    type: Number,
    default: 0,
  },
  rewardRedeemed: {
    type: Boolean,
    default: false,
  },
  lastRedeemedAt: {
    type: Date,
  },
  redemptionHistory: [{
    redeemedAt: {
      type: Date,
      default: Date.now,
    },
    visitsAtRedemption: {
      type: Number,
      required: true,
    }
  }],
  qrCode: {
    type: String, // URL to the QR code image
  },
  passId: {
    type: String, // Unique identifier for the pass
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('LoyaltyCard', loyaltyCardSchema); 