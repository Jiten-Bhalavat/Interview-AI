import { ConversationInterface } from "@/components/ConversationInterface";

const Index = () => {
  // Your ElevenLabs API key
  const apiKey = "sk_99517a0c3971520ec31c8bbd1a76d74a1f1afb488e4373c6";
  
  // You'll need to create a Conversational AI agent in ElevenLabs UI and get the agent ID
  const agentId = "agent_01k0498sbnee7aydnma5fjbd4a"; // Add your Agent ID from ElevenLabs dashboard

  return <ConversationInterface agentId={agentId} apiKey={apiKey} />;
};

export default Index;
