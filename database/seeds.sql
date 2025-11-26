-- =======================================
-- USERS SEED (12 usuarios en total)
-- 6 por cada empresa, 2 por cada área:
--   - 1 supervisor (role: supervisor)
--   - 1 user (role: user)
-- =======================================

-- Contraseña común para TODOS (mismo hash)
SET @common_pass := '$argon2id$v=19$m=65536,t=3,p=1$X101lOIANXl6+MCe/qNezw$L2ru8jWjbGwxLsnBk9FnmjFtMxonxXSFp/gHk7pSKXA';

-- ==========================
-- Empresa Tasksflow
-- ==========================

-- Supervisores (manager_id NULL por ahora)
INSERT INTO users (
  name, email, password, telephone, role_id,
  company_id, area_id, manager_id, status
)
VALUES
(
  'Sup Operaciones TF',
  'sup_operaciones_tf',
  @common_pass,
  '+56900001001',
  (SELECT id FROM roles WHERE name = 'supervisor'),
  (SELECT id FROM companies WHERE name = 'Empresa Tasksflow'),
  (SELECT id FROM areas
     WHERE name = 'Operaciones'
       AND company_id = (SELECT id FROM companies WHERE name = 'Empresa Tasksflow')),
  NULL,
  'active'
),
(
  'Sup Mantenimiento TF',
  'sup_mantenimiento_tf',
  @common_pass,
  '+56900001002',
  (SELECT id FROM roles WHERE name = 'supervisor'),
  (SELECT id FROM companies WHERE name = 'Empresa Tasksflow'),
  (SELECT id FROM areas
     WHERE name = 'Mantenimiento'
       AND company_id = (SELECT id FROM companies WHERE name = 'Empresa Tasksflow')),
  NULL,
  'active'
),
(
  'Sup TI TF',
  'sup_ti_tf',
  @common_pass,
  '+56900001003',
  (SELECT id FROM roles WHERE name = 'supervisor'),
  (SELECT id FROM companies WHERE name = 'Empresa Tasksflow'),
  (SELECT id FROM areas
     WHERE name = 'TI'
       AND company_id = (SELECT id FROM companies WHERE name = 'Empresa Tasksflow')),
  NULL,
  'active'
);

-- Guardamos IDs de supervisores TF
SET @sup_op_tf  := (SELECT id FROM users WHERE email = 'sup_operaciones_tf');
SET @sup_man_tf := (SELECT id FROM users WHERE email = 'sup_mantenimiento_tf');
SET @sup_ti_tf  := (SELECT id FROM users WHERE email = 'sup_ti_tf');

-- Users por área (manager_id = supervisor del área)
INSERT INTO users (
  name, email, password, telephone, role_id,
  company_id, area_id, manager_id, status
)
VALUES
(
  'User Operaciones TF',
  'user_operaciones_tf',
  @common_pass,
  '+56900001101',
  (SELECT id FROM roles WHERE name = 'user'),
  (SELECT id FROM companies WHERE name = 'Empresa Tasksflow'),
  (SELECT id FROM areas
     WHERE name = 'Operaciones'
       AND company_id = (SELECT id FROM companies WHERE name = 'Empresa Tasksflow')),
  @sup_op_tf,
  'active'
),
(
  'User Mantenimiento TF',
  'user_mantenimiento_tf',
  @common_pass,
  '+56900001102',
  (SELECT id FROM roles WHERE name = 'user'),
  (SELECT id FROM companies WHERE name = 'Empresa Tasksflow'),
  (SELECT id FROM areas
     WHERE name = 'Mantenimiento'
       AND company_id = (SELECT id FROM companies WHERE name = 'Empresa Tasksflow')),
  @sup_man_tf,
  'active'
),
(
  'User TI TF',
  'user_ti_tf',
  @common_pass,
  '+56900001103',
  (SELECT id FROM roles WHERE name = 'user'),
  (SELECT id FROM companies WHERE name = 'Empresa Tasksflow'),
  (SELECT id FROM areas
     WHERE name = 'TI'
       AND company_id = (SELECT id FROM companies WHERE name = 'Empresa Tasksflow')),
  @sup_ti_tf,
  'active'
);

-- ==========================
-- Empresa Demo
-- ==========================

-- Supervisores Demo
INSERT INTO users (
  name, email, password, telephone, role_id,
  company_id, area_id, manager_id, status
)
VALUES
(
  'Sup Operaciones Demo',
  'sup_operaciones_demo',
  @common_pass,
  '+56900002001',
  (SELECT id FROM roles WHERE name = 'supervisor'),
  (SELECT id FROM companies WHERE name = 'Empresa Demo'),
  (SELECT id FROM areas
     WHERE name = 'Operaciones'
       AND company_id = (SELECT id FROM companies WHERE name = 'Empresa Demo')),
  NULL,
  'active'
),
(
  'Sup Mantenimiento Demo',
  'sup_mantenimiento_demo',
  @common_pass,
  '+56900002002',
  (SELECT id FROM roles WHERE name = 'supervisor'),
  (SELECT id FROM companies WHERE name = 'Empresa Demo'),
  (SELECT id FROM areas
     WHERE name = 'Mantenimiento'
       AND company_id = (SELECT id FROM companies WHERE name = 'Empresa Demo')),
  NULL,
  'active'
),
(
  'Sup TI Demo',
  'sup_ti_demo',
  @common_pass,
  '+56900002003',
  (SELECT id FROM roles WHERE name = 'supervisor'),
  (SELECT id FROM companies WHERE name = 'Empresa Demo'),
  (SELECT id FROM areas
     WHERE name = 'TI'
       AND company_id = (SELECT id FROM companies WHERE name = 'Empresa Demo')),
  NULL,
  'active'
);

-- IDs supervisores Demo
SET @sup_op_demo  := (SELECT id FROM users WHERE email = 'sup_operaciones_demo');
SET @sup_man_demo := (SELECT id FROM users WHERE email = 'sup_mantenimiento_demo');
SET @sup_ti_demo  := (SELECT id FROM users WHERE email = 'sup_ti_demo');

-- Users por área Demo
INSERT INTO users (
  name, email, password, telephone, role_id,
  company_id, area_id, manager_id, status
)
VALUES
(
  'User Operaciones Demo',
  'user_operaciones_demo',
  @common_pass,
  '+56900002101',
  (SELECT id FROM roles WHERE name = 'user'),
  (SELECT id FROM companies WHERE name = 'Empresa Demo'),
  (SELECT id FROM areas
     WHERE name = 'Operaciones'
       AND company_id = (SELECT id FROM companies WHERE name = 'Empresa Demo')),
  @sup_op_demo,
  'active'
),
(
  'User Mantenimiento Demo',
  'user_mantenimiento_demo',
  @common_pass,
  '+56900002102',
  (SELECT id FROM roles WHERE name = 'user'),
  (SELECT id FROM companies WHERE name = 'Empresa Demo'),
  (SELECT id FROM areas
     WHERE name = 'Mantenimiento'
       AND company_id = (SELECT id FROM companies WHERE name = 'Empresa Demo')),
  @sup_man_demo,
  'active'
),
(
  'User TI Demo',
  'user_ti_demo',
  @common_pass,
  '+56900002103',
  (SELECT id FROM roles WHERE name = 'user'),
  (SELECT id FROM companies WHERE name = 'Empresa Demo'),
  (SELECT id FROM areas
     WHERE name = 'TI'
       AND company_id = (SELECT id FROM companies WHERE name = 'Empresa Demo')),
  @sup_ti_demo,
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