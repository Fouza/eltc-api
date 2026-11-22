import { Schema } from 'mongoose';

// A book sold to students. Linked to one or more program levels: enrolling in such a level charges the book.
// Stock is kept per campus and goes down when a book is handed over to a student.
const bookLevelSchema = new Schema(
  {
    program: { type: Schema.Types.ObjectId, ref: 'program', required: true },
    levelNumber: { type: Number, required: true, min: 1 },
  },
  { _id: false },
);

const stockSchema = new Schema(
  {
    campus: { type: Schema.Types.ObjectId, ref: 'campus', required: true },
    quantity: { type: Number, default: 0 },
  },
  { _id: false },
);

const bookSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    publisher: { type: String, trim: true },
    price: { type: Number, required: true, min: 0 },
    image: { type: String, maxlength: 1_500_000 }, // small JPEG as a data URL, resized in the browser
    levels: { type: [bookLevelSchema], default: [] },
    stock: { type: [stockSchema], default: [] },
    lowStockAt: { type: Number, default: 5 }, // alert when a campus has this many or fewer
    active: { type: Boolean, default: true },
    notes: { type: String, trim: true },
  },
  { timestamps: true },
);

bookSchema.index({ 'levels.program': 1, 'levels.levelNumber': 1 });

export default bookSchema;
