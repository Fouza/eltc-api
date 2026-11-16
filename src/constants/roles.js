// Single source of truth for staff roles. Copied as-is in eltc-web/src/data/roles.js.
export const ROLES = {
  ADMIN: 'admin', // the school manager: everything, including users and settings
  SECRETARY: 'secretary', // registrations, enrollments, attendance, exams, cash payments
  ACCOUNTANT: 'accountant', // invoices, payments, finance reports
  COORDINATOR: 'coordinator', // pedagogy: programs, groups, teachers, attendance, exams
};

export const ALL_ROLES = Object.values(ROLES);

// Who may write what. Reading is open to every logged-in staff member.
export const CAN = {
  manageUsers: [ROLES.ADMIN],
  manageSettings: [ROLES.ADMIN],
  manageCampuses: [ROLES.ADMIN],
  managePrograms: [ROLES.ADMIN, ROLES.COORDINATOR],
  manageTeachers: [ROLES.ADMIN, ROLES.COORDINATOR, ROLES.SECRETARY],
  manageGroups: [ROLES.ADMIN, ROLES.COORDINATOR, ROLES.SECRETARY],
  manageStudents: [ROLES.ADMIN, ROLES.SECRETARY, ROLES.COORDINATOR],
  deleteStudents: [ROLES.ADMIN],
  manageEnrollments: [ROLES.ADMIN, ROLES.SECRETARY, ROLES.COORDINATOR],
  recordAttendance: [ROLES.ADMIN, ROLES.SECRETARY, ROLES.COORDINATOR],
  manageExams: [ROLES.ADMIN, ROLES.SECRETARY, ROLES.COORDINATOR],
  manageInvoices: [ROLES.ADMIN, ROLES.ACCOUNTANT, ROLES.SECRETARY],
  recordPayments: [ROLES.ADMIN, ROLES.ACCOUNTANT, ROLES.SECRETARY],
  deletePayments: [ROLES.ADMIN, ROLES.ACCOUNTANT],
  viewFinance: [ROLES.ADMIN, ROLES.ACCOUNTANT, ROLES.SECRETARY],
};
