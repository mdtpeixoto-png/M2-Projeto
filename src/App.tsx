import { useState } from "react";
import Layout from "./components/Layout";
import Dashboard from "./components/Dashboard";
import Integrations from "./components/Integrations";
import AgentConfig from "./components/AgentConfig";
import Conversations from "./components/Conversations";

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard />;
      case "integrations":
        return <Integrations />;
      case "agent":
        return <AgentConfig />;
      case "conversations":
        return <Conversations />;
      case "settings":
        return (
          <div className="p-8 bg-white rounded-xl border border-slate-200">
            <h3 className="text-xl font-bold mb-4">Configurações Gerais</h3>
            <p className="text-slate-600">Configurações de conta, usuários e notificações.</p>
          </div>
        );
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {renderContent()}
    </Layout>
  );
}

