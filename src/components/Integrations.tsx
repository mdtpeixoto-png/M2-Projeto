import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Database, Phone, Mail, Link as LinkIcon, CheckCircle2, AlertCircle } from "lucide-react";

export default function Integrations() {
  const [config, setConfig] = useState({
    supabaseUrl: "",
    supabaseKey: "",
    nectarApiKey: "",
    smclickApiKey: "",
    smclickUrl: "",
    smtpHost: "",
    smtpPort: "587",
    smtpUser: "",
    smtpPass: "",
    imapHost: "",
    imapPort: "993",
    imapUser: "",
    imapPass: "",
  });

  const [loading, setLoading] = useState(false);
  const [whatsappNumbers, setWhatsappNumbers] = useState<any[]>([]);

  useEffect(() => {
    // Fetch Config
    fetch("/api/config")
      .then(res => res.json())
      .then(data => setConfig(prev => ({ ...prev, ...data })));
    
    // Fetch WhatsApp Numbers
    fetch("/api/whatsapp-numbers")
      .then(res => res.json())
      .then(data => setWhatsappNumbers(data));
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      const data = await response.json();
      if (data.success) {
        setConfig(data.config);
        alert("Configurações salvas com sucesso!");
      }
    } catch (error) {
      console.error(error);
      alert("Erro ao salvar configurações.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6 pb-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Supabase */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="space-y-1">
              <CardTitle className="text-xl flex items-center gap-2">
                <Database className="w-5 h-5 text-emerald-500" />
                Supabase
              </CardTitle>
              <CardDescription>Conexão com o banco de dados de contatos.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="supabaseUrl">URL do Projeto (SUPABASE_URL)</Label>
              <Input 
                id="supabaseUrl" 
                placeholder="https://xyz.supabase.co" 
                value={config.supabaseUrl}
                onChange={e => setConfig({...config, supabaseUrl: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supabaseKey">Anon Key (SUPABASE_ANON_KEY)</Label>
              <Input 
                id="supabaseKey" 
                type="password" 
                placeholder="eyJhbG..." 
                value={config.supabaseKey}
                onChange={e => setConfig({...config, supabaseKey: e.target.value})}
              />
            </div>
          </CardContent>
        </Card>

        {/* Nectar CRM */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="space-y-1">
              <CardTitle className="text-xl flex items-center gap-2">
                <LinkIcon className="w-5 h-5 text-blue-500" />
                Nectar CRM
              </CardTitle>
              <CardDescription>Sincronização de oportunidades e leads.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="nectarKey">API Key (NECTAR_API_KEY)</Label>
              <Input 
                id="nectarKey" 
                type="password" 
                placeholder="Token de acesso" 
                value={config.nectarApiKey}
                onChange={e => setConfig({...config, nectarApiKey: e.target.value})}
              />
            </div>
            <div className="flex items-center justify-between pt-2">
              <Label className="text-xs text-slate-500">Sincronização Automática (05:00 AM)</Label>
              <Switch checked />
            </div>
          </CardContent>
        </Card>

        {/* SMClick WhatsApp */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="space-y-1">
              <CardTitle className="text-xl flex items-center gap-2">
                <Phone className="w-5 h-5 text-green-500" />
                SMClick (WhatsApp)
              </CardTitle>
              <CardDescription>Integração oficial para mensagens.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="smclickUrl">API URL (SMCLICK_API_URL)</Label>
              <Input 
                id="smclickUrl" 
                placeholder="https://api.smclick.com.br" 
                value={config.smclickUrl}
                onChange={e => setConfig({...config, smclickUrl: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="smclickKey">API Key (SMCLICK_API_KEY)</Label>
              <Input 
                id="smclickKey" 
                type="password" 
                placeholder="Chave da API" 
                value={config.smclickApiKey}
                onChange={e => setConfig({...config, smclickApiKey: e.target.value})}
              />
            </div>
          </CardContent>
        </Card>

        {/* Email SMTP/IMAP */}
        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="space-y-1">
              <CardTitle className="text-xl flex items-center gap-2">
                <Mail className="w-5 h-5 text-orange-500" />
                Configurações de E-mail (SMTP & IMAP)
              </CardTitle>
              <CardDescription>Configurações para envio e recebimento automático de orçamentos.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* SMTP Section */}
              <div className="space-y-4">
                <h4 className="font-semibold text-sm border-b pb-2">Envio (SMTP)</h4>
                <div className="space-y-2">
                  <Label htmlFor="smtpHost">Host SMTP</Label>
                  <Input 
                    id="smtpHost" 
                    placeholder="smtp.gmail.com" 
                    value={config.smtpHost}
                    onChange={e => setConfig({...config, smtpHost: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtpPort">Porta SMTP</Label>
                  <Input 
                    id="smtpPort" 
                    placeholder="587" 
                    value={config.smtpPort}
                    onChange={e => setConfig({...config, smtpPort: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtpUser">Usuário SMTP</Label>
                  <Input 
                    id="smtpUser" 
                    placeholder="usuario@empresa.com" 
                    value={config.smtpUser}
                    onChange={e => setConfig({...config, smtpUser: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtpPass">Senha SMTP</Label>
                  <Input 
                    id="smtpPass" 
                    type="password" 
                    placeholder="Senha do e-mail" 
                    value={config.smtpPass}
                    onChange={e => setConfig({...config, smtpPass: e.target.value})}
                  />
                </div>
              </div>

              {/* IMAP Section */}
              <div className="space-y-4">
                <h4 className="font-semibold text-sm border-b pb-2">Recebimento (IMAP)</h4>
                <div className="space-y-2">
                  <Label htmlFor="imapHost">Host IMAP</Label>
                  <Input 
                    id="imapHost" 
                    placeholder="imap.gmail.com" 
                    value={config.imapHost}
                    onChange={e => setConfig({...config, imapHost: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="imapPort">Porta IMAP</Label>
                  <Input 
                    id="imapPort" 
                    placeholder="993" 
                    value={config.imapPort}
                    onChange={e => setConfig({...config, imapPort: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="imapUser">Usuário IMAP</Label>
                  <Input 
                    id="imapUser" 
                    placeholder="usuario@empresa.com" 
                    value={config.imapUser}
                    onChange={e => setConfig({...config, imapUser: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="imapPass">Senha IMAP</Label>
                  <Input 
                    id="imapPass" 
                    type="password" 
                    placeholder="Senha do e-mail" 
                    value={config.imapPass}
                    onChange={e => setConfig({...config, imapPass: e.target.value})}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end pt-4">
        <Button 
          onClick={handleSave} 
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 px-8"
        >
          {loading ? "Salvando..." : "Salvar Todas as Configurações"}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Números Habilitados (SMClick)</CardTitle>
          <CardDescription>Cada número conectado no SMClick é automaticamente um usuário no sistema.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {whatsappNumbers.length > 0 ? (
              whatsappNumbers.map(num => (
                <div key={num.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold">
                      {num.user ? num.user.slice(-2) : "??"}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{num.number}</p>
                      <p className="text-xs text-slate-500">{num.user || "Sem nome"}</p>
                    </div>
                  </div>
                  <Badge className={`${num.status === 'Conectado' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'} border-none`}>
                    {num.status}
                  </Badge>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-slate-500">
                Nenhum número encontrado no SMClick.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
