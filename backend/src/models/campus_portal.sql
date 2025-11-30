-- ============================================================
-- DATABASE: campus_portal
-- AUTHOR: Group4 (Phase 3)
-- ============================================================

DROP DATABASE IF EXISTS campus_portal;
CREATE DATABASE campus_portal;
USE campus_portal;

-- ============================================================
-- 1. USER TABLES
-- ============================================================

CREATE TABLE roles (
    role_id INT AUTO_INCREMENT PRIMARY KEY,
    role_name ENUM('student','faculty','admin') NOT NULL UNIQUE
);

CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    user_uid VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role_id INT NOT NULL,
    bio TEXT DEFAULT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    reset_token VARCHAR(255) DEFAULT NULL,
    reset_token_expire BIGINT DEFAULT NULL,
    email_notifications BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(role_id)
);

CREATE TABLE campus_locations (
    location_id INT AUTO_INCREMENT PRIMARY KEY,
    location_name VARCHAR(200) NOT NULL UNIQUE,
    building VARCHAR(200),
    room VARCHAR(50)
);

-- ============================================================
-- 2. ORGANIZATION TABLES
-- ============================================================

CREATE TABLE organization_categories (
    category_id INT AUTO_INCREMENT PRIMARY KEY,
    category_key VARCHAR(50) UNIQUE NOT NULL,
    category_name VARCHAR(150) NOT NULL
);

CREATE TABLE organizations (
    org_id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    location_id INT UNIQUE,
    hours VARCHAR(255),
    contact VARCHAR(255),
    website VARCHAR(255),
    category_id INT,
    created_by INT NOT NULL,     
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(user_id),
    FOREIGN KEY (category_id) REFERENCES organization_categories(category_id),
    FOREIGN KEY (location_id) REFERENCES campus_locations(location_id)
);

-- ============================================================
-- 3. ORG MEMBERS TABLE with NEW ROLES
-- ============================================================

