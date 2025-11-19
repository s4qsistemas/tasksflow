-- Crear DB mysql -u root -p < create_table.sql
CREATE DATABASE IF NOT EXISTS `tasksflow`
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_general_ci;
USE `tasksflow`;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS task_commits;
DROP TABLE IF EXISTS task_audit;
DROP TABLE IF EXISTS task_assignments;
DROP TABLE IF EXISTS tasks;
DROP TABLE IF EXISTS team_members;
DROP TABLE IF EXISTS teams;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS areas;
DROP TABLE IF EXISTS roles;
SET FOREIGN_KEY_CHECKS = 1;

-- Roles
CREATE TABLE roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE
);

-- Áreas
CREATE TABLE areas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE
);

-- Usuarios (con manager_id para cadena jerárquica)
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  telephone VARCHAR(30),
  role_id INT NOT NULL,
  area_id INT NULL,
  manager_id INT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (role_id) REFERENCES roles(id),
  FOREIGN KEY (area_id) REFERENCES areas(id),
  FOREIGN KEY (manager_id) REFERENCES users(id)
);

-- Equipos (teams)
CREATE TABLE teams (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  created_by INT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE team_members (
  team_id INT NOT NULL,
  user_id INT NOT NULL,
  PRIMARY KEY (team_id, user_id),
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Tareas (estado actual/snapshot)
CREATE TABLE tasks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(180) NOT NULL,
  description TEXT,
  status ENUM('pending','in_progress','done','review') NOT NULL DEFAULT 'pending',
  is_personal BOOLEAN NOT NULL DEFAULT FALSE,
  visibility_scope ENUM('private','supervisor','area','org') NOT NULL DEFAULT 'private',
  creator_id INT NOT NULL,
  due_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (creator_id) REFERENCES users(id)
);

-- Asignaciones (múltiples destinatarios)
CREATE TABLE task_assignments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  task_id INT NOT NULL,
  user_id INT NOT NULL,
  UNIQUE KEY uq_task_user (task_id, user_id),
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Commits estilo Git (historial inmutable)
CREATE TABLE task_commits (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  task_id INT NOT NULL,
  hash CHAR(64) NOT NULL,
  parent_hash CHAR(64) NULL,
  author_id INT NOT NULL,
  message VARCHAR(255) NOT NULL,
  changes JSON NULL,      -- diff aplicado (parcial)
  snapshot JSON NULL,     -- snapshot completo después del commit
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_hash (hash),
  INDEX idx_task (task_id, id),
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (author_id) REFERENCES users(id)
);

-- Seeds básicos (ajusta en producción)
INSERT INTO roles (name) VALUES ('root'), ('admin'), ('supervisor'), ('user');
INSERT INTO areas (name) VALUES ('Operaciones'), ('Mantenimiento'), ('TI');

INSERT INTO users (name, email, password, telephone, role_id, area_id)
VALUES
('Root', 'root', 'root1234', '+56900001111', (SELECT id FROM roles WHERE name='root'), NULL),
('Admin', 'admin', 'admin1234', '+56900002222', (SELECT id FROM roles WHERE name='admin'), NULL),
('Supervisor', 'super', 'sup1234', '+56900003333', (SELECT id FROM roles WHERE name='supervisor'), (SELECT id FROM areas WHERE name='Mantenimiento')),
('User', 'user', 'user1234', '+56900004444', (SELECT id FROM roles WHERE name='user'), (SELECT id FROM areas WHERE name='Mantenimiento'));
