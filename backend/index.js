require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const QRCode = require('qrcode');
const { PKPass } = require('passkit-generator');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Import models
const User = require('./models/User');
const LoyaltyCard = require('./models/LoyaltyCard');

// Authentication middleware
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization').replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({ _id: decoded.userId });
    
    if (!user) {
      throw new Error();
    }
    
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Please authenticate.' });
  }
};

// Routes
// Register merchant
app.post('/api/register', async (req, res) => {
  try {
    const { email, password, businessName } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = new User({
      email,
      password: hashedPassword,
      businessName,
    });
    
    await user.save();
    
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
    res.status(201).json({ user, token });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Login merchant
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    
    if (!user) {
      throw new Error('Invalid login credentials');
    }
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new Error('Invalid login credentials');
    }
    
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
    res.json({ user, token });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Create loyalty card
app.post('/api/cards', auth, async (req, res) => {
  try {
    const { name, logo, color, totalVisits } = req.body;
    const passId = `pass.com.loyalynk.${Date.now()}`;
    
    const card = new LoyaltyCard({
      merchant: req.user._id,
      name,
      logo,
      color,
      totalVisits,
      passId,
    });
    
    await card.save();
    
    // Generate QR code
    const qrCodeData = await QRCode.toDataURL(JSON.stringify({
      cardId: card._id,
      passId: card.passId,
    }));
    
    card.qrCode = qrCodeData;
    await card.save();
    
    res.status(201).json(card);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get merchant's cards
app.get('/api/cards', auth, async (req, res) => {
  try {
    const cards = await LoyaltyCard.find({ merchant: req.user._id });
    res.json(cards);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Stamp a card
app.post('/api/cards/:cardId/stamp', auth, async (req, res) => {
  try {
    const card = await LoyaltyCard.findOne({
      _id: req.params.cardId,
      merchant: req.user._id,
    });
    
    if (!card) {
      throw new Error('Card not found');
    }
    
    if (card.currentVisits >= card.totalVisits) {
      throw new Error('Card is already complete');
    }
    
    card.currentVisits += 1;
    await card.save();
    
    res.json(card);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Redeem reward
app.post('/api/cards/:cardId/redeem', auth, async (req, res) => {
  try {
    const card = await LoyaltyCard.findOne({
      _id: req.params.cardId,
      merchant: req.user._id,
    });
    
    if (!card) {
      throw new Error('Card not found');
    }
    
    if (card.currentVisits < card.totalVisits) {
      throw new Error('Not enough visits to redeem reward');
    }
    
    // Add to redemption history
    card.redemptionHistory.push({
      redeemedAt: new Date(),
      visitsAtRedemption: card.currentVisits
    });
    
    // Reset the card state
    card.rewardRedeemed = false;
    card.currentVisits = 0;
    card.lastRedeemedAt = new Date();
    
    await card.save();
    
    res.json(card);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