CREATE TABLE organization_members (
    org_id INT NOT NULL,
    user_id INT NOT NULL,
    role ENUM(
        'member',
        'coordinator',
        'lead_faculty',
        'event_manager',
        'admin_delegate'
    ) DEFAULT 'member',
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (org_id, user_id),
    FOREIGN KEY (org_id) REFERENCES organizations(org_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- ============================================================
-- 4. EVENTS 
-- ============================================================

CREATE TABLE events (
  event_id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  start_datetime DATETIME NOT NULL,
  end_datetime DATETIME NOT NULL,
  location_id INT,
  capacity INT,
  category_id INT NOT NULL,
  category VARCHAR(100),
  instructor_email VARCHAR(150),
  registration_required BOOLEAN DEFAULT 0,
  status ENUM('pending','approved','rejected') DEFAULT 'pending',
  created_by INT NOT NULL,
  approved_by INT DEFAULT NULL,
  org_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  members_only BOOLEAN NOT NULL DEFAULT 0,
  UNIQUE (title, start_datetime, location_id),
  FOREIGN KEY (location_id) REFERENCES campus_locations(location_id),
  FOREIGN KEY (created_by) REFERENCES users(user_id),
  FOREIGN KEY (approved_by) REFERENCES users(user_id),
  FOREIGN KEY (category_id) REFERENCES organization_categories(category_id),
  FOREIGN KEY (org_id) REFERENCES organizations(org_id)
);

-- ============================================================
-- 5. EVENT REGISTRATIONS
-- ============================================================

CREATE TABLE event_registrations (
  registration_id INT AUTO_INCREMENT PRIMARY KEY,
  event_id INT NOT NULL,
  user_id INT NOT NULL,
  registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (event_id, user_id),
  FOREIGN KEY (event_id) REFERENCES events(event_id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- ============================================================
-- 6. ANNOUNCEMENTS
-- ============================================================

CREATE TABLE announcements (
    announcement_id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    priority ENUM('low','medium','high','urgent') DEFAULT 'medium',
    created_by INT NOT NULL,
    org_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (title, created_by),
    FOREIGN KEY (created_by) REFERENCES users(user_id),
    FOREIGN KEY (org_id) REFERENCES organizations(org_id)
);
-- ============================================================
-- 7. FAVORITES
-- ============================================================

CREATE TABLE favorites (
    favorite_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    item_type ENUM('event','announcement') NOT NULL,
    item_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, item_type, item_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- ============================================================
-- 8. NOTIFICATIONS
-- ============================================================

CREATE TABLE notifications (
    notification_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    message VARCHAR(255) NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- ============================================================
-- SAMPLE DATA
-- ============================================================

INSERT INTO roles (role_name)
VALUES ('student'), ('faculty'), ('admin');

-- USERS
INSERT INTO users (first_name, last_name, user_uid, email, password_hash, role_id)
VALUES
('Michael', 'Anderson', 'adm0001', 'adm0001@gmail.com',
 '$2a$10$O3V6.PCv42.rjSKslUt3vO0ktxOTvhaLI.ZYyOpvfoIGgQfKuSUAC', 3),
('Jane', 'Doe', 'fac0006', 'fac0006@gmail.com',
 '$2a$10$0T0VOYrqBqhIlYvT0nRm.OUFwa3.nuDZ8SG/zchbZ9ZsEVll2xpY.', 2),
('John', 'Smith', 'fac0005', 'fac0005@gmail.com',
 '$2a$10$Opi0eknm8c5n3wlgwXzC5utztgQuuenWWxRFxc8As052U9yiHWUfS', 2),
('Emily', 'Lee', 'fac0004', 'fac0004@gmail.com',
 '$2a$10$d1dNmwGVoCaRDZrIoQy29usriQaq0P3FA05A0TxMe0ExKKu/1/cO.', 2),
('Michael', 'Hart', 'fac0003', 'fac0003@gmail.com',
 '$2a$10$1ZaRyvGA9PbpgvfIxeou5O5cfwe1Hig/2md/i3hElWUy4otxGJA.y', 2),
('Robert', 'Steele', 'fac0002', 'fac0002@gmail.com',
 '$2a$10$KPyfTBLXS9lSLDXdKmDrYeVcsqsqt4gqTQ7agqLZdvaChXkg8u4Oe', 2),
('Karen', 'Mitchell', 'fac0001', 'fac0001@gmail.com',
 '$2a$10$jOeOu5nm3qsxZzfTJOJ/YeGoedwZK0alkuU/daw1sFhUwt1bmKsQi', 2),
('Bob', 'Lee', 'stu0001', 'stu0001@gmail.com',
 '$2a$10$ydPYgxkqPJoKT4wzjKYfTuUujMGfN19zqYj5kVa0BC0PjQPSwXNo6', 1),
('Ron', 'Weasley', 'adm913540', 'adm913540@gmail.com',
 '$2a$10$O3V6.PCv42.rjSKslUt3vO0ktxOTvhaLI.ZYyOpvfoIGgQfKuSUAC', 3);

INSERT INTO campus_locations (location_name, building, room) VALUES
('Central Building Entrance', 'Central Building', 1),
('Central Building C5', 'Central Building', 5),
('Success Center Room 201', 'Success Center', 201),
('Admin Building Floor 2', 'Admin Building', 200),
('Wellness Center Ground', 'Wellness Center', 1),
('IT Building Room 101', 'IT Building', 101),
('Student Union Room 210', 'Student Union', 210),
('Student Union Main Hall', 'Student Union', 100),
('Student Union Main Room', 'Student Union', 10),
('Student Union Main Room5', 'Student Union', 500),
('Engineering Lab 101', 'Engineering Lab', 101),
('Main Auditorium Room 1', 'Main Auditorium', 1),
('Main Hall, Student Union', 'Student Union', 243),
('Lab 101', 'Engineering Lab', 090),
('Auditorium', 'Main Auditorium', 200),
('Success Center 201', 'Success Center', 800),
('Central Building', 'Central Building', 987),
('IT Building 1st Floor', 'IT Building', 198),
('Student Union 210', 'Student Union', 254),
('Wellness Center Building', 'Wellness Center', 876),
('Admin Building 2nd Floor', 'Admin Building', 234),
-- NEW UNIQUE LOCATIONS
('Central Quiet Study Room', 'Central Building', 140),
('Central Building Wing A', 'Central Building', 098),
('Central Building Wing B', 'Central Building', 230),
('Success Center Study Pod 1', 'Success Center', 254),
('Success Center Study Pod 2', 'Success Center', 234),
('Success Center Writing Lab', 'Success Center', 298),
('Admin Building Advising Suite', 'Admin Building', 390),
('Admin Building Office 310', 'Admin Building', 376),
('Wellness Center Yoga Studio', 'Wellness Center', 189),
('Wellness Counseling Room 202', 'Wellness Center', 222),
('Campus Recreation Room 5', 'Recreation Center', 085),
('IT Building Lab 202', 'IT Building', 202),
('IT Building Lab 303', 'IT Building', 202),
('Student Union Creative Studio', 'Student Union', 209),
('Student Union Collaboration Room', 'Student Union', 980),
('Student Union Event Lounge', 'Student Union', 380),
('Engineering Lab 202', 'Engineering Lab', 202),
('Engineering Innovation Lab', 'Engineering Lab', 250),
('Main Auditorium Backstage', 'Main Auditorium', 276),
('Main Auditorium Studio Room', 'Main Auditorium', 14),
('Film & Media Production Lab', 'Main Auditorium', 22);


-- CATEGORIES
INSERT INTO organization_categories (category_key, category_name)
VALUES
('library', 'Library & Study Spaces'),
('academic_support', 'Academic Support'),
('career_services', 'Career Services'),
('health_wellness', 'Health & Wellness'),
('it_services', 'IT Services'),
('activities', 'Activities & Student Life');

-- ============================
-- LIBRARY & STUDY SPACES (ID 1)
-- ============================

INSERT INTO organizations (title, description, location_id, hours, contact, website, category_id, created_by)
VALUES
('Central Library', 'Main campus library offering books, research support, study rooms, and late-night access.',
 (SELECT location_id FROM campus_locations WHERE location_name='Central Building C5'),
 '7am-11pm', '9090909090', 'https://library.campus.edu', 1, 1),

('Quiet Study Lounge', 'Silent study area with individual cubicles and soft lighting.',
 (SELECT location_id FROM campus_locations WHERE location_name='Central Quiet Study Room'),
 '8am-10pm', '9090909090', 'https://study.campus.edu/lounge', 1, 1),

('Graduate Research Commons', 'Workspace for research scholars and grad students.',
 (SELECT location_id FROM campus_locations WHERE location_name='Admin Building Office 310'),
 '9am-9pm', '9090909090', 'https://research.campus.edu/commons', 1, 1),

('Learning Resource Center', 'Support hub with textbooks, reference materials, computers, and databases.',
 (SELECT location_id FROM campus_locations WHERE location_name='Success Center Study Pod 2'),
 '8am-8pm', '9090909090', 'https://lrc.campus.edu', 1, 1);


-- ============================
-- ACADEMIC SUPPORT (ID 2)
-- ============================

INSERT INTO organizations (title, description, location_id, hours, contact, website, category_id, created_by)
VALUES
('Writing Center', 'Tutoring and coaching for academic and professional writing.',
 (SELECT location_id FROM campus_locations WHERE location_name='Success Center Writing Lab'),
 '9am-8pm', '9090909090', 'https://writing.campus.edu', 2, 1),

('Math Assistance Center', 'Walk-in tutoring for algebra, calculus, and statistics.',
 (SELECT location_id FROM campus_locations WHERE location_name='Engineering Lab 101'),
 '10am-6pm', '9090909090', 'https://math.campus.edu', 2, 1),

('STEM Success Hub', 'Resource center helping students excel in STEM coursework.',
 (SELECT location_id FROM campus_locations WHERE location_name='IT Building Lab 202'),
 '9am-7pm', '9090909090', 'https://stem.campus.edu', 2, 1),

('Creative Writing Lab', 'Workshops and creative writing feedback sessions.',
 (SELECT location_id FROM campus_locations WHERE location_name='Student Union Creative Studio'),
 '2pm-7pm', '9090909090', 'https://creative.campus.edu/writing', 2, 1);


-- ============================
-- CAREER SERVICES (ID 3)
-- ============================

INSERT INTO organizations (title, description, location_id, hours, contact, website, category_id, created_by)
VALUES
('Career Development Center', 'Career counseling, resume reviews, internships, and employer networking.',
 (SELECT location_id FROM campus_locations WHERE location_name='Admin Building Advising Suite'),
 '8:30am-5pm', '9090909090', 'https://careers.campus.edu', 3, 1),

('Internship Advising Hub', 'Helps students explore internships and applications.',
 (SELECT location_id FROM campus_locations WHERE location_name='Success Center Study Pod 1'),
 '9am-4pm', '9090909090', 'https://internships.campus.edu', 3, 1),

('Professional Mentorship Program', 'Connects students with alumni mentors.',
 (SELECT location_id FROM campus_locations WHERE location_name='Central Building Entrance'),
 '10am-5pm', '9090909090', 'https://mentorship.campus.edu', 3, 1),

('Career Skills Lab', 'Resume building, interview prep, and LinkedIn workshops.',
 (SELECT location_id FROM campus_locations WHERE location_name='Main Auditorium Studio Room'),
 '1pm-6pm', '9090909090', 'https://skills.campus.edu', 3, 1);


-- ============================
-- HEALTH & WELLNESS (ID 4)
-- ============================

INSERT INTO organizations (title, description, location_id, hours, contact, website, category_id, created_by)
VALUES
('Health & Wellness Center', 'Healthcare, health education, and wellness programs.',
 (SELECT location_id FROM campus_locations WHERE location_name='Wellness Center Ground'),
 '8am-6pm', '9090909090', 'https://wellness.campus.edu', 4, 1),

('Counseling & Mental Health Office', 'Confidential counseling & wellness workshops.',
 (SELECT location_id FROM campus_locations WHERE location_name='Wellness Counseling Room 202'),
 '9am-5pm', '9090909090', 'https://counseling.campus.edu', 4, 1),

('Fitness & Recreation Center', 'Gym, fitness classes, intramurals, climbing wall, pool.',
 (SELECT location_id FROM campus_locations WHERE location_name='Campus Recreation Room 5'),
 '6am-11pm', '9090909090', 'https://recreation.campus.edu', 4, 1),

('Campus Yoga & Meditation Club', 'Mindfulness, meditation, and yoga sessions.',
 (SELECT location_id FROM campus_locations WHERE location_name='Wellness Center Yoga Studio'),
 '5pm-8pm', '9090909090', 'https://yoga.campus.edu', 4, 1);

-- ============================
-- IT SERVICES (ID 5)
-- ============================

INSERT INTO organizations (title, description, location_id, hours, contact, website, category_id, created_by)
VALUES
('IT Services', 'Technology support, account services, and device troubleshooting.',
 (SELECT location_id FROM campus_locations WHERE location_name='IT Building Room 101'),
 '24/7', '9090909090', 'https://it.campus.edu', 5, 1),

('Tech Help Desk', 'Walk-in support for software and hardware.',
 (SELECT location_id FROM campus_locations WHERE location_name='Central Building Wing A'),
 '8am-8pm', '9090909090', 'https://helpdesk.campus.edu', 5, 1),

('Cybersecurity Awareness Club', 'Security training, phishing simulations, and safe browsing.',
 (SELECT location_id FROM campus_locations WHERE location_name='IT Building Lab 303'),
 '4pm-9pm', '9090909090', 'https://cyber.campus.edu', 5, 1),

('Student Developers Society', 'Hackathons, app building, and developer meetups.',
 (SELECT location_id FROM campus_locations WHERE location_name='Engineering Innovation Lab'),
 '3pm-10pm', '9090909090', 'https://developers.campus.edu', 5, 1);

-- ============================
-- ACTIVITIES & STUDENT LIFE (ID 6)
-- ============================

INSERT INTO organizations (title, description, location_id, hours, contact, website, category_id, created_by)
VALUES
('Student Activities Office', 'Campus events, student clubs, leadership programs.',
 (SELECT location_id FROM campus_locations WHERE location_name='Student Union Room 210'),
 '9am-5pm', '9090909090', 'https://activities.campus.edu', 6, 1),

('Maverick Activities Council', 'Concerts, movie nights, and campus traditions.',
 (SELECT location_id FROM campus_locations WHERE location_name='Student Union Event Lounge'),
 '10am-6pm', '9090909090', 'https://mac.campus.edu', 6, 1),

('Esports & Gaming Club', 'Competitive & casual gaming meetups.',
 (SELECT location_id FROM campus_locations WHERE location_name='Student Life Hub A'),
 '5pm-11pm', '9090909090', 'https://gaming.campus.edu', 6, 1),

('Cultural Diversity Council', 'Cultural celebrations & diversity initiatives.',
 (SELECT location_id FROM campus_locations WHERE location_name='Student Life Hub B'),
 '10am-7pm', '9090909090', 'https://diversity.campus.edu', 6, 1),

('Photography & Media Club', 'Photo walks, editing workshops, & media production.',
 (SELECT location_id FROM campus_locations WHERE location_name='Film & Media Production Lab'),
 '3pm-7pm', '9090909090', 'https://photoclub.campus.edu', 6, 1);


-- ORG MEMBERS (CORRECT ROLES ONLY)
INSERT INTO organization_members (org_id, user_id, role)
VALUES
-- LIBRARY & STUDY SPACES (1–4)
(1, 2, 'lead_faculty'), (1, 1, 'admin_delegate'),
(2, 3, 'lead_faculty'), (2, 1, 'admin_delegate'),
(3, 4, 'lead_faculty'), (3, 1, 'admin_delegate'),
(4, 5, 'lead_faculty'), (4, 1, 'admin_delegate'),

-- ACADEMIC SUPPORT (5–8)
(5, 2, 'lead_faculty'), (5, 1, 'admin_delegate'),
(6, 3, 'lead_faculty'), (6, 1, 'admin_delegate'),
(7, 4, 'lead_faculty'), (7, 1, 'admin_delegate'),
(8, 5, 'lead_faculty'), (8, 1, 'admin_delegate'),

-- CAREER SERVICES (9–12)
(9, 2, 'lead_faculty'), (9, 1, 'admin_delegate'),
(10, 3, 'lead_faculty'), (10, 1, 'admin_delegate'),
(11, 4, 'lead_faculty'), (11, 1, 'admin_delegate'),
(12, 5, 'lead_faculty'), (12, 1, 'admin_delegate'),

-- HEALTH & WELLNESS (13–16)
(13, 2, 'lead_faculty'), (13, 1, 'admin_delegate'),
(14, 3, 'lead_faculty'), (14, 1, 'admin_delegate'),
(15, 4, 'lead_faculty'), (15, 1, 'admin_delegate'),
(16, 5, 'lead_faculty'), (16, 1, 'admin_delegate'),

-- IT SERVICES (17–20)
(17, 2, 'lead_faculty'), (17, 1, 'admin_delegate'),
(18, 3, 'lead_faculty'), (18, 1, 'admin_delegate'),
(19, 4, 'lead_faculty'), (19, 1, 'admin_delegate'),
(20, 5, 'lead_faculty'), (20, 1, 'admin_delegate'),

-- ACTIVITIES & STUDENT LIFE (21–25)
(21, 2, 'lead_faculty'), (21, 1, 'admin_delegate'),
(22, 3, 'lead_faculty'), (22, 1, 'admin_delegate'),
(23, 4, 'lead_faculty'), (23, 1, 'admin_delegate'),
(24, 5, 'lead_faculty'), (24, 1, 'admin_delegate'),
(25, 6, 'lead_faculty'), (25, 1, 'admin_delegate');


-- SAMPLE ANNOUNCEMENTS
INSERT INTO announcements (title, content, priority, created_by, org_id)
VALUES
('Faculty Meeting Scheduled', 'Mandatory faculty meeting Friday at 3 PM.', 'high', 2, 1),
('Research Grant Applications', 'Apply for new government grants.', 'medium', 2, 1),
('Faculty Development Workshop', 'Training on modern teaching techniques.', 'low', 2, 1);

-- SAMPLE EVENTS (UPDATED TO MATCH NEW COLUMNS)
-- category_id values:
--  3 = Career Services, 5 = IT Services, 6 = Activities & Student Life
-- org_id values:
--  3 = Career Development Center, 5 = IT Services, 6 = Student Activities Office
INSERT INTO events (
  title, description, start_datetime, end_datetime,
  location_id, capacity, category_id, category,
  instructor_email, registration_required, status,
  created_by, org_id, members_only
)
VALUES
-- Career Services Event
('Career Fair 2025', 'Meet top companies',
 '2025-11-15 10:00:00', '2025-11-15 16:00:00',
 (SELECT location_id FROM campus_locations WHERE location_name = 'Main Hall, Student Union'),
 200, 3, 'Career', NULL, 1, 'approved', 1, 3, 0),

-- IT Workshop
('AI Workshop', 'Hands-on workshop on AI and ML.',
 '2025-11-20 14:00:00', '2025-11-20 17:00:00',
 (SELECT location_id FROM campus_locations WHERE location_name = 'Lab 101'),
 50, 5, 'Workshop', 'fac0001@gmail.com', 1, 'approved', 2, 5, 0),

-- Music Event
('Music Concert', 'Enjoy live performances by student bands.',
 '2025-11-25 18:00:00', '2025-11-25 21:00:00',
 (SELECT location_id FROM campus_locations WHERE location_name = 'Auditorium'),
 300, 6, 'Concert', NULL, 0, 'approved', 1, 6, 0);




-- ============================================================
-- ADDITIONAL SAMPLE EVENTS
-- ============================================================

-- 1) Resume Workshop
INSERT INTO events (
 title, description, start_datetime, end_datetime,
 location_id, capacity, category_id, category,
 instructor_email, registration_required, status,
 created_by, org_id, members_only
)
VALUES
('Resume Building Workshop', 'Improve your resume with expert feedback.',
 '2025-12-02 10:00:00', '2025-12-02 12:00:00',
 (SELECT location_id FROM campus_locations WHERE location_name='Success Center 201'),
 40, 3, 'Workshop', 'fac0004@gmail.com', 1, 'approved',
 2, 3, 0);

-- 2) Library Night Study
INSERT INTO events (
 title, description, start_datetime, end_datetime, location_id,
 capacity, category_id, category, registration_required, status,
 created_by, org_id, members_only
)
VALUES
('Library Night Study Session', 'Extended hours with snacks provided.',
 '2025-12-05 18:00:00', '2025-12-06 00:00:00',
 (SELECT location_id FROM campus_locations WHERE location_name='Central Building'),
 100, 1, 'Study', 0, 'approved',
 1, 1, 0);

-- 3) IT Club Meetup
INSERT INTO events (
 title, description, start_datetime, end_datetime, location_id,
 capacity, category_id, category, registration_required, status,
 created_by, org_id, members_only
)
VALUES
('IT Club Private Coding Meetup', 'Exclusive coding session for club members.',
 '2025-12-10 15:00:00', '2025-12-10 17:00:00',
 (SELECT location_id FROM campus_locations WHERE location_name='IT Building 1st Floor'),
 20, 5, 'Meetup', 1, 'approved',
 6, 5, 1);

-- 4) Writing Contest
INSERT INTO events (
 title, description, start_datetime, end_datetime,
 location_id, capacity, category_id, category,
 registration_required, status, created_by, org_id, members_only
)
VALUES
('Creative Writing Contest', 'Submit stories, poems, and essays.',
 '2025-12-15 09:00:00', '2025-12-15 17:00:00',
 (SELECT location_id FROM campus_locations WHERE location_name='Student Union 210'),
 80, 2, 'Contest', 0, 'pending',
 3, 2, 0);


-- 6) Wellness Yoga
INSERT INTO events (
 title, description, start_datetime, end_datetime,
 location_id, capacity, category_id, category,
 registration_required, status, created_by, org_id, members_only
)
VALUES
('Midterm Stress Relief Yoga', 'Relaxing yoga for students.',
 '2025-10-20 08:00:00', '2025-10-20 09:00:00',
 (SELECT location_id FROM campus_locations WHERE location_name='Wellness Center Building'),
 60, 4, 'Wellness', 0, 'approved',
 5, 4, 0);

-- 7) Cultural Fest
INSERT INTO events (
 title, description, start_datetime, end_datetime,
 location_id, capacity, category_id, category,
 registration_required, status, created_by, org_id, members_only
)
VALUES
('Winter Cultural Fest', 'Dance, music, and cultural stalls.',
 '2025-12-22 17:00:00', '2025-12-22 22:00:00',
 (SELECT location_id FROM campus_locations WHERE location_name='Auditorium'),
 500, 6, 'Festival', 0, 'approved',
 1, 6, 0);

