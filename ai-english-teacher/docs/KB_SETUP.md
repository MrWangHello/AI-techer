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

## 第三步：建表（只做一次）

表已经建好就**不要再跑建表**。你之前跑的旧 SQL 只允许「登录用户」写入，网页没有登录，所以还要补下面这段（允许网页写入，口令在 Bella 里校验）。

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

create policy "anon_insert_entries"
  on content_entries for insert
  to anon
  with check (true);
```

跑完到 **Table Editor** 应能看见表 `content_entries`（这时是空的，正常）。

如果你**已经跑过旧 SQL**（里面是 `authenticated_insert`），再跑这一段即可：

```sql
drop policy if exists "authenticated_insert" on content_entries;
drop policy if exists "authenticated_update" on content_entries;
create policy "anon_insert_entries"
  on content_entries for insert
  to anon
  with check (true);
```

---

## 第四步：家长口令（不再开邮箱登录）

口令**只在 Bella 添加内容那一页的输入框里填**，填 `563876951@qq.com`。  
不要填到 GitHub Secret，不要填到 Supabase 用户表。防的是孩子乱点确认。

---

## 第五步：把两行填进 GitHub（线上网站才能读到）

仓库：`MrWangHello/AI-techer`

1. GitHub → 这个仓库 → **Settings** → **Secrets and variables** → **Actions**  
2. **New repository secret**，建两条：

| Secret 名字（必须一字不差） | 值 |
|------------------------------|-----|
| `NEXT_PUBLIC_SUPABASE_URL` | 第二步的 Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 第二步的 anon public |

`deploy.yml` 构建时会注入这两条。合并进 `main` 并等 Actions 跑完，线上才带得上地址。

本地调试在 `ai-english-teacher/.env.local` 写同样两行。这个文件 **不要提交到 Git**。

---

## 你做完怎么自检

- SQL 跑完，Table Editor 有 `content_entries`  
- GitHub 仓库有那两条 Actions secrets  
- 添加内容时口令填邮箱，设置里把「知识库」勾上  
- 没有把 `service_role` 写进仓库
