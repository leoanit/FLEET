import { Schema, model } from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new Schema({
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
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['dispatcher', 'operator', 'admin', 'employee'],
    default: 'dispatcher',
  },
  mustChangePassword: {
    type: Boolean,
    default: false,
  },
  department: {
    type: String,
    trim: true,
  },
  employeeId: {
    type: String,
    trim: true,
  },
  accountStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'approved',
  },
  rejectionReason: {
    type: String,
    trim: true,
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

// Pre-save Middleware: Hash administrative passwords automatically
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err: any) {
    next(err);
  }
});

// Instance Method: Compare decrypted passwords
UserSchema.methods.comparePassword = async function (passwordInput: string): Promise<boolean> {
  return bcrypt.compare(passwordInput, this.password);
};

export const User = model('User', UserSchema);
export default User;
