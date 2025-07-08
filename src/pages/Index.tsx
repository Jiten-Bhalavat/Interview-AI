import { ConversationInterface } from "@/components/ConversationInterface";

const Index = () => {
  // Your ElevenLabs API key
  const apiKey = "sk_69308ebd45c90df761a75b57f59e7bded37953348d884763";
  
  // You'll need to create a Conversational AI agent in ElevenLabs UI and get the agent ID
  const agentId = "agent_01jzmh18bxfn8s6dn76bzv8rwb"; // Add your Agent ID from ElevenLabs dashboard

  return <ConversationInterface agentId={agentId} apiKey={apiKey} />;
};

export default Index;
