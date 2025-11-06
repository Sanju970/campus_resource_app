/**
 * @typedef {Object} Notification
 * @property {string} id
 * @property {string} user_id
 * @property {string} title
 * @property {string} message
 * @property {('info'|'success'|'warning'|'error'|'event'|'announcement')} type
 * @property {boolean} is_read
 * @property {string} created_date
 * @property {string} [read_date]
 */
export const sampleNotifications = [
  {
    id: '1',
    user_id: 'current_user',
    title: 'Event Registration Confirmed',
    message: 'Your registration for Career Fair 2025 has been confirmed.',
    type: 'success',
    is_read: false,
    created_date: '2025-10-21T10:30:00',
  },
  {
    id: '2',
    user_id: 'current_user',
    title: 'New Announcement',
    message: 'Library hours will be extended during finals week.',
    type: 'announcement',
    is_read: false,
    created_date: '2025-10-20T14:00:00',
  },
  {
    id: '3',
    user_id: 'current_user',
    title: 'Assignment Graded',
    message: 'Your Computer Science 101 assignment has been graded.',
    type: 'info',
    is_read: true,
    created_date: '2025-10-19T16:45:00',
    read_date: '2025-10-19T18:00:00',
  },
  {
    id: '4',
    user_id: 'current_user',
    title: 'Upcoming Event Reminder',
    message: 'AI & Machine Learning Workshop starts tomorrow at 2:00 PM.',
    type: 'event',
    is_read: false,
    created_date: '2025-10-27T09:00:00',
  },
  {
    id: '5',
    user_id: 'current_user',
    title: 'Campus WiFi Maintenance',
    message: 'WiFi will be down for maintenance this Sunday from 2-6 AM.',
    type: 'warning',
    is_read: true,
    created_date: '2025-10-18T15:00:00',
    read_date: '2025-10-18T16:30:00',
  },
  {
    id: '6',
    user_id: 'current_user',
    title: 'New Resource Available',
    message: 'Dr. Smith uploaded new lecture notes for CS101.',
    type: 'info',
    is_read: false,
    created_date: '2025-10-17T11:20:00',
  },
];
