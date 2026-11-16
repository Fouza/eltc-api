import { Schema } from 'mongoose';

// Atomic sequences for human-readable numbers (student numbers, invoices, receipts).
const counterSchema = new Schema({ _id: String, seq: { type: Number, default: 0 } }, { versionKey: false });

export default counterSchema;
