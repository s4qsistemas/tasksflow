describe projects;
select id,company_id,area_id,creator_id,name,description,status from projects;

describe tasks;
select id,company_id,project_id,title,description,status,is_personal,visibility_scope,creator_id from tasks;