CREATE DATABASE IF NOT EXISTS musicium_db;

USE musicium_db;

-- ユーザ
CREATE TABLE IF NOT EXISTS users (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  email TEXT NOT NULL,
  image TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS songs (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  color TEXT NOT NULL,
  symbol TEXT NOT NULL,
  chemical_name TEXT NOT NULL,
  style TEXT NOT NULL,
  lyrics TEXT NOT NULL,
  image LONGTEXT NOT NULL,
  url TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
