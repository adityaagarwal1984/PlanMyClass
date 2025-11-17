-- MySQL schema for timetable generator

CREATE DATABASE IF NOT EXISTS timetable_db;
USE timetable_db;

CREATE TABLE IF NOT EXISTS admin (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS faculty (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255),
  username VARCHAR(100) UNIQUE,
  password VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS section (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50),
  year INT
);

CREATE TABLE IF NOT EXISTS subject (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255),
  year INT,
  semester INT
);

CREATE TABLE IF NOT EXISTS faculty_subject (
  id INT AUTO_INCREMENT PRIMARY KEY,
  faculty_id INT,
  subject_id INT,
  section_id INT,
  FOREIGN KEY (faculty_id) REFERENCES faculty(id) ON DELETE CASCADE,
  FOREIGN KEY (subject_id) REFERENCES subject(id) ON DELETE CASCADE,
  FOREIGN KEY (section_id) REFERENCES section(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS timetable (
  id INT AUTO_INCREMENT PRIMARY KEY,
  section_id INT,
  day VARCHAR(20),
  period INT,
  subject_id INT,
  faculty_id INT,
  FOREIGN KEY (section_id) REFERENCES section(id) ON DELETE CASCADE,
  FOREIGN KEY (subject_id) REFERENCES subject(id) ON DELETE SET NULL,
  FOREIGN KEY (faculty_id) REFERENCES faculty(id) ON DELETE SET NULL
);

-- Seed example data (admin password will need to be hashed before inserting in production)
-- Use the app's README instructions to seed initial admin and sample data

-- Periods table: maps period numbers to human-friendly labels and times.
CREATE TABLE IF NOT EXISTS periods (
  id INT AUTO_INCREMENT PRIMARY KEY,
  label VARCHAR(50),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_lab BOOLEAN DEFAULT FALSE
);

-- Example periods (adjust times as needed)
INSERT INTO periods (label, start_time, end_time) VALUES
('P1', '09:00:00', '09:55:00'),
('P2', '09:56:00', '10:50:00'),
('P3', '10:51:00', '11:45:00'),
('P4', '11:46:00', '12:40:00'),
('Lunch', '12:41:00', '13:20:00'),
('P5', '13:21:00', '14:15:00'),
('P6', '14:16:00', '15:10:00'),
('P7', '15:11:00', '16:00:00'),
('P8', '16:01:00', '16:50:00');