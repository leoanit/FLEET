import { Schema, model } from 'mongoose';

const ServiceLogSchema = new Schema({
  vehicleId: {
    type: String,
    required: true,
    index: true,
  },
  vehicleName: {
    type: String,
    required: true,
    trim: true,
  },
  serviceType: {
    type: String,
    enum: [
      'oil-change',
      'tire-rotation',
      'brake-inspection',
      'transmission-service',
      'engine-tune-up',
      'electrical-diagnostic',
      'coolant-flush',
      'air-filter-replacement',
      'battery-replacement',
      'general-inspection',
      'other',
    ],
    required: true,
  },
  description: {
    type: String,
    trim: true,
    default: '',
  },
  odometerAtService: {
    type: Number,
    required: true,
    default: 0,
  },
  cost: {
    type: Number,
    default: 0,
  },
  performedBy: {
    type: String,
    trim: true,
    default: '',
  },
  serviceDate: {
    type: Date,
    required: true,
    default: Date.now,
  },
  nextServiceMileage: {
    type: Number,
    default: undefined,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Virtual conversion to return frontend JSON interface cleanly
ServiceLogSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret: any) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

export const ServiceLog = model('ServiceLog', ServiceLogSchema);
export default ServiceLog;
