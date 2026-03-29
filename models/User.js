const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  // ── ACCOUNT ─────────────────────────────────────────────────────
  email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, select: false },
  role:     { type: String, enum: ['user', 'admin'], default: 'user' },

  // ── PERSONAL BIO ─────────────────────────────────────────────────
  fullName:           { type: String, trim: true },
  preferredName:      { type: String, trim: true },
  dateOfBirth:        { type: String },
  gender:             { type: String },
  maritalStatus:      { type: String },
  phone:              { type: String },
  residentialAddress: { type: String },

  // ── NDIS ─────────────────────────────────────────────────────────
  ndisNumber:      { type: String },
  ndisFundingType: { type: String, enum: ['ndis_managed','self_managed','plan_managed',''] },
  ndisStartDate:   { type: String },
  ndisEndDate:     { type: String },

  // ── CONTACT & COMMUNICATION ───────────────────────────────────────
  preferredContact:  { type: String },
  preferredLanguage: { type: String },
  needInterpreter:   { type: Boolean },

  // ── CULTURAL / IDENTITY ───────────────────────────────────────────
  isAtsi:             { type: Boolean },
  culturalBackground: { type: String },
  religion:           { type: String },
  isLgbtiqa:          { type: Boolean },

  // ── LIVING & SUPPORT PREFERENCES ─────────────────────────────────
  livingSituation:       { type: String },
  preferredWorkerGender: { type: String },
  servicesRequired:      { type: String },
  disabilityDetails:     { type: String },

  // ── IMPAIRMENTS ───────────────────────────────────────────────────
  visuallyImpaired:     { type: Boolean },
  hearingImpairment:    { type: Boolean },
  speechImpairment:     { type: Boolean },
  verbal:               { type: Boolean },
  feedingAssistance:    { type: Boolean },
  specializedEquipment: { type: Boolean },
  physicalAssistance:   { type: Boolean },

  // ── HEALTH / CLINICAL ─────────────────────────────────────────────
  allergies:          { type: String },
  otherAllergies:     { type: String },
  medicalConditions:  { type: String },
  fallsRisk:          { type: String },
  behavioursTriggers: { type: String },
  emergencyPendant:   { type: String },
  hospitalPreference: { type: String },
  medicationLocation: { type: String },

  // ── GP DETAILS ────────────────────────────────────────────────────
  gp: {
    name:     String,
    practice: String,
    email:    String,
    phone:    String,
    address:  String,
    notes:    String,
  },

  // ── PARTICIPANT EXTRA (Support Plan specific) ─────────────────────
  additionalDailyLiving:   { type: String },
  dislikesTriggers:        { type: String },
  goals:                   { type: String },
  participantSummary:      { type: String },
  nominatedRepresentative: { type: String },

  // ── EMERGENCY CONTACTS (up to 3) ─────────────────────────────────
  emergencyContacts: [{
    name:         String,
    relationship: String,
    phone:        String,
    email:        String,
    address:      String,
    notes:        String,
  }],

  // ── SUPPORT COORDINATOR ───────────────────────────────────────────
  supportCoordinator: {
    name:         String,
    number:       String,
    email:        String,
    organisation: String,
  },

  // ── PLAN MANAGER ─────────────────────────────────────────────────
  planManager: {
    name:         String,
    number:       String,
    email:        String,
    organisation: String,
  },

  // ── ADVOCATE ─────────────────────────────────────────────────────
  advocate: {
    name:         String,
    relationship: String,
    number:       String,
    email:        String,
  },

  // ── PROFESSIONALS (up to 5) ───────────────────────────────────────
  professionals: [{
    name:         String,
    organisation: String,
    email:        String,
    phone:        String,
    notes:        String,
  }],

  // ── CURRENT SERVICE PROVIDERS (up to 4) ──────────────────────────
  serviceProviders: [{
    name:          String,
    organisation:  String,
    email:         String,
    phone:         String,
    typeOfService: String,
    frequency:     String,
  }],

  avatar:    { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  this.updatedAt = Date.now();
  next();
});

UserSchema.pre('findOneAndUpdate', function () {
  this.set({ updatedAt: Date.now() });
});

UserSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

UserSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', UserSchema);
