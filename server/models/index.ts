import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  firstName: { type: String },
  lastName: { type: String },
  profileImageUrl: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// To ensure consistent API response with "id" instead of "_id"
userSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    delete ret._id;
  }
});

export const User = mongoose.model("User", userSchema);

const contactSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  source: { type: String, required: true },
  status: { type: String, enum: ['pending', 'sent', 'failed', 'skipped'], default: 'pending' },
  failureReason: { type: String },
  sentAt: { type: Date },
  resumePath: { type: String },
  createdAt: { type: Date, default: Date.now },
});

contactSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    delete ret._id;
  }
});

export const Contact = mongoose.model("Contact", contactSchema);

const settingsSchema = new mongoose.Schema({
  smtpHost: { type: String, default: '' },
  smtpPort: { type: Number, default: 587 },
  smtpUser: { type: String, default: '' },
  smtpPass: { type: String, default: '' },
  smtpSecure: { type: Boolean, default: false },
  emailSubject: { type: String, default: 'Job Application' },
  emailBody: { type: String, default: '' },
  delayMin: { type: Number, default: 180 },
  delayMax: { type: Number, default: 240 },
  isActive: { type: Boolean, default: false },
  resumeFilename: { type: String },
  updatedAt: { type: Date, default: Date.now },
});

settingsSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    delete ret._id;
  }
});

export const Settings = mongoose.model("Settings", settingsSchema);
