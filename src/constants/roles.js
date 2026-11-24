// Single source of truth for staff roles. Copied as-is in eltc-web/src/data/roles.js.
export const ROLES = {
  ADMIN: 'admin', // the school manager: everything, including staff accounts, campuses and settings
  SECRETARY: 'secretary', // everything else except deletes; limited to their campuses when the account has some
};

export const ALL_ROLES = Object.values(ROLES);

// Who may write what. Reading is open to every logged-in staff member.
const ADMIN_ONLY = [ROLES.ADMIN];
const STAFF = [ROLES.ADMIN, ROLES.SECRETARY];

export const CAN = {
  manageUsers: ADMIN_ONLY,
  manageSettings: ADMIN_ONLY,
  manageCampuses: ADMIN_ONLY,
  managePrograms: STAFF,
  manageBooks: STAFF,
  deleteBooks: ADMIN_ONLY,
  manageCertificates: STAFF,
  revokeCertificates: ADMIN_ONLY,
  manageTeachers: STAFF,
  manageGroups: STAFF,
  manageStudents: STAFF,
  deleteStudents: ADMIN_ONLY, // deletes are permanent: kept for the manager
  manageEnrollments: STAFF,
  recordAttendance: STAFF,
  manageExams: STAFF,
  manageInvoices: STAFF,
  recordPayments: STAFF,
  deletePayments: ADMIN_ONLY, // protects the cash: a recorded payment can only be removed by the manager
  viewFinance: STAFF,
};
