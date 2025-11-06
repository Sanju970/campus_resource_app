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
export const sampleEvents = [
  {
    id: '1',
    title: 'Career Fair 2025',
    description: 'Meet with top employers and explore internship and job opportunities. Over 100 companies attending.',
    date_time: '2025-10-25T09:00:00',
    end_time: '2025-10-25T16:00:00',
    location: 'Student Union, Main Hall',
    capacity: 500,
    registration_required: true,
    category_id: 'career',
    created_by: 'admin1',
    created_by_name: 'Campus Admin',
    created_date: '2025-09-15T10:00:00',
    is_active: true,
    registered_count: 234,
  },
  {
    id: '2',
    title: 'AI & Machine Learning Workshop',
    description: 'Learn the fundamentals of AI and machine learning with hands-on projects. Bring your laptop!',
    date_time: '2025-10-28T14:00:00',
    end_time: '2025-10-28T17:00:00',
    location: 'Tech Building, Lab 301',
    capacity: 30,
    registration_required: true,
    category_id: 'academic',
    created_by: 'faculty1',
    created_by_name: 'Dr. Smith',
    created_date: '2025-10-10T09:00:00',
    is_active: true,
    registered_count: 28,
  },
  {
    id: '3',
    title: 'Fall Music Concert',
    description: 'Join us for an evening of classical and contemporary music performed by our talented students.',
    date_time: '2025-10-30T19:00:00',
    end_time: '2025-10-30T21:00:00',
    location: 'Arts Center Theater',
    capacity: 200,
    registration_required: false,
    category_id: 'arts',
    created_by: 'faculty2',
    created_by_name: 'Prof. Williams',
    created_date: '2025-09-20T11:00:00',
    is_active: true,
  },
  {
    id: '4',
    title: 'Mental Health Awareness Week',
    description: 'Various activities and workshops focused on mental health and wellness throughout the week.',
    date_time: '2025-11-01T09:00:00',
    end_time: '2025-11-05T17:00:00',
    location: 'Campus Wide',
    capacity: 1000,
    registration_required: false,
    category_id: 'wellness',
    created_by: 'admin1',
    created_by_name: 'Campus Admin',
    created_date: '2025-09-05T10:00:00',
    is_active: true,
  },
  {
    id: '5',
    title: 'Startup Pitch Competition',
    description: 'Students present their startup ideas to a panel of investors. $10,000 in prizes!',
    date_time: '2025-11-10T13:00:00',
    end_time: '2025-11-10T18:00:00',
    location: 'Innovation Hub',
    capacity: 100,
    registration_required: true,
    category_id: 'entrepreneurship',
    created_by: 'faculty3',
    created_by_name: 'Dr. Johnson',
    created_date: '2025-09-01T08:00:00',
    is_active: false,
    registered_count: 15,
  },
];

export const eventCategories = [
  { id: 'academic', name: 'Academic', color: 'bg-blue-500' },
  { id: 'career', name: 'Career', color: 'bg-green-500' },
  { id: 'wellness', name: 'Wellness', color: 'bg-purple-500' },
  { id: 'arts', name: 'Arts & Culture', color: 'bg-pink-500' },
  { id: 'sports', name: 'Sports', color: 'bg-orange-500' },
  { id: 'social', name: 'Social', color: 'bg-yellow-500' },
  { id: 'entrepreneurship', name: 'Entrepreneurship', color: 'bg-teal-500' },
];
