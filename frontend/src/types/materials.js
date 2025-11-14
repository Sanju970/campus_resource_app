/**
 * @typedef {Object} Material
 * @property {string} id
 * @property {string} title
 * @property {string} description
 * @property {string} [url]
 * @property {string} [file_path]
 * @property {'document'|'video'|'link'|'presentation'|'dataset'} resource_type
 * @property {number} [file_size]
 * @property {string} [mime_type]
 * @property {string} category_id
 * @property {string} created_by
 * @property {string} [created_by_name]
 * @property {string} created_date
 * @property {number} download_count
 * @property {boolean} is_active
 */
/** @type {Material[]} */
export const sampleMaterials = [
  {
    id: '1',
    title: 'Introduction to Computer Science - Lecture Notes',
    description: 'Comprehensive lecture notes covering basics of programming, algorithms, and data structures.',
    file_path: '/materials/cs101_notes.pdf',
    resource_type: 'document',
    file_size: 2457600,
    mime_type: 'application/pdf',
    category_id: 'cs',
    created_by: 'faculty1',
    created_by_name: 'Dr. Smith',
    created_date: '2025-09-01T10:00:00',
    download_count: 342,
    is_active: true,
  },
  {
    id: '2',
    title: 'Calculus Video Tutorial Series',
    description: 'Step-by-step video tutorials covering limits, derivatives, and integrals.',
    url: 'https://youtube.com/calculus-tutorials',
    resource_type: 'video',
    category_id: 'math',
    created_by: 'faculty2',
    created_by_name: 'Prof. Johnson',
    created_date: '2025-09-05T14:00:00',
    download_count: 567,
    is_active: true,
  },
  {
    id: '3',
    title: 'Research Paper Writing Guide',
    description: 'Complete guide to writing academic research papers, including citation styles and formatting.',
    file_path: '/materials/research_writing.pdf',
    resource_type: 'document',
    file_size: 1024000,
    mime_type: 'application/pdf',
    category_id: 'writing',
    created_by: 'faculty3',
    created_by_name: 'Dr. Williams',
    created_date: '2025-09-10T09:00:00',
    download_count: 890,
    is_active: true,
  },
  {
    id: '4',
    title: 'Chemistry Lab Safety Protocols',
    description: 'Essential safety guidelines and procedures for chemistry laboratory work.',
    file_path: '/materials/chem_safety.pdf',
    resource_type: 'document',
    file_size: 512000,
    mime_type: 'application/pdf',
    category_id: 'chemistry',
    created_by: 'faculty4',
    created_by_name: 'Dr. Brown',
    created_date: '2025-08-28T11:00:00',
    download_count: 234,
    is_active: true,
  },
  {
    id: '5',
    title: 'Statistical Analysis Dataset',
    description: 'Sample datasets for practicing statistical analysis and data visualization.',
    file_path: '/materials/stats_dataset.csv',
    resource_type: 'dataset',
    file_size: 3145728,
    mime_type: 'text/csv',
    category_id: 'stats',
    created_by: 'faculty5',
    created_by_name: 'Prof. Davis',
    created_date: '2025-09-15T13:00:00',
    download_count: 156,
    is_active: true,
  },
  {
    id: '6',
    title: 'Business Plan Template',
    description: 'Professional business plan template for entrepreneurship students.',
    file_path: '/materials/business_plan.pptx',
    resource_type: 'presentation',
    file_size: 2048000,
    mime_type: 'application/vnd.ms-powerpoint',
    category_id: 'business',
    created_by: 'faculty6',
    created_by_name: 'Prof. Taylor',
    created_date: '2025-09-20T10:00:00',
    download_count: 445,
    is_active: true,
  },
  {
    id: '7',
    title: 'Online Learning Resources Hub',
    description: 'Curated list of free online courses, tutorials, and educational platforms.',
    url: 'https://gmail.com/learning-resources',
    resource_type: 'link',
    category_id: 'general',
    created_by: 'admin1',
    created_by_name: 'Academic Services',
    created_date: '2025-08-15T09:00:00',
    download_count: 678,
    is_active: true,
  },
];

export const materialCategories = [
  { id: 'cs', name: 'Computer Science' },
  { id: 'math', name: 'Mathematics' },
  { id: 'writing', name: 'Writing & English' },
  { id: 'chemistry', name: 'Chemistry' },
  { id: 'physics', name: 'Physics' },
  { id: 'stats', name: 'Statistics' },
  { id: 'business', name: 'Business' },
  { id: 'general', name: 'General' },
];
