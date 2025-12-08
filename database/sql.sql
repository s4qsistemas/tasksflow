describe projects;
select id,company_id,area_id,creator_id,name,description,status from projects;

describe tasks;
select id,company_id,project_id,title,description,status,is_personal,visibility_scope,creator_id from tasks;

-- todos los proyectos del rep.user.id:
-- consultas anidadas
SELECT DISTINCT p.id,p.company_id,p.area_id,p.creator_id,p.name,p.status FROM projects p WHERE p.id IN (SELECT t.project_id FROM tasks t WHERE t.id IN (SELECT ta.task_id FROM task_assignments ta WHERE ta.user_id=8) OR t.creator_id=8) OR p.creator_id=8;
-- join
SELECT DISTINCT p.id,p.company_id,p.area_id,p.creator_id,p.name,p.status FROM projects p LEFT JOIN tasks t ON t.project_id=p.id LEFT JOIN task_assignments ta ON ta.task_id=t.id WHERE ta.user_id=8 OR t.creator_id=8 OR p.creator_id=8;

-- todas las tareas del rep.user.id
SELECT t.project_id FROM tasks t WHERE t.id IN (SELECT ta.task_id FROM task_assignments ta WHERE ta.user_id=8) OR t.creator_id=8;