import { Schema, model } from 'mongoose';

const DispatchSchema = new Schema({
  referenceNumber: {
    type: String,
    unique: true,
  },
  origin: {
    type: String,
    required: true,
    trim: true,
  },
  destination: {
    type: String,
    required: true,
    trim: true,
  },
  scheduledDate: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ['Pending', 'Assigned', 'In Progress', 'Completed', 'Cancelled'],
    default: 'Pending',
  },
  driverId: {
    type: String,
    default: undefined,
  },
  driverName: {
    type: String,
    default: undefined,
  },
  vehicleId: {
    type: String,
    default: undefined,
  },
  vehicleName: {
    type: String,
    default: undefined,
  },
  plateNumber: {
    type: String,
    default: undefined,
  },
  notes: {
    type: String,
    trim: true,
    default: '',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// sequential reference number generation
DispatchSchema.pre('save', async function (next) {
  if (this.isNew && !this.referenceNumber) {
    try {
      const count = await model('Dispatch').countDocuments();
      this.referenceNumber = `DISP-${1000 + count + 1}`;
    } catch (err: any) {
      return next(err);
    }
  }
  next();
});

// virtual conversion to clean frontend interface
DispatchSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret: any) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

export const Dispatch = model('Dispatch', DispatchSchema);
export default Dispatch;
