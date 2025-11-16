-- ============================================================
-- DATABASE: campus_portal
-- AUTHOR: Group4 (Phase 3)
-- ============================================================

-- Drop and recreate database fresh
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
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(role_id)
        ON DELETE RESTRICT ON UPDATE CASCADE
);

-- ============================================================
-- 2. EVENTS
-- ============================================================

DROP TABLE IF EXISTS `events`;
CREATE TABLE `events` (
  `event_id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(200) NOT NULL,
  `description` text,
  `start_datetime` datetime NOT NULL,
  `end_datetime` datetime NOT NULL,
  `location` varchar(200) DEFAULT NULL,
  `capacity` int DEFAULT NULL,
  `category_id` int DEFAULT NULL,
  `category` varchar(100) DEFAULT NULL,
  `instructor_email` varchar(150) DEFAULT NULL,
  `registration_required` tinyint(1) DEFAULT '0',
  `status` enum('pending','approved','rejected') DEFAULT 'pending',
  `created_by` int NOT NULL,
  `approved_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`event_id`),
  UNIQUE KEY `unique_event` (`title`,`start_datetime`,`location`),
  KEY `created_by` (`created_by`),
  KEY `approved_by` (`approved_by`),
  CONSTRAINT `events_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `events_ibfk_2` FOREIGN KEY (`approved_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ============================================================
-- 3. ANNOUNCEMENTS
-- ============================================================

CREATE TABLE announcements (
    announcement_id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    priority ENUM('low','medium','high','urgent') DEFAULT 'medium',
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_announcement UNIQUE (title, created_by),
    FOREIGN KEY (created_by) REFERENCES users(user_id)
        ON DELETE CASCADE ON UPDATE CASCADE
);

-- ============================================================
-- 4. FAVORITES
-- ============================================================

