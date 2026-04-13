import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Bot, Sparkles, ShieldCheck, MessageCircle, Save } from "lucide-react";

export default function AgentConfig() {
  const [agent, setAgent] = useState({
    name: "M2 Assistant",
    persona: "profissional",
    rules: "Não prometa descontos acima de 10%. Sempre peça o CNPJ se for empresa. Se o cliente estiver bravo, chame um humano imediatamente.",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/agent-config")
      .then(res => res.json())
      .then(data => {
        if (data && Object.keys(data).length > 0) {
          setAgent({
            name: data.agent_name || "M2 Assistant",
            persona: data.agent_persona || "profissional",
            rules: data.agent_rules || "Não prometa descontos acima de 10%...",
          });
        }
      })
      .catch(console.error);
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/agent-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agent_name: agent.name,
          agent_persona: agent.persona,
          agent_rules: agent.rules
        })
      });
      if (res.ok) {
        alert("Configurações salvas com sucesso!");
      } else {
        alert("Erro ao salvar.");
      }
    } catch (error) {
      console.error(error);
      alert("Erro ao conectar.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="w-6 h-6 text-blue-600" />
            Configuração do Agente
          </CardTitle>
          <CardDescription>
            Personalize como a inteligência artificial deve se comunicar (via texto) com seus clientes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="agentName">Nome da IA</Label>
              <Input 
                id="agentName" 
                value={agent.name} 
                onChange={e => setAgent({...agent, name: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="persona">Tom de Voz (Texto)</Label>
              <Select 
                value={agent.persona} 
                onValueChange={v => setAgent({...agent, persona: v as any})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tom de voz" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="profissional">Profissional (Sério)</SelectItem>
                  <SelectItem value="amigável">Amigável (Acolhedor)</SelectItem>
                  <SelectItem value="persuasivo">Persuasivo (Vendedor)</SelectItem>
                  <SelectItem value="direto">Direto (Curto e objetivo)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="rules">Regras Personalizadas de Atendimento</Label>
            <Textarea 
              id="rules" 
              rows={6}
              placeholder="Ex: Não dê descontos, nunca passe informações de CNPJ..."
              value={agent.rules}
              onChange={e => setAgent({...agent, rules: e.target.value})}
            />
            <p className="text-xs text-slate-500">
              Isso afeta diretamente as decisões que a IA toma durante as conversas no chat.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 space-y-2">
              <Sparkles className="w-5 h-5 text-blue-600" />
              <h4 className="font-semibold text-sm">Coleta de Leads</h4>
              <p className="text-xs text-slate-600">A IA puxa dados essenciais antes de transferir.</p>
            </div>
            <div className="p-4 bg-green-50 rounded-xl border border-green-100 space-y-2">
              <ShieldCheck className="w-5 h-5 text-green-600" />
              <h4 className="font-semibold text-sm">Transferência</h4>
              <p className="text-xs text-slate-600">O robô identifica plástico e manda pro Humano.</p>
            </div>
            <div className="p-4 bg-orange-50 rounded-xl border border-orange-100 space-y-2">
              <MessageCircle className="w-5 h-5 text-orange-600" />
              <h4 className="font-semibold text-sm">Mudo Inteligente</h4>
              <p className="text-xs text-slate-600">Se você responder, ela para de falar.</p>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2">
              {saving ? "Salvando..." : <><Save className="w-4 h-4" /> Salvar Configurações</>}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
