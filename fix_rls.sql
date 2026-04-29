-- =====================================================
-- FIX RLS POLICIES FOR SMCLICK TABLES
-- Execute este script no SQL Editor do Supabase
-- =====================================================

-- 1. Criar tabela ia_correcoes se não existir
CREATE TABLE IF NOT EXISTS ia_correcoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES smclick_sessions(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES contatos(id) ON DELETE SET NULL,
    mensagem_ia TEXT,
    mensagem_correcao TEXT,
    contexto TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Habilitar RLS (se não estiver habilitado)
ALTER TABLE smclick_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE smclick_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ia_correcoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_config ENABLE ROW LEVEL SECURITY;

-- 3. Criar políticas para a role 'anon' (usada pelo SUPABASE_ANON_KEY)

-- smclick_sessions: permitir SELECT e INSERT
DROP POLICY IF EXISTS "Allow anon select sessions" ON smclick_sessions;
CREATE POLICY "Allow anon select sessions" ON smclick_sessions FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Allow anon insert sessions" ON smclick_sessions;
CREATE POLICY "Allow anon insert sessions" ON smclick_sessions FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon update sessions" ON smclick_sessions;
CREATE POLICY "Allow anon update sessions" ON smclick_sessions FOR UPDATE TO anon USING (true);

-- smclick_messages: permitir SELECT e INSERT
DROP POLICY IF EXISTS "Allow anon select messages" ON smclick_messages;
CREATE POLICY "Allow anon select messages" ON smclick_messages FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Allow anon insert messages" ON smclick_messages;
CREATE POLICY "Allow anon insert messages" ON smclick_messages FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon delete messages" ON smclick_messages;
CREATE POLICY "Allow anon delete messages" ON smclick_messages FOR DELETE TO anon USING (true);

-- ia_correcoes: permitir INSERT
DROP POLICY IF EXISTS "Allow anon insert corrections" ON ia_correcoes;
CREATE POLICY "Allow anon insert corrections" ON ia_correcoes FOR INSERT TO anon WITH CHECK (true);

-- system_config: permitir SELECT
DROP POLICY IF EXISTS "Allow anon select config" ON system_config;
CREATE POLICY "Allow anon select config" ON system_config FOR SELECT TO anon USING (true);

-- 4. Tabelas de IA (Leitura apenas)
ALTER TABLE ia_identidade ENABLE ROW LEVEL SECURITY;
ALTER TABLE ia_personalidade ENABLE ROW LEVEL SECURITY;
ALTER TABLE ia_fluxo_atendimento ENABLE ROW LEVEL SECURITY;
ALTER TABLE ia_faq ENABLE ROW LEVEL SECURITY;
ALTER TABLE ia_cenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE ia_transferencia ENABLE ROW LEVEL SECURITY;
ALTER TABLE ia_regras ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon read identity" ON ia_identidade;
CREATE POLICY "Allow anon read identity" ON ia_identidade FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Allow anon read personality" ON ia_personalidade;
CREATE POLICY "Allow anon read personality" ON ia_personalidade FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Allow anon read flux" ON ia_fluxo_atendimento;
CREATE POLICY "Allow anon read flux" ON ia_fluxo_atendimento FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Allow anon read faq" ON ia_faq;
CREATE POLICY "Allow anon read faq" ON ia_faq FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Allow anon read scenarios" ON ia_cenarios;
CREATE POLICY "Allow anon read scenarios" ON ia_cenarios FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Allow anon read transfer" ON ia_transferencia;
CREATE POLICY "Allow anon read transfer" ON ia_transferencia FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Allow anon read rules" ON ia_regras;
CREATE POLICY "Allow anon read rules" ON ia_regras FOR SELECT TO anon USING (true);
