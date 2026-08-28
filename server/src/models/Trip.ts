import { Schema, model } from 'mongoose';

const TripSchema = new Schema({
  dispatchId: {
    type: String,
    required: true,
    unique: true,
  },
  startTime: {
    type: Date,
    required: true,
    default: Date.now,
  },
  endTime: {
    type: Date,
    default: undefined,
  },
  status: {
    type: String,
    enum: ['In Progress', 'Completed'],
    default: 'In Progress',
  },
  distance: {
    type: Number,
    default: 0, // distance travelled in miles
  },
  fuelUsed: {
    type: Number,
    default: 0, // fuel consumed in liters
  },
  startOdometer: {
    type: Number,
    default: 0, // vehicle odometer reading at trip start (km)
  },
  endOdometer: {
    type: Number,
    default: 0, // vehicle odometer reading at trip end (km)
  },
  duration: {
    type: Number,
    default: 0, // travel duration in minutes
  },
  checkpoints: {
    type: [
      {
        locationName: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        odometer: { type: Number },
        fuelLevel: { type: Number },
      }
    ],
    default: [],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// virtual conversion to clean frontend interface
TripSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret: any) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

export const Trip = model('Trip', TripSchema);
export default Trip;
