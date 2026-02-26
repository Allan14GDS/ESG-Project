-- ============================================================================
-- Migration Logs Table
-- Audit trail for metadata migration operations
-- ============================================================================

CREATE TABLE IF NOT EXISTS migration_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID NOT NULL REFERENCES book_templates(id),
  template_name TEXT NOT NULL,
  executed_by UUID NOT NULL,
  executed_at TIMESTAMPTZ DEFAULT NOW(),
  total_excel_rows INT NOT NULL DEFAULT 0,
  total_matched INT NOT NULL DEFAULT 0,
  total_updated INT NOT NULL DEFAULT 0,
  total_errors INT NOT NULL DEFAULT 0,
  total_unmatched INT NOT NULL DEFAULT 0,
  column_mapping JSONB NOT NULL DEFAULT '{}',
  match_details JSONB NOT NULL DEFAULT '{}',
  error_details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: Only service role can access (used via adminClient)
ALTER TABLE migration_logs ENABLE ROW LEVEL SECURITY;

-- Index for querying by template
CREATE INDEX IF NOT EXISTS idx_migration_logs_template_id ON migration_logs(template_id);
CREATE INDEX IF NOT EXISTS idx_migration_logs_executed_at ON migration_logs(executed_at DESC);
