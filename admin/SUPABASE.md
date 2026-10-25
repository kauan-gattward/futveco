# Migrar a área do professor para o Supabase

Hoje a demo guarda tudo no **localStorage** do navegador (`admin/data.js`). Cada aparelho tem seus próprios dados e o login é só de demonstração.
Com o Supabase os dados ficam num banco Postgres na nuvem, compartilhados entre os professores, e o login passa a ser real (Supabase Auth).

## 1. Criar o projeto
1. Crie um projeto em https://supabase.com (região São Paulo).
2. Em **Authentication → Users**, crie os usuários dos professores (e-mail + senha). Desative o cadastro público em **Authentication → Providers → Email → "Allow new users to sign up"**.
3. Em **SQL Editor**, rode o script abaixo.

## 2. Esquema (SQL)
```sql
-- Professores autorizados (vincule ao usuário do Supabase Auth)
create table public.professores (
  user_id uuid primary key references auth.users(id) on delete cascade,
  nome text not null,
  instagram text,
  criado_em timestamptz not null default now()
);

create table public.alunos (
  id uuid primary key default gen_random_uuid(),
  nome text not null check (char_length(nome) between 1 and 120),
  telefone text, email text,
  nivel text not null default 'iniciante' check (nivel in ('iniciante','intermediário','avançado')),
  status text not null default 'ativo' check (status in ('ativo','inativo')),
  desde date, nascimento date, observacoes text,
  criado_em timestamptz not null default now()
);

create table public.planos (
  id uuid primary key default gen_random_uuid(),
  nome text not null, aulas_semana int not null check (aulas_semana > 0),
  valor numeric(10,2) not null check (valor >= 0),
  criado_em timestamptz not null default now()
);

create table public.matriculas (
  id uuid primary key default gen_random_uuid(),
  aluno_id uuid not null references public.alunos(id) on delete cascade,
  plano_id uuid not null references public.planos(id) on delete restrict,
  inicio date not null, dia_vencimento int not null check (dia_vencimento between 1 and 28),
  status text not null default 'ativa' check (status in ('ativa','cancelada')),
  criado_em timestamptz not null default now()
);

create table public.pagamentos (
  id uuid primary key default gen_random_uuid(),
  matricula_id uuid references public.matriculas(id) on delete cascade,
  aluno_id uuid not null references public.alunos(id) on delete cascade,
  referencia char(7) not null,              -- 'AAAA-MM'
  valor numeric(10,2) not null, vencimento date not null,
  status text not null default 'aberto' check (status in ('aberto','pago')),
  pago_em date,
  criado_em timestamptz not null default now(),
  unique (matricula_id, referencia)
);

create table public.turmas (
  id uuid primary key default gen_random_uuid(),
  nome text not null, modalidade text not null default 'futevôlei',
  dia_semana int not null check (dia_semana between 0 and 6),  -- 0 = domingo
  hora time not null, duracao int not null default 60,
  professor text not null, vagas int not null check (vagas > 0),
  nivel text, aluno_ids uuid[] not null default '{}',
  criado_em timestamptz not null default now()
);

create table public.presencas (
  id uuid primary key default gen_random_uuid(),
  turma_id uuid not null references public.turmas(id) on delete cascade,
  data date not null, presentes uuid[] not null default '{}',
  criado_em timestamptz not null default now(),
  unique (turma_id, data)
);

create table public.agendamentos (
  id uuid primary key default gen_random_uuid(),
  aluno_id uuid references public.alunos(id) on delete set null,
  nome text not null, telefone text, data date not null, hora time not null,
  professor text, tipo text not null default 'avulsa' check (tipo in ('avulsa','particular')),
  status text not null default 'agendado' check (status in ('agendado','confirmado','cancelado')),
  obs text, criado_em timestamptz not null default now()
);

create table public.experimentais (
  id uuid primary key default gen_random_uuid(),
  nome text not null check (char_length(nome) between 2 and 80),
  telefone text not null check (char_length(telefone) <= 20),
  nivel text not null default 'iniciante' check (nivel in ('iniciante','intermediário','avançado')),
  data date not null,
  status text not null default 'pendente' check (status in ('pendente','confirmada','compareceu','virou_aluno')),
  origem text not null default 'site', obs text check (char_length(obs) <= 500),
  aluno_id uuid references public.alunos(id) on delete set null,
  criado_em timestamptz not null default now()
);

create table public.campeonatos (
  id uuid primary key default gen_random_uuid(),
  nome text not null, data date not null, local text,
  categorias text[] not null default '{}',
  formato text not null default 'mata' check (formato in ('mata','grupos')),
  status text not null default 'inscricoes' check (status in ('inscricoes','andamento','encerrado')),
  criado_em timestamptz not null default now()
);

create table public.duplas (
  id uuid primary key default gen_random_uuid(),
  campeonato_id uuid not null references public.campeonatos(id) on delete cascade,
  categoria text not null, jogador1 text not null, jogador2 text not null,
  criado_em timestamptz not null default now()
);

create table public.jogos (
  id uuid primary key default gen_random_uuid(),
  campeonato_id uuid not null references public.campeonatos(id) on delete cascade,
  categoria text not null, fase text not null check (fase in ('grupo','mata')),
  grupo text, rodada int, pos int, total int, bye boolean not null default false,
  a uuid references public.duplas(id) on delete set null,
  b uuid references public.duplas(id) on delete set null,
  pa int check (pa >= 0), pb int check (pb >= 0),
  vencedor uuid references public.duplas(id) on delete set null,
  criado_em timestamptz not null default now()
);

-- ===== Segurança (RLS) =====
create or replace function public.is_professor() returns boolean
language sql stable security definer set search_path = public as
$$ select exists (select 1 from public.professores where user_id = auth.uid()) $$;

do $$
declare t text;
begin
  foreach t in array array['alunos','planos','matriculas','pagamentos','turmas','presencas',
                           'agendamentos','experimentais','campeonatos','duplas','jogos'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "professores leem" on public.%I for select to authenticated using (public.is_professor())', t);
    execute format('create policy "professores inserem" on public.%I for insert to authenticated with check (public.is_professor())', t);
    execute format('create policy "professores alteram" on public.%I for update to authenticated using (public.is_professor()) with check (public.is_professor())', t);
    execute format('create policy "professores apagam" on public.%I for delete to authenticated using (public.is_professor())', t);
  end loop;
end $$;

alter table public.professores enable row level security;
create policy "professor vê a si mesmo" on public.professores for select to authenticated using (user_id = auth.uid());

-- O site público só pode CRIAR pedido de aula experimental (nunca ler/alterar)
create policy "visitante pede aula experimental" on public.experimentais
  for insert to anon
  with check (status = 'pendente' and origem = 'site' and aluno_id is null and data >= current_date);
```
Depois de criar os usuários, cadastre cada professor:
```sql
insert into public.professores (user_id, nome, instagram)
select id, 'Véveco', '@veveco.ftv' from auth.users where email = 'email-do-veveco@exemplo.com';
```