-- 8) Cybersecurity Basics
INSERT INTO events (
 title, description, start_datetime, end_datetime,
 location_id, capacity, category_id, category,
 instructor_email, registration_required, status,
 created_by, org_id, members_only
)
VALUES
('Cybersecurity Basics', 'Learn about secure passwords and phishing.',
 '2025-12-08 09:00:00', '2025-12-08 11:00:00',
 (SELECT location_id FROM campus_locations WHERE location_name='IT Building 1st Floor'),
 70, 5, 'Tech', 'fac0001@gmail.com', 1, 'approved',
 2, 5, 0);


INSERT INTO events (
 title, description, start_datetime, end_datetime, location_id,
 capacity, category_id, category, registration_required,
 status, created_by, org_id, members_only
)
VALUES
('Morning Meditation', 'Start your day peacefully.',
 '2025-12-01 07:00:00', '2025-12-01 08:00:00',
 (SELECT location_id FROM campus_locations WHERE location_name='Wellness Center Building'),
 50, 4, 'Wellness', 0, 'approved', 5, 4, 0),

('Career Counseling Drop-In', 'Meet career advisors for quick advice.',
 '2025-12-01 10:00:00', '2025-12-01 13:00:00',
 (SELECT location_id FROM campus_locations WHERE location_name='Admin Building 2nd Floor'),
 30, 3, 'Career', 0, 'approved', 1, 3, 0);
