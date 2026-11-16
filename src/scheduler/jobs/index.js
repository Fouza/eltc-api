import overduePayments, { runOverduePayments } from './overduePayments.js';
import lowAttendance, { runLowAttendance } from './lowAttendance.js';
import examsNotGraded, { runExamsNotGraded } from './examsNotGraded.js';
import groupLifecycle, { runGroupLifecycle } from './groupLifecycle.js';
import paymentsDueSoon, { runPaymentsDueSoon } from './paymentsDueSoon.js';

export const cronJobs = { groupLifecycle, overduePayments, lowAttendance, examsNotGraded, paymentsDueSoon };
export const runners = { runGroupLifecycle, runOverduePayments, runLowAttendance, runExamsNotGraded, runPaymentsDueSoon };
