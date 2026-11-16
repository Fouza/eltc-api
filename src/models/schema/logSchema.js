import { Schema } from 'mongoose';

const logSchema = new Schema(
  {
    app: { type: String, default: 'api' },
    type: { type: String, enum: ['error', 'info'], default: 'info' },
    method: String,
    url: String,
    body: Schema.Types.Mixed,
    userId: { type: Schema.Types.ObjectId, ref: 'user' },
    errorMessage: String,
    errorStack: String,
    message: String,
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

logSchema.index({ createdAt: -1 });

export default logSchema;
