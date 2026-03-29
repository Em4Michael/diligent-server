const express = require('express');
const User    = require('../models/User');
const auth    = require('../middleware/auth');
const router  = express.Router();

const ALLOWED = [
  'fullName','preferredName','dateOfBirth','gender','maritalStatus',
  'phone','residentialAddress',
  'ndisNumber','ndisFundingType','ndisStartDate','ndisEndDate',
  'preferredContact','preferredLanguage','needInterpreter',
  'isAtsi','culturalBackground','religion','isLgbtiqa',
  'livingSituation','preferredWorkerGender',
  'servicesRequired','disabilityDetails',
  'visuallyImpaired','hearingImpairment','speechImpairment',
  'verbal','feedingAssistance','specializedEquipment','physicalAssistance',
  'allergies','otherAllergies','medicalConditions','fallsRisk',
  'behavioursTriggers','emergencyPendant','hospitalPreference','medicationLocation',
  'gp',
  'additionalDailyLiving','dislikesTriggers','goals',
  'participantSummary','nominatedRepresentative',
  'emergencyContacts','supportCoordinator','planManager','advocate',
  'professionals','serviceProviders','avatar',
];

// GET /api/profile
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ user });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch profile.' });
  }
});

// PUT /api/profile
router.put('/', auth, async (req, res) => {
  try {
    const updates = {};
    ALLOWED.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    );
    res.json({ message: 'Profile updated successfully.', user });
  } catch (e) {
    console.error('Profile update error:', e);
    res.status(500).json({ error: 'Failed to update profile.' });
  }
});

// PUT /api/profile/password
router.put('/password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword)
      return res.status(400).json({ error: 'Both passwords are required.' });
    if (newPassword.length < 6)
      return res.status(400).json({ error: 'New password must be at least 6 characters.' });
    const user = await User.findById(req.user._id).select('+password');
    if (!(await user.comparePassword(currentPassword)))
      return res.status(401).json({ error: 'Current password is incorrect.' });
    user.password = newPassword;
    await user.save();
    res.json({ message: 'Password changed successfully.' });
  } catch (e) {
    res.status(500).json({ error: 'Failed to change password.' });
  }
});

module.exports = router;
