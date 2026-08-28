import { Schema, model } from 'mongoose';

const TransportRequestSchema = new Schema({
  referenceNumber: {
    type: String,
    unique: true,
  },
  requestedBy: {
    type: String,
    required: true,
  },
  requesterName: {
    type: String,
    required: true,
  },
  requesterEmail: {
    type: String,
    required: true,
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
  purpose: {
    type: String,
    required: true,
    trim: true,
  },
  travelDateTime: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending',
  },
  rejectionReason: {
    type: String,
    trim: true,
  },
  dispatchId: {
    type: String,
    default: undefined,
  },
  driverName: {
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
  reviewedBy: {
    type: String,
  },
  reviewedAt: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// sequential reference number generation, mirroring Dispatch.ts's "DISP-100x" pattern
TransportRequestSchema.pre('save', async function (next) {
  if (this.isNew && !this.referenceNumber) {
    try {
      const count = await model('TransportRequest').countDocuments();
      this.referenceNumber = `TR-${1000 + count + 1}`;
    } catch (err: any) {
      return next(err);
    }
  }
  next();
});

// virtual conversion to clean frontend interface
TransportRequestSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret: any) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

export const TransportRequest = model('TransportRequest', TransportRequestSchema);
export default TransportRequest;
