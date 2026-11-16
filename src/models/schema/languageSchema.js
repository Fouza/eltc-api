import { Schema } from 'mongoose';

const languageSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, lowercase: true, trim: true, unique: true }, // fr, en, es...
    color: { type: String, default: '#064CA5' },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export default languageSchema;