## 3. Trocar o repositório no front-end
Toda a interface fala só com `FV.repo` (métodos assíncronos `list(col, filtro)`, `get(col, id)`, `create(col, obj)`, `update(col, id, patch)`, `remove(col, id)`). Para trocar:

1. Baixe `supabase.min.js` (pacote `@supabase/supabase-js` v2, build UMD) e salve em `admin/vendor/` (sem CDN, para manter a CSP).
2. Crie `admin/supabase-repo.js`:
```js
(function () {
  var sb = supabase.createClient('https://SEU-PROJETO.supabase.co', 'SUA_CHAVE_ANON_PUBLICA');
  function q(r) { if (r.error) throw r.error; return r.data; }
  var repo = {
    name: 'supabase',
    list: async (c, f) => { var x = sb.from(c).select('*'); if (f) Object.keys(f).forEach(k => { x = x.eq(k, f[k]); }); return q(await x); },
    get: async (c, id) => q(await sb.from(c).select('*').eq('id', id).maybeSingle()),
    create: async (c, o) => q(await sb.from(c).insert(o).select().single()),
    update: async (c, id, p) => q(await sb.from(c).update(p).eq('id', id).select().single()),
    remove: async (c, id) => { q(await sb.from(c).delete().eq('id', id)); return true; },
    reset: async () => { throw new Error('Indisponível em produção'); },
    exportAll: async () => { var o = {}; for (var c of FV.collections) o[c] = await repo.list(c); return o; },
    importAll: async () => { throw new Error('Use o painel do Supabase para importar'); }
  };
  FV.useRepo(repo);
  FV.auth = sb.auth;
})();
```
3. Em `admin/index.html`, carregue na ordem: `data.js`, `vendor/supabase.min.js`, `supabase-repo.js`, `app.js`.
4. No `app.js`, troque o login de demonstração por `FV.auth.signInWithPassword({ email, password })`, a função `session()` por `FV.auth.getSession()` e o logout por `FV.auth.signOut()`. Remova o aviso "Modo demonstração".
5. No site público, o formulário de aula experimental continua chamando `FV.repo.create('experimentais', …)`. Carregue o mesmo `supabase-repo.js` lá (a política `anon` só permite inserir).
6. Ajuste a CSP (já libera `https://*.supabase.co` em `connect-src` no admin; adicione o mesmo no `index.html` público).

> A chave **anon** é pública por natureza; a proteção real vem das políticas RLS acima. **Nunca** coloque a chave `service_role` no site.

## 4. Levar os dados da demo
Na demo, use **Exportar backup** (JSON). As chaves do JSON têm os mesmos nomes das tabelas/colunas. Os IDs da demo não são UUID em navegadores antigos; se for importar, deixe o banco gerar novos IDs.
