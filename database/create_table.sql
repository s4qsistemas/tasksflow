-- Crear DB mysql -u root -p < create_table.sql
-- Crear DB
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
DROP TABLE IF EXISTS companies;
SET FOREIGN_KEY_CHECKS = 1;

-- Empresas
CREATE TABLE companies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  description TEXT NULL,
  status ENUM('active','inactive') NOT NULL DEFAULT 'active',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Roles
CREATE TABLE roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE
);

-- Áreas
CREATE TABLE areas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  company_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT NULL,
  status ENUM('active','inactive') NOT NULL DEFAULT 'active',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id)
);

-- Usuarios
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  telephone VARCHAR(30),
  role_id INT NOT NULL,
  company_id INT NULL,
  area_id INT NULL,
  manager_id INT NULL,
  status ENUM('active','suspended') NOT NULL DEFAULT 'active',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (role_id) REFERENCES roles(id),
  FOREIGN KEY (company_id) REFERENCES companies(id),
  FOREIGN KEY (area_id) REFERENCES areas(id),
  FOREIGN KEY (manager_id) REFERENCES users(id)
);

-- Equipos / grupos
CREATE TABLE teams (
  id INT AUTO_INCREMENT PRIMARY KEY,
  company_id INT NOT NULL,
  name VARCHAR(150) NOT NULL,
  description TEXT NULL,
  type ENUM('area_team','project','committee','shift','other') NOT NULL DEFAULT 'other',
  status ENUM('active','paused','closed') NOT NULL DEFAULT 'active',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id)
);

CREATE TABLE team_members (
  team_id INT NOT NULL,
  user_id INT NOT NULL,
  role_in_team ENUM('member','leader') NOT NULL DEFAULT 'member',
  PRIMARY KEY (team_id, user_id),
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Tareas
CREATE TABLE tasks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  company_id INT NOT NULL,
  title VARCHAR(180) NOT NULL,
  description TEXT,
  status ENUM('pending','in_progress','done','review') NOT NULL DEFAULT 'pending',
  is_personal BOOLEAN NOT NULL DEFAULT FALSE,
  visibility_scope ENUM('private','team','area','company') NOT NULL DEFAULT 'team',
  creator_id INT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NULL,
  FOREIGN KEY (company_id) REFERENCES companies(id),
  FOREIGN KEY (creator_id) REFERENCES users(id)
);

CREATE TABLE task_assignments (
  task_id INT NOT NULL,
  user_id INT NOT NULL,
  assigned_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (task_id, user_id),
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Trazabilidad tipo commits
CREATE TABLE task_commits (
  id INT AUTO_INCREMENT PRIMARY KEY,
  task_id INT NOT NULL,
  author_id INT NOT NULL,
  message TEXT,
  from_status ENUM('pending','in_progress','done','review') NULL,
  to_status   ENUM('pending','in_progress','done','review') NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (author_id) REFERENCES users(id)
);

-- Auditoría fina
CREATE TABLE task_audit (
  id INT AUTO_INCREMENT PRIMARY KEY,
  task_id INT NOT NULL,
  actor_id INT NOT NULL,
  action_type VARCHAR(50) NOT NULL,
  field_name VARCHAR(100) NULL,
  old_value TEXT NULL,
  new_value TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (actor_id) REFERENCES users(id)
);

-- =======================================
-- SEEDS BÁSICOS
-- =======================================

-- Roles
INSERT INTO roles (name) VALUES ('root'), ('admin'), ('supervisor'), ('user');

-- Empresas
INSERT INTO companies (name, description)
VALUES ('Empresa Tasksflow', 'Empresa Demo');

-- Áreas base de la empresa Tasksflow
INSERT INTO areas (company_id, name, description)
VALUES
  (1, 'Operaciones',   'Área de operaciones'),
  (1, 'Mantenimiento', 'Mantenimiento planta'),
  (1, 'TI',            'Tecnologías de la información');

-- =======================================
-- USERS SEED
-- Schema asumido:
-- users(name,email,password,telephone,role_id,company_id,area_id,manager_id,status)
-- =======================================

-- 1) Root (global, sin empresa ni área)
INSERT INTO users (
  name, email, password, telephone, role_id,
  company_id, area_id, manager_id, status
)
VALUES (
  'Root',
  'root',
  '$argon2id$v=19$m=65536,t=3,p=1$C/Kg5wBqW2IqPB2YovmflQ$wmW25IShpvQHnrpho+qIXmU0cDPnz3mdHNEmBJE0NUE',
  '+56900001111',
  (SELECT id FROM roles WHERE name = 'root'),
  NULL,
  NULL,
  NULL,
  'active'
);

