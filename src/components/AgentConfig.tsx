import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Bot, Sparkles, ShieldCheck, MessageCircle } from "lucide-react";

export default function AgentConfig() {
  const [agent, setAgent] = useState({
    name: "M2 Assistant",
    persona: "friendly",
    rules: "Não prometa descontos acima de 10%. Sempre peça o CNPJ se for empresa. Se o cliente estiver bravo, chame um humano imediatamente.",
  });

  return (
    <div className="max-w-3xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="w-6 h-6 text-blue-600" />
            Configuração do Agente
          </CardTitle>
          <CardDescription>
            Personalize como a IA deve se comportar ao interagir com seus clientes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="agentName">Nome do Agente</Label>
              <Input 
                id="agentName" 
                value={agent.name} 
                onChange={e => setAgent({...agent, name: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="persona">Postura / Persona</Label>
              <Select 
                value={agent.persona} 
                onValueChange={v => setAgent({...agent, persona: v as any})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a postura" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="institutional">Institucional (Formal)</SelectItem>
                  <SelectItem value="friendly">Simpático (Acolhedor)</SelectItem>
                  <SelectItem value="informal">Informal (Descontraído)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="rules">Prompt de Regras Gerais</Label>
            <Textarea 
              id="rules" 
              rows={6}
              placeholder="Ex: Sempre cumprimente o cliente pelo nome. Nunca fale sobre política..."
              value={agent.rules}
              onChange={e => setAgent({...agent, rules: e.target.value})}
            />
            <p className="text-xs text-slate-500">
              Estas regras serão aplicadas em todas as interações (WhatsApp e E-mail).
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 space-y-2">
              <Sparkles className="w-5 h-5 text-blue-600" />
              <h4 className="font-semibold text-sm">Coleta de Leads</h4>
              <p className="text-xs text-slate-600">O bot coletará automaticamente: Empresa, Produtos, Quantidade e Prazo.</p>
            </div>
            <div className="p-4 bg-green-50 rounded-xl border border-green-100 space-y-2">
              <ShieldCheck className="w-5 h-5 text-green-600" />
              <h4 className="font-semibold text-sm">Modo Humano</h4>
              <p className="text-xs text-slate-600">Se um atendente interagir, a IA pausa automaticamente até o dia seguinte.</p>
            </div>
            <div className="p-4 bg-orange-50 rounded-xl border border-orange-100 space-y-2">
              <MessageCircle className="w-5 h-5 text-orange-600" />
              <h4 className="font-semibold text-sm">Filtro de E-mail</h4>
              <p className="text-xs text-slate-600">Responde apenas solicitações de orçamento detectadas pela IA.</p>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button className="bg-blue-600 hover:bg-blue-700">
              Salvar Configurações do Agente
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
