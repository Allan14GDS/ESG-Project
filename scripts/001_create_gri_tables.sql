-- Tabela para armazenar os disclosures GRI
create table if not exists public.gri_disclosures (
  id text primary key,
  title text not null,
  category text not null,
  status text not null default 'not_started',
  progress integer not null default 0,
  assigned_to text,
  reviewer text,
  deadline timestamp with time zone,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Tabela para armazenar as respostas às questões
create table if not exists public.gri_responses (
  id uuid primary key default gen_random_uuid(),
  disclosure_id text not null references public.gri_disclosures(id) on delete cascade,
  question_id text not null,
  question_text text not null,
  response_value text,
  response_type text not null,
  evidence_urls text[],
  version integer not null default 1,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(disclosure_id, question_id, version)
);

-- Tabela para histórico de versionamento
create table if not exists public.gri_response_history (
  id uuid primary key default gen_random_uuid(),
  response_id uuid not null references public.gri_responses(id) on delete cascade,
  disclosure_id text not null,
  question_id text not null,
  old_value text,
  new_value text,
  changed_by text,
  change_type text not null, -- 'created', 'updated', 'deleted'
  created_at timestamp with time zone default now()
);

-- Índices para melhor performance
create index if not exists idx_gri_responses_disclosure on public.gri_responses(disclosure_id);
create index if not exists idx_gri_responses_question on public.gri_responses(question_id);
create index if not exists idx_gri_history_response on public.gri_response_history(response_id);
create index if not exists idx_gri_history_disclosure on public.gri_response_history(disclosure_id);

-- Habilitar RLS
alter table public.gri_disclosures enable row level security;
alter table public.gri_responses enable row level security;
alter table public.gri_response_history enable row level security;

-- Políticas RLS - permitir acesso público por enquanto (sem autenticação)
-- Quando adicionar autenticação, ajustar as políticas para usar auth.uid()
create policy "Allow public read access to disclosures"
  on public.gri_disclosures for select
  using (true);

create policy "Allow public insert to disclosures"
  on public.gri_disclosures for insert
  with check (true);

create policy "Allow public update to disclosures"
  on public.gri_disclosures for update
  using (true);

create policy "Allow public delete from disclosures"
  on public.gri_disclosures for delete
  using (true);

create policy "Allow public read access to responses"
  on public.gri_responses for select
  using (true);

create policy "Allow public insert to responses"
  on public.gri_responses for insert
  with check (true);

create policy "Allow public update to responses"
  on public.gri_responses for update
  using (true);

create policy "Allow public delete from responses"
  on public.gri_responses for delete
  using (true);

create policy "Allow public read access to history"
  on public.gri_response_history for select
  using (true);

create policy "Allow public insert to history"
  on public.gri_response_history for insert
  with check (true);

-- Função para atualizar o timestamp updated_at automaticamente
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Triggers para atualizar updated_at
drop trigger if exists update_gri_disclosures_updated_at on public.gri_disclosures;
create trigger update_gri_disclosures_updated_at
  before update on public.gri_disclosures
  for each row
  execute function public.update_updated_at_column();

drop trigger if exists update_gri_responses_updated_at on public.gri_responses;
create trigger update_gri_responses_updated_at
  before update on public.gri_responses
  for each row
  execute function public.update_updated_at_column();
