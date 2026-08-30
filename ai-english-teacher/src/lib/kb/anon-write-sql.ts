/** 旧建表 SQL 只允许登录用户写入。网页没有登录，还要跑这一段。 */
export const ANON_WRITE_SQL = `drop policy if exists "authenticated_insert" on content_entries;
drop policy if exists "authenticated_update" on content_entries;
create policy "anon_insert_entries"
  on content_entries for insert
  to anon
  with check (true);`;
