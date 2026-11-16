import { Schema } from 'mongoose';
import { ATTENDANCE_STATUS } from '../../constants/enums.js';

// One sheet per group per day: what the teacher hands in on paper.
const attendanceSchema = new Schema(
  {
    group: { type: Schema.Types.ObjectId, ref: 'group', required: true },
    campus: { type: Schema.Types.ObjectId, ref: 'campus', required: true },
    teacher: { type: Schema.Types.ObjectId, ref: 'teacher' },
    date: { type: Date, required: true }, // 00:00 UTC of the session day
    topic: { type: String, trim: true },
    entries: [
      {
        _id: false,
        student: { type: Schema.Types.ObjectId, ref: 'student', required: true },
        status: { type: String, enum: ATTENDANCE_STATUS, default: 'present' },
        note: { type: String, trim: true },
      },
    ],
    recordedBy: { type: Schema.Types.ObjectId, ref: 'user' },
  },
  { timestamps: true },
);

attendanceSchema.index({ group: 1, date: 1 }, { unique: true });
attendanceSchema.index({ 'entries.student': 1, date: -1 });
attendanceSchema.index({ campus: 1, date: -1 });

export default attendanceSchema;