CREATE TABLE favorites (
    favorite_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    item_type ENUM('event','announcement','resource') NOT NULL,
    item_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_favorite UNIQUE (user_id, item_type, item_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
        ON DELETE CASCADE ON UPDATE CASCADE
);

-- ============================================================
-- 5. NOTIFICATIONS
-- ============================================================

CREATE TABLE notifications (
    notification_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    message VARCHAR(255) NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
        ON DELETE CASCADE ON UPDATE CASCADE
);

-- ============================================================
-- 6. EVENT REGISTRATIONS
-- ============================================================

DROP TABLE IF EXISTS `event_registrations`;

CREATE TABLE `event_registrations` (
  `registration_id` int NOT NULL AUTO_INCREMENT,
  `event_id` int NOT NULL,
  `user_id` int NOT NULL,
  `registered_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`registration_id`),
  UNIQUE KEY `event_id` (`event_id`,`user_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `event_registrations_ibfk_1` FOREIGN KEY (`event_id`) REFERENCES `events` (`event_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `event_registrations_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ============================================================
-- 7. SAMPLE DATA
-- ============================================================

INSERT INTO roles (role_name) VALUES ('student'), ('faculty'), ('admin');

-- ------------------------------------------------------
-- SAMPLE USERS
-- ------------------------------------------------------

INSERT INTO users (first_name, last_name, user_uid, email, password_hash, role_id)
VALUES
('System', 'Admin', 'adm0001', 'adm0001@gmail.com',
 '$2a$10$O3V6.PCv42.rjSKslUt3vO0ktxOTvhaLI.ZYyOpvfoIGgQfKuSUAC', 3), 

('Alice', 'Faculty', 'fac0006', 'fac0006@gmail.com',
 '$2a$10$0T0VOYrqBqhIlYvT0nRm.OUFwa3.nuDZ8SG/zchbZ9ZsEVll2xpY.', 2),

('Alice', 'Faculty', 'fac0005', 'fac0005@gmail.com',
 '$2a$10$Opi0eknm8c5n3wlgwXzC5utztgQuuenWWxRFxc8As052U9yiHWUfS', 2), 

('Alice', 'Faculty', 'fac0004', 'fac0004@gmail.com',
 '$2a$10$d1dNmwGVoCaRDZrIoQy29usriQaq0P3FA05A0TxMe0ExKKu/1/cO.', 2),

('Alice', 'Faculty', 'fac0003', 'fac0003@gmail.com',
 '$2a$10$1ZaRyvGA9PbpgvfIxeou5O5cfwe1Hig/2md/i3hElWUy4otxGJA.y', 2),

('Alice', 'Faculty', 'fac0002', 'fac0002@gmail.com',
 '$2a$10$KPyfTBLXS9lSLDXdKmDrYeVcsqsqt4gqTQ7agqLZdvaChXkg8u4Oe', 2),

('Alice', 'Faculty', 'fac0001', 'fac0001@gmail.com',
 '$2a$10$jOeOu5nm3qsxZzfTJOJ/YeGoedwZK0alkuU/daw1sFhUwt1bmKsQi', 2),

('Bob', 'Student', 'stu0001', 'stu0001@gmail.com',
 '$2a$10$ydPYgxkqPJoKT4wzjKYfTuUujMGfN19zqYj5kVa0BC0PjQPSwXNo6', 1);


-- Sample Events (duplicates prevented by unique constraint)
INSERT INTO events (title, description, start_datetime, end_datetime, location, capacity, category, instructor_email, registration_required, status, created_by)
VALUES 
('Career Fair 2025', 'Meet top companies and explore career opportunities.', 
 '2025-11-15 10:00:00', '2025-11-15 16:00:00', 'Main Hall, Student Union', 200, 'Career', NULL, 1, 'approved', 1),
('AI Workshop', 'Hands-on workshop on AI and Machine Learning.', 
 '2025-11-20 14:00:00', '2025-11-20 17:00:00', 'Lab 101', 50, 'Workshop', 'fac0001@gmail.com', 1, 'approved', 2),
('Music Concert', 'Enjoy live performances by student bands.', 
 '2025-11-25 18:00:00', '2025-11-25 21:00:00', 'Auditorium', 300, 'Concert', NULL, 0, 'approved', 1),
('Guest Lecture: Quantum Computing', 'Lecture by Dr. Quantum on future computing trends.', 
 '2025-12-01 11:00:00', '2025-12-01 12:30:00', 'Lecture Hall 3', 100, 'Lecture', 'fac0002@gmail.com', 1, 'approved', 2),
('Sports Meet', 'Annual inter-college sports event.', 
 '2025-12-05 09:00:00', '2025-12-05 17:00:00', 'Sports Ground', 500, 'Sports', NULL, 0, 'approved', 1);

-- Sample Announcements
INSERT INTO announcements (title, content, priority, created_by)
VALUES
('Faculty Meeting Scheduled', 'A mandatory faculty meeting will be held in the Seminar Hall on Friday at 3 PM.', 'high', 2),
('Research Grant Applications', 'Faculty members are encouraged to apply for the upcoming government-funded research grants.', 'medium', 2),
('Faculty Development Workshop', 'A workshop on modern teaching techniques will be conducted next Monday.', 'low', 2),
('Performance Review Reminder', 'Faculty are reminded to submit their annual performance reports by the end of this month.', 'urgent', 2),
('New Publication Guidelines', 'Updated guidelines for publishing research papers have been released by the Academic Council.', 'medium', 2),
('Conference Travel Support', 'Faculty can now apply for travel reimbursement for attending international conferences.', 'low', 2),
('Curriculum Review Committee', 'Faculty volunteers are requested to join the curriculum review committee for the upcoming academic year.', 'medium', 2),
('Faculty Leave Policy Update', 'The leave policy for faculty has been revised. Please check the HR portal for details.', 'high', 2);

-- ============================================================
-- END OF SCRIPT
-- ============================================================
