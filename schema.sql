-- Script para configurar o banco de dados no Supabase

-- 1. Habilitar extensões necessárias (opcional)
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Tabela de Configurações do Sistema
-- Usamos um ID fixo 'primary' para garantir que exista apenas um registro de configuração global.
CREATE TABLE IF NOT EXISTS system_config (
    id TEXT PRIMARY KEY DEFAULT 'primary',
    supabase_url TEXT,
    supabase_key TEXT,
    nectar_api_key TEXT,
    smclick_api_key TEXT,
    smclick_api_url TEXT,
    smtp_host TEXT,
    smtp_port TEXT DEFAULT '587',
    smtp_user TEXT,
    smtp_pass TEXT,
    imap_host TEXT,
    imap_port TEXT DEFAULT '993',
    imap_user TEXT,
    imap_pass TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT one_row_only CHECK (id = 'primary')
);

-- Inserir registro inicial vazio se não existir
INSERT INTO system_config (id) VALUES ('primary') ON CONFLICT DO NOTHING;

-- 3. Tabela de Números de WhatsApp (SMClick)
CREATE TABLE IF NOT EXISTS whatsapp_numbers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    number TEXT NOT NULL UNIQUE,
    status TEXT DEFAULT 'Desconectado',
    user_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabela de Contatos (Referenciada no server.ts)
CREATE TABLE IF NOT EXISTS contatos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT,
    email TEXT,
    telefone TEXT,
    data_fechamento DATE,
    origem TEXT DEFAULT 'CRM',
    status TEXT DEFAULT 'Lead',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Tabela de Conversas/Logs (Para o Agente de IA)
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_id UUID REFERENCES contatos(id),
    sender TEXT, -- 'agent' ou 'user'
    message TEXT,
    channel TEXT DEFAULT 'whatsapp',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar Realtime para mensagens (opcional)
-- ALTER PUBLICATION supabase_realtime ADD TABLE conversations;

-- 6. Tabela de Sessões SMClick
CREATE TABLE IF NOT EXISTS smclick_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    smclick_id TEXT NOT NULL UNIQUE,
    phone TEXT,
    is_human_attending BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Tabela de Mensagens SMClick
CREATE TABLE IF NOT EXISTS smclick_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES smclick_sessions(id) ON DELETE CASCADE,
    role TEXT CHECK (role IN ('user', 'bot', 'human')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
