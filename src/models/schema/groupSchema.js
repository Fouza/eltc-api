import { Schema } from 'mongoose';
import { GROUP_STATUS } from '../../constants/enums.js';
import { SESSION_KEYS } from '../../constants/sessions.js';

// A class: one level of one program, at one campus, with one teacher and a weekly schedule.
// The schedule comes from the school's fixed sessions (see constants/sessions.js).
const slotSchema = new Schema(
  {
    day: { type: Number, min: 0, max: 6, required: true }, // 0 = Sunday
    startTime: { type: String, required: true }, // "17:30"
    endTime: { type: String, required: true },
  },
  { _id: false },
);

const groupSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    program: { type: Schema.Types.ObjectId, ref: 'program', required: true },
    levelNumber: { type: Number, required: true, min: 1 },
    campus: { type: Schema.Types.ObjectId, ref: 'campus', required: true },
    teacher: { type: Schema.Types.ObjectId, ref: 'teacher' },
    room: { type: String, trim: true },
    capacity: { type: Number, default: 12 },
    sessions: { type: [{ type: String, enum: SESSION_KEYS }], default: [] }, // e.g. ['sat_am', 'eve_tue']
    schedule: { type: [slotSchema], default: [] }, // derived from sessions
    startDate: Date,
    endDate: Date,
    fee: Number, // overrides the level fee when set
    status: { type: String, enum: GROUP_STATUS, default: 'planned' },
    notes: { type: String, trim: true },
  },
  { timestamps: true },
);

groupSchema.index({ campus: 1, status: 1 });
groupSchema.index({ program: 1, levelNumber: 1 });
groupSchema.index({ teacher: 1 });

export default groupSchema;
