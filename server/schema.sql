-- Run this in GreenGeeks cPanel → phpMyAdmin
-- Urban Grantroots MySQL Schema

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  email_verified BOOLEAN DEFAULT FALSE,
  verification_token VARCHAR(255),
  reset_token VARCHAR(255),
  reset_token_expires DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS profiles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  organization_name VARCHAR(255),
  organization_type ENUM(
    'nonprofit_501c3','nonprofit_501c4','educational',
    'government','individual','for_profit','faith_based'
  ),
  focus_areas JSON DEFAULT ('[]'),
  geographic_focus ENUM('local','state','regional','national','international') DEFAULT 'national',
  website VARCHAR(255),
  ein VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS saved_grants (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  grant_id VARCHAR(100) NOT NULL,
  status ENUM('saved','applied','awarded','rejected') DEFAULT 'saved',
  notes TEXT,
  alert_7_days BOOLEAN DEFAULT FALSE,
  alert_3_days BOOLEAN DEFAULT FALSE,
  saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_grant (user_id, grant_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS search_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  query VARCHAR(500) NOT NULL,
  filters JSON DEFAULT ('{}'),
  searched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
