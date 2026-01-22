-- Criar tabela comment_history para rastrear histórico de revisões
CREATE TABLE IF NOT EXISTS comment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_question_junction_id UUID REFERENCES book_question_junction(id) ON DELETE CASCADE,
  question_id UUID REFERENCES book_questions(id) ON DELETE CASCADE,
  template_id UUID REFERENCES book_templates(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  author_name TEXT,
  author_role TEXT,
  message TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('REVISION_REQUESTED', 'APPROVED', 'REJECTED', 'CORRECTION_SUBMITTED', 'DRAFT')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_comment_history_question ON comment_history(question_id);
CREATE INDEX IF NOT EXISTS idx_comment_history_template ON comment_history(template_id);
CREATE INDEX IF NOT EXISTS idx_comment_history_user ON comment_history(user_id);
CREATE INDEX IF NOT EXISTS idx_comment_history_status ON comment_history(status);
CREATE INDEX IF NOT EXISTS idx_comment_history_junction ON comment_history(book_question_junction_id);

-- Habilitar RLS
ALTER TABLE comment_history ENABLE ROW LEVEL SECURITY;

-- Policy para permitir leitura para usuários autenticados
CREATE POLICY "comment_history_select" ON comment_history
  FOR SELECT TO authenticated
  USING (true);

-- Policy para permitir insert para usuários autenticados
CREATE POLICY "comment_history_insert" ON comment_history
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Policy para admin
CREATE POLICY "comment_history_admin" ON comment_history
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.role IN ('admin_main', 'holding_admin') OR profiles.is_super_admin = true)
    )
  );
