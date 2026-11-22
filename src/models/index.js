import mongoose from 'mongoose';
import userSchema from './schema/userSchema.js';
import campusSchema from './schema/campusSchema.js';
import languageSchema from './schema/languageSchema.js';
import programSchema from './schema/programSchema.js';
import teacherSchema from './schema/teacherSchema.js';
import groupSchema from './schema/groupSchema.js';
import studentSchema from './schema/studentSchema.js';
import counterSchema from './schema/counterSchema.js';
import enrollmentSchema from './schema/enrollmentSchema.js';
import invoiceSchema from './schema/invoiceSchema.js';
import paymentSchema from './schema/paymentSchema.js';
import attendanceSchema from './schema/attendanceSchema.js';
import examSchema from './schema/examSchema.js';
import notificationSchema from './schema/notificationSchema.js';
import settingSchema from './schema/settingSchema.js';
import logSchema from './schema/logSchema.js';
import bookSchema from './schema/bookSchema.js';

// Collection names are explicit (Mongoose would name the 'campus' model 'campus', not 'campuses').

export const usersCollection = mongoose.model('user', userSchema, 'users');
export const campusesCollection = mongoose.model('campus', campusSchema, 'campuses');
export const languagesCollection = mongoose.model('language', languageSchema, 'languages');
export const programsCollection = mongoose.model('program', programSchema, 'programs');
export const teachersCollection = mongoose.model('teacher', teacherSchema, 'teachers');
export const groupsCollection = mongoose.model('group', groupSchema, 'groups');
export const studentsCollection = mongoose.model('student', studentSchema, 'students');
export const countersCollection = mongoose.model('counter', counterSchema, 'counters');
export const enrollmentsCollection = mongoose.model('enrollment', enrollmentSchema, 'enrollments');
export const invoicesCollection = mongoose.model('invoice', invoiceSchema, 'invoices');
export const paymentsCollection = mongoose.model('payment', paymentSchema, 'payments');
export const attendancesCollection = mongoose.model('attendance', attendanceSchema, 'attendances');
export const examsCollection = mongoose.model('exam', examSchema, 'exams');
export const notificationsCollection = mongoose.model('notification', notificationSchema, 'notifications');
export const settingsCollection = mongoose.model('setting', settingSchema, 'settings');
export const logsCollection = mongoose.model('log', logSchema, 'logs');
export const booksCollection = mongoose.model('book', bookSchema, 'books');
