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
