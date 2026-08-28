import { Schema, model } from 'mongoose';

const ComplianceSchema = new Schema({
  licenseClass: { type: String, required: true },
  licenseNumber: { type: String, required: true },
  licenseExpiry: { type: Date, required: true },
  licenseStatus: { 
    type: String, 
    enum: ['compliant', 'expiring-soon', 'expired'], 
    default: 'compliant' 
  },
}, { _id: false });

const PerformanceSchema = new Schema({
  safetyScore: { type: Number, default: 100 },
  fuelEfficiencyScore: { type: Number, default: 100 },
  onTimeDeliveryRate: { type: Number, default: 100 },
  weeklyHoursLogged: { type: Number, default: 0 },
}, { _id: false });

const NoteSchema = new Schema({
  id: { type: String, required: true },
  author: { type: String, required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
}, { _id: false });

const DriverSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  phone: {
    type: String,
    required: true,
    trim: true,
  },
  status: {
    type: String,
    enum: ['active', 'idle', 'on-trip', 'offline'],
    default: 'idle',
  },
  assignedVehicleId: {
    type: String,
    default: undefined,
  },
  assignedVehicleName: {
    type: String,
    default: undefined,
  },
  tripsCompleted: {
    type: Number,
    default: 0,
  },
  rating: {
    type: Number,
    default: 5.0,
  },
  compliance: {
    type: ComplianceSchema,
    required: true,
  },
  performance: {
    type: PerformanceSchema,
    default: () => ({}),
  },
  notes: {
    type: [NoteSchema],
    default: [],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Virtual conversion to return frontend JSON interface cleanly
DriverSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret: any) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

export const Driver = model('Driver', DriverSchema);
export default Driver;
