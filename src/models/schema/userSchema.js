import { Schema } from 'mongoose';
import { ALL_ROLES } from '../../constants/roles.js';

const userSchema = new Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    password: { type: String, required: true, select: false }, // bcrypt hash
    roles: { type: [String], enum: ALL_ROLES, default: [] },
    campusIds: [{ type: Schema.Types.ObjectId, ref: 'campus' }], // [] = every campus
    active: { type: Boolean, default: true },
    lastLoginAt: Date,
    passwordChangedAt: Date,
  },
  { timestamps: true },
);

export default userSchema;
