/**
 * @typedef {Object} Event
 * @property {number} event_id           // from DB: primary key
 * @property {string} title
 * @property {string} description
 * @property {string} start_datetime     // 'YYYY-MM-DD HH:MM:SS'
 * @property {string} end_datetime       // 'YYYY-MM-DD HH:MM:SS'
 * @property {string} location
 * @property {number|null} capacity
 * @property {number|null} category_id   // 1..6, maps to event_categories.category_id
 * @property {string|null} instructor_email
 * @property {boolean} registration_required
 * @property {'pending'|'approved'|'rejected'} status
 * @property {number} created_by         // user_id of creator
 * @property {number|null} approved_by   // user_id of mapped faculty (fac0001..6)
 * @property {string} created_at
 * @property {number} [registered_count] // added by SELECT subquery
 */

/**
 * @typedef {Object} EventRegistration
 * @property {number} registration_id
 * @property {number} event_id
 * @property {number} user_id
 * @property {string} registered_at      // from DB
 */

// categories used on the frontend (ids must match event_categories table)
export const eventCategories = [
  {
    id: 1,
    key: 'Library & Study Spaces',
    name: 'Library & Study Spaces',
    color: 'bg-blue-100 text-blue-800',
  },
  {
    id: 2,
    key: 'Academic Support',
    name: 'Academic Support',
    color: 'bg-green-100 text-green-800',
  },
  {
    id: 3,
    key: 'Career Services',
    name: 'Career Services',
    color: 'bg-purple-100 text-purple-800',
  },
  {
    id: 4,
    key: 'Health & Wellness',
    name: 'Health & Wellness',
    color: 'bg-yellow-100 text-yellow-800',
  },
  {
    id: 5,
    key: 'IT Services',
    name: 'IT Services',
    color: 'bg-red-100 text-red-800',
  },
  {
    id: 6,
    key: 'Activities',
    name: 'Activities',
    color: 'bg-pink-100 text-pink-800',
  },
];
