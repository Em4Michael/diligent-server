const express     = require('express');
const path        = require('path');
const fs          = require('fs');
const PizZip      = require('pizzip');
const Docxtemplater = require('docxtemplater');
const nodemailer  = require('nodemailer');
const auth        = require('../middleware/auth');
const User        = require('../models/User');
const DocumentLog = require('../models/DocumentLog');

const router      = express.Router();

const TEMPLATES_DIR = path.join(__dirname, '../templates');

// ─── helpers ────────────────────────────────────────────────────────────────

const bool = (v) => (v === true || v === 'true' || v === 'yes') ? 'Yes' : 'No';
const str  = (v) => v || '';
const date = (v) => v ? new Date(v).toLocaleDateString('en-AU') : '';

/** Build a flat data object for docxtemplater from a User document */
function buildTemplateData(user) {
  const ec  = (user.emergencyContacts  || []);
  const pro = (user.professionals      || []);
  const sp  = (user.serviceProviders   || []);

  const ndisFundingLabel = {
    ndis_managed: 'NDIS Managed',
    self_managed:  'Self Managed',
    plan_managed:  'Plan Managed',
  }[user.ndisFundingType] || str(user.ndisFundingType);

  return {
    // ── Core bio ─────────────────────────────
    fullName:             str(user.fullName),
    preferredName:        str(user.preferredName),
    dateOfBirth:          str(user.dateOfBirth),
    gender:               str(user.gender),
    maritalStatus:        str(user.maritalStatus),
    phone:                str(user.phone),
    email:                str(user.email),
    residentialAddress:   str(user.residentialAddress),

    // ── NDIS ─────────────────────────────────
    ndisNumber:           str(user.ndisNumber),
    ndisFundingType:      ndisFundingLabel,
    ndisStartDate:        str(user.ndisStartDate),
    ndisEndDate:          str(user.ndisEndDate),

    // ── Boolean flags ─────────────────────────
    needInterpreter:      bool(user.needInterpreter),
    isAtsi:               bool(user.isAtsi),
    isLgbtiqa:            bool(user.isLgbtiqa),
    visuallyImpaired:     bool(user.visuallyImpaired),
    hearingImpairment:    bool(user.hearingImpairment),
    speechImpairment:     bool(user.speechImpairment),
    verbal:               bool(user.verbal),
    feedingAssistance:    bool(user.feedingAssistance),
    specializedEquipment: bool(user.specializedEquipment),
    physicalAssistance:   bool(user.physicalAssistance),

    // ── Text / preferences ────────────────────
    preferredContact:     str(user.preferredContact),
    preferredLanguage:    str(user.preferredLanguage),
    culturalBackground:   str(user.culturalBackground),
    religion:             str(user.religion),
    livingSituation:      str(user.livingSituation),
    preferredWorkerGender:str(user.preferredWorkerGender),
    servicesRequired:     str(user.servicesRequired),
    disabilityDetails:    str(user.disabilityDetails),

    // ── Health / clinical ─────────────────────
    allergies:            str(user.allergies),
    otherAllergies:       str(user.otherAllergies),
    medicalConditions:    str(user.medicalConditions),
    fallsRisk:            str(user.fallsRisk),
    behavioursTriggers:   str(user.behavioursTriggers),
    emergencyPendant:     str(user.emergencyPendant),
    hospitalPreference:   str(user.hospitalPreference),
    medicationLocation:   str(user.medicationLocation),

    // ── GP ───────────────────────────────────
    gpName:    str(user.gp?.name),
    gpPractice:str(user.gp?.practice),
    gpEmail:   str(user.gp?.email),
    gpPhone:   str(user.gp?.phone),
    gpAddress: str(user.gp?.address),
    gpNotes:   str(user.gp?.notes),

    // ── Additional info ───────────────────────
    additionalDailyLiving: str(user.additionalDailyLiving),
    dislikesTriggers:      str(user.dislikesTriggers),
    goals:                 str(user.goals),
    participantSummary:    str(user.participantSummary),
    nominatedRepresentative: str(user.nominatedRepresentative),

    // ── Emergency contacts ────────────────────
    ec1Name:         str(ec[0]?.name),
    ec1Relationship: str(ec[0]?.relationship),
    ec1Phone:        str(ec[0]?.phone),
    ec1Email:        str(ec[0]?.email),
    ec1Notes:        str(ec[0]?.notes),
    ec1Address:      str(ec[0]?.address),
    ec2Name:         str(ec[1]?.name),
    ec2Relationship: str(ec[1]?.relationship),
    ec2Phone:        str(ec[1]?.phone),
    ec2Email:        str(ec[1]?.email),
    ec2Notes:        str(ec[1]?.notes),
    ec2Address:      str(ec[1]?.address),
    ec3Name:         str(ec[2]?.name),
    ec3Relationship: str(ec[2]?.relationship),
    ec3Phone:        str(ec[2]?.phone),
    ec3Email:        str(ec[2]?.email),
    ec3Address:      str(ec[2]?.address),

    // ── Support Coordinator ────────────────────
    scName:   str(user.supportCoordinator?.name),
    scNumber: str(user.supportCoordinator?.number),
    scEmail:  str(user.supportCoordinator?.email),
    scOrg:    str(user.supportCoordinator?.organisation),

    // ── Plan Manager ──────────────────────────
    pmName:   str(user.planManager?.name),
    pmNumber: str(user.planManager?.number),
    pmEmail:  str(user.planManager?.email),
    pmOrg:    str(user.planManager?.organisation),

    // ── Advocate ─────────────────────────────
    advName:         str(user.advocate?.name),
    advRelationship: str(user.advocate?.relationship),
    advNumber:       str(user.advocate?.number),
    advEmail:        str(user.advocate?.email),

    // ── Professionals (up to 4) ───────────────
    pro1Name:  str(pro[0]?.name),  pro1Org: str(pro[0]?.organisation),
    pro1Email: str(pro[0]?.email), pro1Phone:str(pro[0]?.phone), pro1Notes:str(pro[0]?.notes),
    pro2Name:  str(pro[1]?.name),  pro2Org: str(pro[1]?.organisation),
    pro2Email: str(pro[1]?.email), pro2Phone:str(pro[1]?.phone), pro2Notes:str(pro[1]?.notes),
    pro3Name:  str(pro[2]?.name),  pro3Org: str(pro[2]?.organisation),
    pro3Email: str(pro[2]?.email), pro3Phone:str(pro[2]?.phone), pro3Notes:str(pro[2]?.notes),
    pro4Name:  str(pro[3]?.name),  pro4Org: str(pro[3]?.organisation),
    pro4Email: str(pro[3]?.email), pro4Phone:str(pro[3]?.phone), pro4Notes:str(pro[3]?.notes),

    // ── Service Providers (up to 4) ───────────
    sp1Name: str(sp[0]?.name), sp1Org: str(sp[0]?.organisation),
    sp1Email:str(sp[0]?.email),sp1Phone:str(sp[0]?.phone),
    sp1Type: str(sp[0]?.typeOfService), sp1Freq:str(sp[0]?.frequency),
    sp2Name: str(sp[1]?.name), sp2Org: str(sp[1]?.organisation),
    sp2Email:str(sp[1]?.email),sp2Phone:str(sp[1]?.phone),
    sp2Type: str(sp[1]?.typeOfService), sp2Freq:str(sp[1]?.frequency),
    sp3Name: str(sp[2]?.name), sp3Org: str(sp[2]?.organisation),
    sp3Email:str(sp[2]?.email),sp3Phone:str(sp[2]?.phone),
    sp3Type: str(sp[2]?.typeOfService), sp3Freq:str(sp[2]?.frequency),
    sp4Name: str(sp[3]?.name), sp4Org: str(sp[3]?.organisation),
    sp4Email:str(sp[3]?.email),sp4Phone:str(sp[3]?.phone),
    sp4Type: str(sp[3]?.typeOfService), sp4Freq:str(sp[3]?.frequency),

    // ── Auto dates ────────────────────────────
    todayDate:   new Date().toLocaleDateString('en-AU'),
    currentYear: new Date().getFullYear().toString(),
  };
}

