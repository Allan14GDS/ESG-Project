-- Tabela para histórico de respostas deletadas
CREATE TABLE IF NOT EXISTS deleted_answers_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  answer_id UUID NOT NULL, -- ID da resposta deletada (não é FK pois foi deletada)
  template_id UUID REFERENCES book_templates(id) ON DELETE CASCADE,
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  holding_id UUID REFERENCES holdings(id) ON DELETE SET NULL,
  value TEXT,
  value_jsonb JSONB,
  evidence_url TEXT,
  status TEXT,
  deleted_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deletion_reason TEXT,
  original_created_at TIMESTAMP WITH TIME ZONE,
  original_updated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_deleted_answers_history_template_id ON deleted_answers_history(template_id);
CREATE INDEX IF NOT EXISTS idx_deleted_answers_history_question_id ON deleted_answers_history(question_id);
CREATE INDEX IF NOT EXISTS idx_deleted_answers_history_user_id ON deleted_answers_history(user_id);
CREATE INDEX IF NOT EXISTS idx_deleted_answers_history_deleted_by ON deleted_answers_history(deleted_by);
CREATE INDEX IF NOT EXISTS idx_deleted_answers_history_deleted_at ON deleted_answers_history(deleted_at);

-- RLS Policies
ALTER TABLE deleted_answers_history ENABLE ROW LEVEL SECURITY;

-- Apenas gestores podem visualizar o histórico
CREATE POLICY "Gestores podem visualizar histórico de deletados"
  ON deleted_answers_history
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'gestor'
    )
  );

-- Apenas gestores podem inserir no histórico
CREATE POLICY "Gestores podem inserir no histórico"
  ON deleted_answers_history
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'gestor'
    )
  );

-- Comentários para documentação
COMMENT ON TABLE deleted_answers_history IS 'Histórico de respostas deletadas por gestores';
COMMENT ON COLUMN deleted_answers_history.answer_id IS 'ID original da resposta deletada';
COMMENT ON COLUMN deleted_answers_history.deleted_by IS 'Gestor que deletou a resposta';
COMMENT ON COLUMN deleted_answers_history.deletion_reason IS 'Motivo da deleção';
COMMENT ON COLUMN deleted_answers_history.original_created_at IS 'Data de criação original da resposta';
COMMENT ON COLUMN deleted_answers_history.original_updated_at IS 'Data da última atualização antes da deleção';
