-- Drivo MySQL Schema Reference
CREATE DATABASE IF NOT EXISTS drivo_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE drivo_db;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(120) NOT NULL UNIQUE,
    phone VARCHAR(25),
    license_number VARCHAR(30),
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'customer',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cars (
    id INT AUTO_INCREMENT PRIMARY KEY,
    brand VARCHAR(60) NOT NULL,
    model VARCHAR(80) NOT NULL,
    year INT NOT NULL,
    category VARCHAR(40) NOT NULL,
    fuel VARCHAR(30) NOT NULL,
    transmission VARCHAR(30) NOT NULL,
    seats INT NOT NULL,
    price_per_day INT NOT NULL,
    rating FLOAT NOT NULL DEFAULT 4.5,
    location VARCHAR(60) NOT NULL,
    popularity INT NOT NULL DEFAULT 75,
    image VARCHAR(500) NOT NULL,
    images JSON NOT NULL,
    deposit INT NOT NULL DEFAULT 5000,
    available BOOLEAN NOT NULL DEFAULT TRUE,
    features JSON NOT NULL,
    description TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS favorites (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    car_id INT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_user_car_fav (user_id, car_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (car_id) REFERENCES cars(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS coupons (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(30) NOT NULL UNIQUE,
    type VARCHAR(20) NOT NULL,
    value INT NOT NULL,
    category VARCHAR(40),
    weekend_only BOOLEAN NOT NULL DEFAULT FALSE,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    description VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ref VARCHAR(32) NOT NULL UNIQUE,
    user_id INT NULL,
    car_id INT NOT NULL,
    pickup VARCHAR(120) NOT NULL,
    dropoff VARCHAR(120) NOT NULL,
    start_time VARCHAR(32) NOT NULL,
    end_time VARCHAR(32) NOT NULL,
    customer JSON NOT NULL,
    extras JSON NOT NULL,
    pricing JSON NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'Confirmed',
    payment_status VARCHAR(30) NOT NULL DEFAULT 'Pending',
    payment_method VARCHAR(40) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    cancelled_at DATETIME NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (car_id) REFERENCES cars(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS contact_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(120) NOT NULL,
    phone VARCHAR(30) NULL,
    subject VARCHAR(160) NOT NULL,
    message TEXT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