const DOCUMENT_MAP = {
  intake_form:       { file: 'Intake_Form.docx',           label: 'Intake Form' },
  service_agreement: { file: 'Service_Agreement_V4.docx',  label: 'Service Agreement' },
  support_plan:      { file: 'Support_Plan.docx',          label: 'Support Plan' },
};

/** Fill a docx template with user data using docxtemplater */
function fillDocument(templateFile, data) {
  const templatePath = path.join(TEMPLATES_DIR, templateFile);
  const content      = fs.readFileSync(templatePath, 'binary');
  const zip          = new PizZip(content);

  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    // Don't throw on missing tags — just leave blank
    nullGetter: () => '',
  });

  doc.render(data);
  return doc.getZip().generate({ type: 'nodebuffer', compression: 'DEFLATE' });
}

// ─── routes ─────────────────────────────────────────────────────────────────

/**
 * POST /api/documents/generate
 * Body: { documents: ['intake_form','service_agreement','support_plan'], action: 'download'|'email', email?: string }
 * Returns: single docx buffer (one doc) or zip (multiple)
 */
router.post('/generate', auth, async (req, res) => {
  try {
    const { documents, action, recipientEmail } = req.body;

    if (!documents || !Array.isArray(documents) || documents.length === 0) {
      return res.status(400).json({ error: 'Please select at least one document.' });
    }

    // Validate document types
    const invalid = documents.filter(d => !DOCUMENT_MAP[d]);
    if (invalid.length) {
      return res.status(400).json({ error: `Unknown document type(s): ${invalid.join(', ')}` });
    }

    const user = await User.findById(req.user._id);
    const data = buildTemplateData(user);

    // Generate all requested documents
    const generated = documents.map(docType => {
      const { file, label } = DOCUMENT_MAP[docType];
      const buffer = fillDocument(file, data);
      return { docType, label, buffer, filename: `${label.replace(/ /g,'_')}_${user.fullName || 'Client'}.docx` };
    });

    // ── EMAIL ────────────────────────────────────────
    if (action === 'email') {
      const to = recipientEmail || user.email;
      if (!to) return res.status(400).json({ error: 'No recipient email address provided.' });

      const transporter = nodemailer.createTransport({
        host:   process.env.EMAIL_HOST,
        port:   parseInt(process.env.EMAIL_PORT || '587'),
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      const attachments = generated.map(g => ({
        filename:    g.filename,
        content:     g.buffer,
        contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      }));

      await transporter.sendMail({
        from:    process.env.EMAIL_FROM,
        to,
        subject: `Diligent Supports – Documents for ${user.fullName || 'Client'}`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px">
            <h2 style="color:#1a6b3c">Diligent Supports</h2>
            <p>Dear ${user.fullName || 'Client'},</p>
            <p>Please find your completed document(s) attached:</p>
            <ul>${generated.map(g => `<li>${g.label}</li>`).join('')}</ul>
            <p>If you have any questions, please contact us at <a href="mailto:info@diligentsupports.com.au">info@diligentsupports.com.au</a></p>
            <hr/>
            <small style="color:#888">Diligent Supports | 1300 701678 | info@diligentsupports.com.au</small>
          </div>
        `,
        attachments,
      });

      // Log
      for (const g of generated) {
        await DocumentLog.create({ user: user._id, documentType: g.docType, action: 'emailed', sentTo: to });
      }

      return res.json({ message: `Documents sent to ${to}` });
    }

    // ── DOWNLOAD ─────────────────────────────────────
    // Single document → send directly
    if (generated.length === 1) {
      const { buffer, filename } = generated[0];
      await DocumentLog.create({ user: user._id, documentType: generated[0].docType, action: 'downloaded' });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      return res.send(buffer);
    }

    // Multiple documents → send as a ZIP using PizZip
    const archiveZip = new PizZip();
    for (const g of generated) {
      archiveZip.file(g.filename, g.buffer);
      await DocumentLog.create({ user: user._id, documentType: g.docType, action: 'downloaded' });
    }
    const zipBuffer = archiveZip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="DiligentSupports_Documents.zip"`);
    return res.send(zipBuffer);

  } catch (err) {
    console.error('Document generation error:', err);
    res.status(500).json({ error: 'Failed to generate document. Please try again.' });
  }
});

// GET /api/documents/history — get user's document generation history
router.get('/history', auth, async (req, res) => {
  try {
    const logs = await DocumentLog.find({ user: req.user._id })
      .sort({ generatedAt: -1 })
      .limit(50);
    res.json({ logs });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch history.' });
  }
});

module.exports = router;
