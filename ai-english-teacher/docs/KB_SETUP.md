# 知识库：你怎么申请、怎么把地址给我

免费用 **Supabase**（托管的 Postgres）。不要租服务器，不要自建 MySQL。

下面做完，把两行地址发给新开的 agent，再说「按 KB_DESIGN 接云库」。

---

## 你要拿到的两样东西（抄这两行就够）

| 名字 | 长什么样 | 能不能公开 |
|------|----------|------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxxxxxx.supabase.co` | 可以（本来就要写进网页） |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 一长串 `eyJ...` | 可以（只读钥匙）。**不要**抄标着 `service_role` 的那条 |

**不要抄 `service_role`。** 那把钥匙能删整张表，绝不能进 Bella、不能进 Git。

---

## 第一步：注册并开一个项目（约 5 分钟）

1. 打开 https://supabase.com → **Start your project**  
2. 用 GitHub 登录最省事  
3. **New project**  
   - Name：`bella-kb`（随便）  
   - Database password：自己设一个，**记下来**（以后改表偶尔要用，不是给 Bella 的）  
   - Region：选离你近的（东京 `Northeast Asia (Tokyo)` 一般比美国好）  
   - Plan：**Free**  
4. 等项目变成绿色 **Healthy**（第一次可能一两分钟）

国内访问海外库可能慢几秒，免费档如此，先接受。

---

## 第二步：抄地址（Project Settings → API）

左侧最底下 **Project Settings**（齿轮）→ **API**。

抄：

1. **Project URL** → 这就是 `NEXT_PUBLIC_SUPABASE_URL`  
2. **Project API keys** 里 **`anon` `public`** → 这就是 `NEXT_PUBLIC_SUPABASE_ANON_KEY`

不要碰 `service_role`。

---

## 第三步：建表（SQL Editor 一次贴完）

左侧 **SQL Editor** → **New query** → 整段贴进去 → **Run**。

```sql
create table if not exists content_entries (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('word', 'story', 'word_problem', 'joke', 'poem', 'hint')),
  payload jsonb not null,
  locale text not null default 'zh',
  enabled boolean not null default true,
  updated_at timestamptz not null default now()
);

create index if not exists content_entries_kind_enabled_idx
  on content_entries (kind, enabled, updated_at desc);

alter table content_entries enable row level security;

create policy "anon_read_enabled"
  on content_entries for select
  to anon, authenticated
  using (enabled = true);

create policy "authenticated_insert"
  on content_entries for insert
  to authenticated
  with check (true);

create policy "authenticated_update"
  on content_entries for update
  to authenticated
  using (true)
  with check (true);
```

跑完到 **Table Editor** 应能看见表 `content_entries`（这时是空的，正常）。

---

## 第四步：开一个家长登录（写入用）

网站是公开的，不能让路人往库里灌。写入必须登录。

1. 左侧 **Authentication** → **Providers** → **Email** 打开  
2. 为了省事：关掉 **Confirm email**（只要你自己用；开着也行，去邮箱点一下）  
3. **Authentication** → **Users** → **Add user** → **Create new user**  
   - Email：你的邮箱  
   - Password：家长密码（给设置页登录用，不是四位口令）  
4. **Authentication** → **URL Configuration**  
   - Site URL 填：`https://mrwanghello.github.io/AI-techer/`  
   - Redirect URLs 再加一条同样的

---

## 第五步：把两行填进 GitHub（线上网站才能读到）

仓库：`MrWangHello/AI-techer`

1. GitHub → 这个仓库 → **Settings** → **Secrets and variables** → **Actions**  
2. **New repository secret**，建两条：

| Secret 名字（必须一字不差） | 值 |
|------------------------------|-----|
| `NEXT_PUBLIC_SUPABASE_URL` | 第二步的 Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 第二步的 anon public |

现在的 `deploy.yml` **还没有**把这两条打进构建。新 agent 写代码时会补上。你先把 Secret 建好就行。

本地调试（新 agent / 你自己电脑）在 `ai-english-teacher/.env.local` 写同样两行。这个文件 **不要提交到 Git**。

---

## 第六步：发给新 agent 的话（复制即可）

```
云库我已经开好了。按 docs/KB_DESIGN.md + docs/KB_SETUP.md 把 Supabase 接上。

我已经在 GitHub Actions secrets 里放了：
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY

要做的：
1. deploy.yml 构建时注入这两个 secret（避免再空 URL）
2. 装 @supabase/supabase-js，接 content_entries
3. 勾了「知识库」才拉表；确认入库要家长邮箱登录后才能 INSERT
4. 设置页来源勾选、/kb 粘贴预览已经有了，不要再做 JSON 导入
5. 不要把 service_role 写进前端
```

把 Project URL 也贴给 agent 对一下（anon key 很长，有 secrets 即可，不必再贴到聊天里）。

---

## 你做完怎么自检

- SQL 跑完，Table Editor 有 `content_entries`  
- API 页能看见 URL 和 anon  
- GitHub 仓库有那两条 Actions secrets  
- 没有把 `service_role` 发给任何人、没有写进仓库  

做完这些，**不用等这个对话继续写接库代码**——新开一个 agent，把上面第六步贴过去即可。
