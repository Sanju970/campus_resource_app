/**
 * @typedef {'low'|'medium'|'high'|'urgent'} AnnouncementPriority
 */

/**
 * @typedef {'pending'|'approved'|'rejected'} AnnouncementStatus
 */

/**
 * @typedef {Object} Announcement
 * @property {string} id
 * @property {string} title
 * @property {string} content
 * @property {AnnouncementPriority} priority
 * @property {string} created_date
 */
 /** @type {Announcement[]} */
export const sampleAnnouncements = [
  {
    id: '1',
    title: 'Library Hours Extended During Finals Week',
    content: 'The library will be open 24/7 from November 15-22 to support students during finals. Study rooms can be reserved online.',
    priority: 'high',
    created_date: '2025-10-20T09:00:00',
    expiry_date: '2025-11-22T23:59:59',
    created_by: 'admin1',
    created_by_name: 'Campus Admin',
    is_active: true,
    is_pinned: true,
    status: 'approved',
  },
  {
    id: '2',
    title: 'Campus WiFi Maintenance Scheduled',
    content: 'Campus WiFi will be temporarily unavailable on Sunday, October 27 from 2:00 AM to 6:00 AM for system upgrades.',
    priority: 'urgent',
    created_date: '2025-10-18T14:00:00',
    expiry_date: '2025-10-27T12:00:00',
    created_by: 'admin2',
    created_by_name: 'IT Department',
    is_active: true,
    is_pinned: true,
    status: 'pending',
  },
  {
    id: '3',
    title: 'New Course Registration Opens Next Week',
    content: 'Spring 2026 course registration begins October 28. Check your enrollment time in the student portal.',
    priority: 'high',
    created_date: '2025-10-15T10:00:00',
    expiry_date: '2025-11-15T23:59:59',
    created_by: 'admin1',
    created_by_name: 'Registrar Office',
    is_active: true,
    is_pinned: false,
  },
  {
    id: '4',
    title: 'Free Flu Shots Available',
    content: 'Student Health Center is offering free flu shots to all students. No appointment necessary, walk-ins welcome Monday-Friday 9am-4pm.',
    priority: 'medium',
    created_date: '2025-10-10T11:00:00',
    expiry_date: '2025-12-31T23:59:59',
    created_by: 'admin3',
    created_by_name: 'Health Services',
    is_active: true,
    is_pinned: false,
  },
  {
    id: '5',
    title: 'Campus Safety Alert',
    content: 'Please be aware of construction on the north side of campus. Follow designated pedestrian pathways and allow extra time for commuting.',
    priority: 'medium',
    created_date: '2025-10-05T08:00:00',
    expiry_date: '2025-12-20T23:59:59',
    created_by: 'admin1',
    created_by_name: 'Campus Security',
    is_active: true,
    is_pinned: false,
  },
  {
    id: '6',
    title: 'Scholarship Application Deadline',
    content: 'Applications for Spring 2026 scholarships are due November 1. Visit the financial aid office or apply online.',
    priority: 'high',
    created_date: '2025-09-25T09:00:00',
    expiry_date: '2025-11-01T23:59:59',
    created_by: 'admin4',
    created_by_name: 'Financial Aid',
    is_active: true,
  },
];
