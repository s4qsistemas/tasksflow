-- ============================================================================
-- TasksFlow - Script de creación de BD (versión con proyectos + recurrencia)
-- ============================================================================

-- Crear BD con UTF-8 completo (acentos OK)
CREATE DATABASE IF NOT EXISTS `tasksflow`
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_general_ci;

USE `tasksflow`;

-- --------------------------------------------------------------------------
-- Limpiar esquema (solo para entorno de desarrollo)
-- --------------------------------------------------------------------------
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS task_commits;
DROP TABLE IF EXISTS task_audit;
DROP TABLE IF EXISTS task_recurring_rules;
DROP TABLE IF EXISTS task_assignments;
DROP TABLE IF EXISTS tasks;
DROP TABLE IF EXISTS projects;
DROP TABLE IF EXISTS team_members;
DROP TABLE IF EXISTS teams;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS areas;
DROP TABLE IF EXISTS roles;
DROP TABLE IF EXISTS companies;

SET FOREIGN_KEY_CHECKS = 1;

-- --------------------------------------------------------------------------
-- Empresas
-- --------------------------------------------------------------------------
CREATE TABLE companies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  description TEXT NULL,
  status ENUM('active','inactive') NOT NULL DEFAULT 'active',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- --------------------------------------------------------------------------
-- Roles
-- --------------------------------------------------------------------------
CREATE TABLE roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE
);

-- --------------------------------------------------------------------------
-- Áreas
-- --------------------------------------------------------------------------
CREATE TABLE areas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  company_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT NULL,
  status ENUM('active','inactive') NOT NULL DEFAULT 'active',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id)
);

-- --------------------------------------------------------------------------
-- Usuarios
-- --------------------------------------------------------------------------
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

-- --------------------------------------------------------------------------
-- Equipos / grupos
-- --------------------------------------------------------------------------
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

-- --------------------------------------------------------------------------
-- Proyectos (nuevo)
-- --------------------------------------------------------------------------
CREATE TABLE projects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  company_id INT NOT NULL,
  name VARCHAR(150) NOT NULL,
  description TEXT,
  status ENUM('active','paused','closed') NOT NULL DEFAULT 'active',
  start_date DATE NULL,
  end_date DATE NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id)
);

-- --------------------------------------------------------------------------
-- Tareas
-- --------------------------------------------------------------------------
CREATE TABLE tasks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  company_id INT NOT NULL,
  project_id INT NULL, -- FK opcional a projects
  title VARCHAR(180) NOT NULL,
  description TEXT,
  status ENUM('pending','in_progress','done','review') NOT NULL DEFAULT 'pending',
  -- NUEVO: prioridad para dashboards y análisis
  priority ENUM('low','normal','high','critical') NOT NULL DEFAULT 'normal',
  -- NUEVO: fecha límite para cálculo de vencidas / atrasos
  deadline DATETIME NULL,
  is_personal BOOLEAN NOT NULL DEFAULT FALSE,
  visibility_scope ENUM('private','team','area','company') NOT NULL DEFAULT 'team',
  creator_id INT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NULL,
  FOREIGN KEY (company_id) REFERENCES companies(id),
  FOREIGN KEY (project_id) REFERENCES projects(id),
  FOREIGN KEY (creator_id) REFERENCES users(id)
);

-- --------------------------------------------------------------------------
-- Asignación de tareas a usuarios
-- --------------------------------------------------------------------------
CREATE TABLE task_assignments (
  task_id INT NOT NULL,
  user_id INT NOT NULL,
  assigned_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (task_id, user_id),
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- --------------------------------------------------------------------------
-- Reglas de recurrencia de tareas (nuevo)
-- --------------------------------------------------------------------------
CREATE TABLE task_recurring_rules (
  id INT AUTO_INCREMENT PRIMARY KEY,
  task_id INT NOT NULL,  -- tarea plantilla
  frequency ENUM('hourly','daily','weekly','monthly') NOT NULL,
  interval_value INT NOT NULL DEFAULT 1,   -- cada 1 día / 3 horas / 2 semanas…
  next_run DATETIME NOT NULL,              -- cuándo se debe generar la próxima tarea
  end_date DATETIME NULL,                  -- opcional: hasta cuándo repetir
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

-- --------------------------------------------------------------------------
-- Trazabilidad tipo "commits" de tarea
-- --------------------------------------------------------------------------
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

-- --------------------------------------------------------------------------
-- Auditoría fina de cambios en tareas
-- --------------------------------------------------------------------------
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

-- ============================================================================
-- SEEDS BÁSICOS
-- ============================================================================

-- Roles base
INSERT INTO roles (name) VALUES ('root'), ('admin'), ('supervisor'), ('user');

-- Empresa demo
INSERT INTO companies (name, description)
VALUES ('Empresa Tasksflow', 'Empresa Demo');

-- Áreas base para la empresa demo
INSERT INTO areas (company_id, name, description)
VALUES
  (1, 'Operaciones',   'Área de operaciones'),
  (1, 'Mantenimiento', 'Mantenimiento planta'),
  (1, 'TI',            'Tecnologías de la información');

-- Usuario Root (global, sin empresa ni área)
INSERT INTO users (
  name, email, password, telephone, role_id,
  company_id, area_id, manager_id, status
)
VALUES (
  'Root',
  'root',
  '$argon2id$v=19$m=65536,t=3,p=1$ICaYTGulVxkeDZ9XT8710A$MgkRdD03JDTo/BOYklVP6VBIn5BTE6swGBHZ6H+NrkE',
  '+56900001111',
  (SELECT id FROM roles WHERE name = 'root'),
  NULL,
  NULL,
  NULL,
  'active'
);

-- ============================================================================
-- NOTAS SOBRE UTF-8 EN WINDOWS / CONSOLA
-- ============================================================================
-- 1) Guardar este archivo como UTF-8 (idealmente UTF-8 sin BOM) en tu editor.
-- 2) En la consola de Windows (CMD/PowerShell), antes de ejecutar:
--      chcp 65001
-- 3) Ejecutar MySQL forzando utf8mb4:
--      mysql -u root -p --default-character-set=utf8mb4 < create_table.sql
--
-- Alternativa equivalente:
--      mysql --default-character-set=utf8mb4 -u root -p tasksflow
--      SOURCE create_table.sql;
