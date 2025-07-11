import { ConversationInterface } from "@/components/ConversationInterface";

const Index = () => {
  // Your ElevenLabs API key
  const apiKey = "sk_bcbf83a0745300e2827eae642ce82f24c630774f5e208848";
  
  // You'll need to create a Conversational AI agent in ElevenLabs UI and get the agent ID
  const agentId = "agent_01jzwfkpprfnya4h56zqzmz7tf"; // Add your Agent ID from ElevenLabs dashboard

  return <ConversationInterface agentId={agentId} apiKey={apiKey} />;
};

export default Index;
