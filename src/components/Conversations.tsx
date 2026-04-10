import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Search, Send, Phone, Mail, MoreVertical, User, Bot } from "lucide-react";
import { cn } from "@/lib/utils";

const mockChats = [
  { id: 1, name: "João Silva", lastMsg: "Gostaria de um orçamento para 50 unidades.", time: "10:30", unread: 2, type: "whatsapp", status: "ia" },
  { id: 2, name: "Maria Oliveira", lastMsg: "Obrigado pelas informações!", time: "09:15", unread: 0, type: "email", status: "human" },
  { id: 3, name: "Tech Solutions", lastMsg: "Qual o prazo de entrega para SP?", time: "Ontem", unread: 0, type: "whatsapp", status: "ia" },
  { id: 4, name: "Carlos Souza", lastMsg: "Pode me ligar?", time: "Ontem", unread: 1, type: "whatsapp", status: "ia" },
];

export default function Conversations() {
  const [selectedChat, setSelectedChat] = useState(mockChats[0]);
  const [messages, setMessages] = useState([
    { id: 1, role: "user", content: "Olá, gostaria de saber mais sobre o Produto X.", time: "10:25" },
    { id: 2, role: "bot", content: "Olá! Sou o assistente da M2 IA. Com certeza, o Produto X é nossa solução premium para automação. Qual o nome da sua empresa?", time: "10:26" },
    { id: 3, role: "user", content: "Minha empresa é a Tech Solutions. Precisamos de 50 unidades.", time: "10:28" },
    { id: 4, role: "bot", content: "Entendido, Tech Solutions! 50 unidades. E qual seria a sua expectativa de fechamento? Pretende concluir nos próximos 10 dias?", time: "10:29" },
    { id: 5, role: "user", content: "Sim, temos urgência.", time: "10:30" },
  ]);

  return (
    <div className="h-[calc(100vh-12rem)] flex gap-6">
      {/* Chat List */}
      <Card className="w-80 flex flex-col overflow-hidden">
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input className="pl-9 bg-slate-50 border-none" placeholder="Buscar conversas..." />
          </div>
        </div>
        <ScrollArea className="flex-1">
          {mockChats.map((chat) => (
            <button
              key={chat.id}
              onClick={() => setSelectedChat(chat)}
              className={cn(
                "w-full p-4 flex gap-3 border-b hover:bg-slate-50 transition-colors text-left",
                selectedChat.id === chat.id && "bg-blue-50 border-r-4 border-r-blue-600"
              )}
            >
              <Avatar>
                <AvatarFallback className="bg-blue-100 text-blue-700 font-semibold">
                  {chat.name.split(" ").map(n => n[0]).join("")}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-1">
                  <span className="font-semibold text-sm truncate">{chat.name}</span>
                  <span className="text-[10px] text-slate-400">{chat.time}</span>
                </div>
                <p className="text-xs text-slate-500 truncate">{chat.lastMsg}</p>
                <div className="flex items-center gap-2 mt-2">
                  {chat.type === "whatsapp" ? (
                    <Phone className="w-3 h-3 text-green-500" />
                  ) : (
                    <Mail className="w-3 h-3 text-orange-500" />
                  )}
                  {chat.status === "ia" ? (
                    <Badge variant="secondary" className="text-[10px] px-1 py-0 bg-blue-100 text-blue-700 border-none">IA Ativa</Badge>
                  ) : (
                    <Badge variant="secondary" className="text-[10px] px-1 py-0 bg-slate-100 text-slate-600 border-none">Humano</Badge>
                  )}
                </div>
              </div>
              {chat.unread > 0 && (
                <div className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold">
                  {chat.unread}
                </div>
              )}
            </button>
          ))}
        </ScrollArea>
      </Card>

      {/* Chat Window */}
      <Card className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarFallback className="bg-blue-100 text-blue-700">
                {selectedChat.name.split(" ").map(n => n[0]).join("")}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-sm">{selectedChat.name}</h3>
              <p className="text-[10px] text-slate-500 flex items-center gap-1">
                {selectedChat.type === "whatsapp" ? "WhatsApp" : "E-mail"} • Online
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="text-xs gap-2">
              <User className="w-3 h-3" /> Assumir Conversa
            </Button>
            <Button variant="ghost" size="icon">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-6 bg-slate-50/50">
          <div className="space-y-6">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex flex-col max-w-[80%]",
                  msg.role === "user" ? "ml-auto items-end" : "mr-auto items-start"
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  {msg.role === "bot" && <Bot className="w-3 h-3 text-blue-600" />}
                  <span className="text-[10px] text-slate-400 font-medium">
                    {msg.role === "user" ? "Cliente" : "M2 IA"} • {msg.time}
                  </span>
                </div>
                <div
                  className={cn(
                    "px-4 py-2 rounded-2xl text-sm shadow-sm",
                    msg.role === "user" 
                      ? "bg-blue-600 text-white rounded-tr-none" 
                      : "bg-white text-slate-800 border border-slate-100 rounded-tl-none"
                  )}
                >
                  {msg.content}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="p-4 border-t bg-white">
          <div className="flex gap-2">
            <Input 
              placeholder="Digite sua mensagem..." 
              className="flex-1 bg-slate-50 border-none focus-visible:ring-blue-600" 
            />
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-[10px] text-slate-400 mt-2 text-center">
            A IA está monitorando esta conversa e responderá automaticamente se necessário.
          </p>
        </div>
      </Card>
    </div>
  );
}
