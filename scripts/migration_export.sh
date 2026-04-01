#!/bin/bash
# ============================================================================
# MIGRACAO SUPABASE: Exportar banco antigo → Importar no novo
# ============================================================================
#
# ANTES DE RODAR:
# 1. Instale o PostgreSQL client (psql/pg_dump):
#    - Windows: https://www.postgresql.org/download/windows/
#    - Ou via scoop: scoop install postgresql
#    - Ou via choco: choco install postgresql
#
# 2. Pegue a Database Password do Supabase ANTIGO:
#    Dashboard → Project Settings → Database → Database Password
#
# 3. Pegue a Database Password do Supabase NOVO:
#    Dashboard → Project Settings → Database → Database Password
#
# COMO RODAR:
#   bash scripts/migration_export.sh
#
# ============================================================================

# Configuracoes - PREENCHA ANTES DE RODAR
OLD_HOST="db.lhwwqykueiwywutwrlnj.supabase.co"
NEW_HOST="db.wajqqahhcneshjvrugyk.supabase.co"
DB_PORT="5432"
DB_USER="postgres"
DB_NAME="postgres"
BACKUP_FILE="esg_backup.dump"

echo "============================================"
echo "  MIGRACAO SUPABASE - ESG B.kick"
echo "============================================"
echo ""

# ---- PASSO 1: Exportar banco antigo ----
echo "[1/3] Exportando banco ANTIGO (${OLD_HOST})..."
echo "      Voce vai precisar digitar a DATABASE PASSWORD do projeto ANTIGO."
echo ""

pg_dump \
  -h "$OLD_HOST" \
  -p "$DB_PORT" \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  --no-owner \
  --no-acl \
  --clean \
  --if-exists \
  -n public \
  -F c \
  -f "$BACKUP_FILE"

if [ $? -ne 0 ]; then
  echo ""
  echo "ERRO: Falha ao exportar o banco antigo."
  echo "Verifique:"
  echo "  - A senha do banco esta correta?"
  echo "  - O pg_dump esta instalado? (tente: pg_dump --version)"
  echo "  - O host esta acessivel? (tente: ping ${OLD_HOST})"
  exit 1
fi

echo ""
echo "OK - Backup salvo em: ${BACKUP_FILE}"
echo "     Tamanho: $(du -h "$BACKUP_FILE" | cut -f1)"
echo ""

# ---- PASSO 2: Importar no banco novo ----
echo "[2/3] Importando no banco NOVO (${NEW_HOST})..."
echo "      Voce vai precisar digitar a DATABASE PASSWORD do projeto NOVO."
echo ""

pg_restore \
  -h "$NEW_HOST" \
  -p "$DB_PORT" \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  --no-owner \
  --no-acl \
  --clean \
  --if-exists \
  "$BACKUP_FILE"

if [ $? -ne 0 ]; then
  echo ""
  echo "AVISO: pg_restore reportou erros (normal se algumas tabelas"
  echo "       ja existiam ou se houve conflitos menores)."
  echo "       Verifique no SQL Editor se as tabelas foram criadas."
  echo ""
fi

echo ""
echo "OK - Dados importados no banco novo."
echo ""

# ---- PASSO 3: Instrucoes finais ----
echo "[3/3] PROXIMOS PASSOS (manuais):"
echo ""
echo "  1. Abra o dashboard do NOVO Supabase:"
echo "     https://supabase.com/dashboard/project/wajqqahhcneshjvrugyk"
echo ""
echo "  2. Va em SQL Editor e cole o conteudo do arquivo:"
echo "     scripts/migration_rpc_rls.sql"
echo "     Isso recria as funcoes RPC e policies RLS."
echo ""
echo "  3. Migre os usuarios (auth.users):"
echo "     Rode: npx tsx scripts/migration_auth_users.ts"
echo "     Isso exporta usuarios do Supabase antigo e cria no novo."
echo ""
echo "  4. Atualize as variaveis de ambiente:"
echo "     - .env.local (local)"
echo "     - Vercel Dashboard → Environment Variables"
echo ""
echo "  5. Configure Authentication no novo Supabase:"
echo "     Authentication → URL Configuration:"
echo "     - Site URL: https://seu-dominio.com.br"
echo "     - Redirect URLs: https://seu-dominio.com.br/auth/callback"
echo ""
echo "  6. Teste: pnpm dev"
echo ""
echo "============================================"
echo "  MIGRACAO CONCLUIDA (schema + dados)"
echo "============================================"
