-- ==========================================================================
-- MOFTY DEALERSHIP — Database Schema (car_system)
-- Mirrors the live structure: two tables, admin for login, cars for inventory.
-- Import:  mysql -u root -p < sql/schema.sql   (or paste in phpMyAdmin > SQL)
-- ==========================================================================

CREATE DATABASE IF NOT EXISTS car_system
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE car_system;

-- --------------------------------------------------------------------------
-- Table: admin  — dashboard login credentials
-- Columns used by api/login.php: user_name, password (plain text)
-- --------------------------------------------------------------------------
DROP TABLE IF EXISTS admin;

CREATE TABLE admin (
  id        INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_name VARCHAR(80)  NOT NULL UNIQUE,
  password  VARCHAR(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- One default admin row (change the password!)
INSERT INTO admin (user_name, password)
VALUES ('admin', 'your-password');

-- --------------------------------------------------------------------------
-- Table: cars  — the vehicle inventory
-- Columns read/written by the API:
--   ID, Brand, Model, Price, Image, Transmission, Fuel, Body, Description
-- --------------------------------------------------------------------------
DROP TABLE IF EXISTS cars;

CREATE TABLE cars (
  ID           INT UNSIGNED   NOT NULL AUTO_INCREMENT PRIMARY KEY,
  Brand        VARCHAR(100)   NULL,
  Model        VARCHAR(100)   NULL,
  Price        DECIMAL(10,2)  NULL,
  Image        VARCHAR(255)   NULL,
  Transmission VARCHAR(50)    NULL,
  Fuel         VARCHAR(50)    NULL,
  Body         VARCHAR(50)    NULL,
  Description  TEXT           NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- (Leave the cars table empty — add vehicles from the admin dashboard.)