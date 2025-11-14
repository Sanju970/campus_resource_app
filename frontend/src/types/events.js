/**
 * @typedef {Object} Event
 * @property {string} id
 * @property {string} title
 * @property {string} description
 * @property {string} date_time
 * @property {string} [end_time]
 * @property {string} location
 * @property {number} capacity
 * @property {boolean} registration_required
 * @property {string} category_id
 * @property {string} created_by
 * @property {string} [created_by_name]
 * @property {string} created_date
 * @property {string} [updated_date]
 * @property {boolean} is_active
 * @property {string} [image]
 * @property {number} [registered_count]
 */

/**
 * @typedef {Object} EventRegistration
 * @property {string} registration_id
 * @property {string} event_id
 * @property {string} user_id
 * @property {string} registration_date
 * @property {'pending'|'confirmed'|'cancelled'} status
/** @type {Event[]} */

// categories
  const eventCategories = [
  { id: 1, key: 'Library $Study Spaces', name: "Library & Study Spaces", color: 'bg-blue-100 text-blue-800' },
  { id: 2, key: 'Academic Support', name: "Academic Support", color: 'bg-green-100 text-green-800' },
  { id: 3, key: 'Career Services', name: "Career Services", color: 'bg-purple-100 text-purple-800' },
  { id: 4, key: 'Health & Wellness', name: "Health & Wellness", color: 'bg-yellow-100 text-yellow-800' },
  { id: 5, key: 'IT Services', name: "IT Services", color: 'bg-red-100 text-red-800' }, 
  { id: 6, key: 'Activities', name: "Activities", color: 'bg-pink-100 text-pink-800' },
];
