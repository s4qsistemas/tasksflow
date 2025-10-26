-- SET time_zone = '+00:00';

-- ========================================
-- Crear base de datos y usarla
-- ========================================
CREATE DATABASE IF NOT EXISTS `tasksflow` 
  DEFAULT CHARACTER SET utf8mb4 
  COLLATE utf8mb4_general_ci;

USE `tasksflow`;

-- Evita errores por dependencias de FK al eliminar
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS `users`;
DROP TABLE IF EXISTS `roles`;
SET FOREIGN_KEY_CHECKS = 1;

-- ======================
-- Tabla: roles
-- ======================
CREATE TABLE `roles` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) COLLATE utf8mb4_general_ci NOT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_roles_name` (`name`)
) ENGINE=InnoDB
  AUTO_INCREMENT=1
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_general_ci;

-- ======================
-- Tabla: users
-- ======================
CREATE TABLE `users` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) COLLATE utf8mb4_general_ci NOT NULL,
  `email` VARCHAR(255) COLLATE utf8mb4_general_ci NOT NULL,
  `password` VARCHAR(255) COLLATE utf8mb4_general_ci NOT NULL,
  `telephone` VARCHAR(20) COLLATE utf8mb4_general_ci NOT NULL,
  `role_id` INT NOT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_users_email` (`email`),
  KEY `idx_users_name` (`name`),
  KEY `idx_users_telephone` (`telephone`),
  CONSTRAINT `fk_users_role_id`
    FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`)
    ON UPDATE RESTRICT
    ON DELETE RESTRICT
) ENGINE=InnoDB
  AUTO_INCREMENT=1
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_general_ci;

-- ======================
-- Seeds opcionales
-- ======================
INSERT INTO `roles` (`name`) VALUES
  ('root'),
  ('admin'),
  ('user');

-- Ejemplo de usuario (password de ejemplo, NO en claro en producción)
INSERT INTO `users` (`name`, `email`, `password`, `telephone`, `role_id`)
VALUES ('root', 'root@example.com', 'root1234', '+56900001111', 1);

-- mysql -u root -p < .\create_table.sql