-- 2) Admin principal para Empresa Tasksflow
INSERT INTO users (
  name, email, password, telephone, role_id,
  company_id, area_id, manager_id, status
)
VALUES (
  'Admin Tasksflow',
  'admin',  -- ojo: este es el email que usaremos abajo
  '$argon2id$v=19$m=65536,t=3,p=1$X101lOIANXl6+MCe/qNezw$L2ru8jWjbGwxLsnBk9FnmjFtMxonxXSFp/gHk7pSKXA',
  '+56900002222',
  (SELECT id FROM roles WHERE name = 'admin'),
  (SELECT id FROM companies WHERE name = 'Empresa Tasksflow'),
  NULL,
  NULL,
  'active'
);

-- 3) Segundo admin: admin_demo (misma contraseña hasheada que el admin anterior)
INSERT INTO users (
  name, email, password, telephone, role_id,
  company_id, area_id, manager_id, status
)
VALUES (
  'Admin Demo',
  'admin_demo',
  '$argon2id$v=19$m=65536,t=3,p=1$X101lOIANXl6+MCe/qNezw$L2ru8jWjbGwxLsnBk9FnmjFtMxonxXSFp/gHk7pSKXA',
  '+56900002223',
  (SELECT id FROM roles WHERE name = 'admin'),
  (SELECT id FROM companies WHERE name = 'Empresa Tasksflow'),
  NULL,
  NULL,
  'active'
);

-- =======================================
-- 4) Supervisores: uno por área, todos dependen del Admin Tasksflow
--    Usamos una variable para evitar el ERROR 1093
-- =======================================

-- Guardamos el id del admin en una variable
SET @admin_tasksflow_id := (
  SELECT id FROM users WHERE email = 'admin'
);

INSERT INTO users (
  name, email, password, telephone, role_id,
  company_id, area_id, manager_id, status
)
VALUES
-- Supervisor Operaciones
(
  'Sup Operaciones',
  'sup_operaciones',
  '$argon2id$v=19$m=65536,t=3,p=1$5Ska27HBafeek1eXvFPVJw$f68PjwlEerUm68bbxBOFayBKhfVY2RMkYehNa6qxqlY',
  '+56900003331',
  (SELECT id FROM roles WHERE name = 'supervisor'),
  (SELECT id FROM companies WHERE name = 'Empresa Tasksflow'),
  (SELECT id FROM areas
     WHERE name = 'Operaciones'
       AND company_id = (SELECT id FROM companies WHERE name = 'Empresa Tasksflow')),
  @admin_tasksflow_id,
  'active'
),
-- Supervisor Mantenimiento
(
  'Sup Mantenimiento',
  'sup_mantenimiento',
  '$argon2id$v=19$m=65536,t=3,p=1$5Ska27HBafeek1eXvFPVJw$f68PjwlEerUm68bbxBOFayBKhfVY2RMkYehNa6qxqlY',
  '+56900003332',
  (SELECT id FROM roles WHERE name = 'supervisor'),
  (SELECT id FROM companies WHERE name = 'Empresa Tasksflow'),
  (SELECT id FROM areas
     WHERE name = 'Mantenimiento'
       AND company_id = (SELECT id FROM companies WHERE name = 'Empresa Tasksflow')),
  @admin_tasksflow_id,
  'active'
),
-- Supervisor TI
(
  'Sup TI',
  'sup_ti',
  '$argon2id$v=19$m=65536,t=3,p=1$5Ska27HBafeek1eXvFPVJw$f68PjwlEerUm68bbxBOFayBKhfVY2RMkYehNa6qxqlY',
  '+56900003333',
  (SELECT id FROM roles WHERE name = 'supervisor'),
  (SELECT id FROM companies WHERE name = 'Empresa Tasksflow'),
  (SELECT id FROM areas
     WHERE name = 'TI'
       AND company_id = (SELECT id FROM companies WHERE name = 'Empresa Tasksflow')),
  @admin_tasksflow_id,
  'active'
);