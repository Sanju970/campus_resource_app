/**
 * @typedef {'student'|'faculty'|'admin'} UserRole
 */

/** Runtime enum for user roles */
export const UserRole = {
  STUDENT: 'student',
  FACULTY: 'faculty',
  ADMIN: 'admin',
};

/**
 * @typedef {Object} User
 * @property {string} id
 * @property {string} email
 * @property {string} name
 * @property {'student'|'faculty'|'admin'} role
 * @property {string} [department]
 * @property {string} [studentId]
 * @property {string} joinDate
 * @property {string} [avatar]
 */

/**
 * @typedef {Object} AuthContextType
 * @property {User|null} user
 * @property {(email: string, password: string, role: 'student'|'faculty'|'admin') => Promise<void>} login
 * @property {(email: string, password: string, name: string, role: 'student'|'faculty'|'admin') => Promise<void>} signup
 * @property {() => void} logout
 * @property {boolean} isAuthenticated
 */
