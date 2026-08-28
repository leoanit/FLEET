import { Schema, model } from 'mongoose';

const TelemetrySchema = new Schema({
  latitude: { type: Number, required: true, default: 47.6062 }, // Default Seattle coordinates
  longitude: { type: Number, required: true, default: -122.3321 },
  speed: { type: Number, required: true, default: 0 },
  heading: { type: Number, required: true, default: 0 },
  odometer: { type: Number, required: true, default: 0 },
  fuelLevel: { type: Number, required: true, default: 100 },
  locationName: { type: String, default: undefined },
  updatedAt: { type: Date, default: Date.now },
}, { _id: false });

const VehicleSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  plateNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true,
  },
  make: {
    type: String,
    required: true,
    trim: true,
  },
  model: {
    type: String,
    required: true,
    trim: true,
  },
  year: {
    type: Number,
    required: true,
  },
  type: {
    type: String,
    enum: ['truck', 'van', 'car'],
    required: true,
  },
  status: {
    type: String,
    enum: ['active', 'idle', 'maintenance', 'offline'],
    default: 'idle',
  },
  telemetry: {
    type: TelemetrySchema,
    default: () => ({}),
  },
  assignedDriverId: {
    type: String,
    default: undefined,
  },
  assignedDriverName: {
    type: String,
    default: undefined,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Virtual conversion to return frontend JSON interface cleanly
VehicleSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret: any) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

export const Vehicle = model('Vehicle', VehicleSchema);
export default Vehicle;
