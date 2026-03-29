const mongoose = require('mongoose');

const DocumentLogSchema = new mongoose.Schema({
  user:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  documentType: { type: String, required: true }, // intake_form | service_agreement | support_plan
  action:       { type: String, enum: ['downloaded', 'emailed'], required: true },
  sentTo:       { type: String }, // email address if emailed
  generatedAt:  { type: Date, default: Date.now }
});

module.exports = mongoose.model('DocumentLog', DocumentLogSchema);
