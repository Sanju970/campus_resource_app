/**
 * @typedef {Object} Resource
 * @property {string} id
 * @property {string} title
 * @property {string} category
 * @property {string} description
 * @property {string} [location]
 * @property {string} [hours]
 * @property {string} [contact]
 * @property {string} [website]
 * @property {string} [image]
 * @property {string[]} tags
 */

/**
 * @typedef {Object} ChatMessage
 * @property {string} id
 * @property {"user"|"assistant"} role
 * @property {string} content
 * @property {Date} timestamp
 */

export const resourceCategories = [
  {
    id: "library",
    name: "Library & Study Spaces",
    icon: "BookOpen",
  },
  {
    id: "academic",
    name: "Academic Support",
    icon: "GraduationCap",
  },
  { id: "career", name: "Career Services", icon: "Briefcase" },
  { id: "wellness", name: "Health & Wellness", icon: "Heart" },
  { id: "it", name: "IT Services", icon: "Laptop" },
  {
    id: "events",
    name: "Events & Activities",
    icon: "Calendar",
  },
];

export const campusResources = [
  {
    id: "1",
    title: "Central Library",
    category: "library",
    description:
      "Main campus library with extensive collection of books, journals, and digital resources. Features quiet study areas, group study rooms, and computer labs.",
    location: "Building A, 1st-4th Floor",
    hours: "Mon-Fri: 7am-11pm, Sat-Sun: 9am-9pm",
    contact: "library@campus.edu | (555) 123-4567",
    website: "library.campus.edu",
    image:
      "https://images.unsplash.com/photo-1731816803705-54ab8fbd6a8f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsaWJyYXJ5JTIwc3R1ZHklMjBzcGFjZXxlbnwxfHx8fDE3NjEwMjQzOTh8MA&ixlib=rb-4.1.0&q=80&w=1080",
    tags: ["study", "books", "research", "quiet space"],
  },
  {
    id: "2",
    title: "Writing Center",
    category: "academic",
    description:
      "Free peer tutoring for writing assignments, essays, and research papers. Get help with brainstorming, outlining, drafting, and revision.",
    location: "Student Success Center, Room 201",
    hours: "Mon-Thu: 9am-8pm, Fri: 9am-5pm",
    contact: "writing@campus.edu | Drop-in or by appointment",
    tags: ["tutoring", "writing", "essays", "academic support"],
  },
  {
    id: "3",
    title: "Career Development Center",
    category: "career",
    description:
      "Career counseling, resume reviews, interview preparation, job search assistance, and internship opportunities.",
    location: "Admin Building, 3rd Floor",
    hours: "Mon-Fri: 8:30am-5pm",
    contact: "careers@campus.edu | (555) 123-4568",
    website: "careers.campus.edu",
    image:
      "https://images.unsplash.com/photo-1692133226337-55e513450a32?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYXJlZXIlMjBjb3Vuc2VsaW5nJTIwb2ZmaWNlfGVufDF8fHx8MTc2MTA4NDAxMnww&ixlib=rb-4.1.0&q=80&w=1080",
    tags: ["career", "jobs", "internships", "resume"],
  },
  {
    id: "4",
    title: "Math Tutoring Lab",
    category: "academic",
    description:
      "Drop-in tutoring for all math courses from basic algebra to advanced calculus. Staffed by trained peer tutors and graduate students.",
    location: "Science Building, Room 105",
    hours: "Mon-Fri: 10am-6pm",
    contact: "mathtutoring@campus.edu",
    tags: ["tutoring", "math", "calculus", "academic support"],
  },
  {
    id: "5",
    title: "Student Health Center",
    category: "wellness",
    description:
      "Primary healthcare services, mental health counseling, wellness programs, and health education for students.",
    location: "Health Services Building",
    hours: "Mon-Fri: 8am-5pm, Emergency: 24/7",
    contact: "health@campus.edu | (555) 123-4569",
    website: "health.campus.edu",
    image:
      "https://images.unsplash.com/photo-1695795910772-6336b0beba36?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3ZWxsbmVzcyUyMG1lZGl0YXRpb258ZW58MXx8fHwxNzYxMDU0MzM5fDA&ixlib=rb-4.1.0&q=80&w=1080",
    tags: ["health", "wellness", "counseling", "mental health"],
  },
  {
    id: "6",
    title: "IT Help Desk",
    category: "it",
    description:
      "Technical support for campus WiFi, email, software, and hardware issues. Device repair and loaner laptops available.",
    location: "Tech Center, 1st Floor",
    hours: "Mon-Fri: 8am-8pm, Sat: 10am-4pm",
    contact: "helpdesk@campus.edu | (555) 123-4570",
    website: "it.campus.edu",
    tags: ["technology", "wifi", "computer", "support"],
  },
  {
    id: "7",
    title: "Counseling Services",
    category: "wellness",
    description:
      "Confidential mental health counseling, stress management, and support groups. Free for all students.",
    location: "Wellness Center, 2nd Floor",
    hours: "Mon-Fri: 9am-5pm, Crisis: 24/7",
    contact: "counseling@campus.edu | (555) 123-4571",
    tags: ["mental health", "counseling", "stress", "support"],
  },
  {
    id: "8",
    title: "Student Recreation Center",
    category: "wellness",
    description:
      "Fitness center with cardio equipment, weights, group fitness classes, indoor track, and swimming pool.",
    location: "Recreation Complex",
    hours: "Mon-Fri: 6am-11pm, Sat-Sun: 8am-10pm",
    contact: "recreation@campus.edu",
    tags: ["fitness", "gym", "sports", "recreation"],
  },
  {
    id: "9",
    title: "International Student Services",
    category: "academic",
    description:
      "Support for international students including visa assistance, cultural programs, and English language support.",
    location: "International Center",
    hours: "Mon-Fri: 9am-5pm",
    contact: "international@campus.edu",
    tags: ["international", "visa", "cultural", "support"],
  },
  {
    id: "10",
    title: "Campus Events Calendar",
    category: "events",
    description:
      "Find upcoming lectures, performances, sports events, club meetings, and social activities happening on campus.",
    website: "events.campus.edu",
    tags: ["events", "activities", "clubs", "social"],
  },
];