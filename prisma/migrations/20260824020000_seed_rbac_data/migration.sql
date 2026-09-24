-- 初始化 RBAC 角色与权限数据
-- 管理员(admin) 拥有全部后台权限；编辑(editor) 拥有内容管理权限；普通用户(user) 无后台权限

-- 角色
INSERT INTO "roles" ("code", "name", "description", "created_at", "updated_at") VALUES
  ('admin', '管理员', '拥有全部后台管理权限', now(), now()),
  ('editor', '编辑', '可管理内容（题目/竞赛/分类/学习路径）', now(), now()),
  ('user', '普通用户', '仅前台使用，无后台权限', now(), now())
ON CONFLICT ("code") DO NOTHING;

-- 权限点
INSERT INTO "permissions" ("code", "name", "description", "created_at", "updated_at") VALUES
  ('admin:access', '后台访问', '进入后台管理系统的权限', now(), now()),
  ('user:manage', '用户管理', '查看/封禁/调整用户角色', now(), now()),
  ('question:add', '新增题目', '创建题目', now(), now()),
  ('question:manage', '题目管理', '编辑/删除题目、批量删除', now(), now()),
  ('contest:manage', '竞赛管理', '创建/编辑/删除竞赛', now(), now()),
  ('category:manage', '分类管理', '创建/编辑/删除分类', now(), now()),
  ('path:manage', '学习路径管理', '创建/编辑/删除学习路径', now(), now())
ON CONFLICT ("code") DO NOTHING;

-- admin 拥有全部权限
INSERT INTO "role_permissions" ("role_code", "permission_code") VALUES
  ('admin', 'admin:access'),
  ('admin', 'user:manage'),
  ('admin', 'question:add'),
  ('admin', 'question:manage'),
  ('admin', 'contest:manage'),
  ('admin', 'category:manage'),
  ('admin', 'path:manage')
ON CONFLICT ("role_code", "permission_code") DO NOTHING;

-- editor 拥有内容管理权限（不含用户管理与后台总访问之外的 admin:access）
INSERT INTO "role_permissions" ("role_code", "permission_code") VALUES
  ('editor', 'admin:access'),
  ('editor', 'question:add'),
  ('editor', 'question:manage'),
  ('editor', 'contest:manage'),
  ('editor', 'category:manage'),
  ('editor', 'path:manage')
ON CONFLICT ("role_code", "permission_code") DO NOTHING;
