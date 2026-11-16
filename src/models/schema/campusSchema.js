import { Schema } from 'mongoose';
import { CAMPUS_STATUS } from '../../constants/enums.js';

const campusSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, uppercase: true, trim: true, unique: true },
    city: { type: String, trim: true },
    address: { type: String, trim: true },
    phone: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    color: { type: String, default: '#064CA5' },
    status: { type: String, enum: CAMPUS_STATUS, default: 'active' },
    openingDate: Date,
    rooms: [{ name: { type: String, required: true }, capacity: { type: Number, default: 12 } }],
  },
  { timestamps: true },
);

export default campusSchema;
