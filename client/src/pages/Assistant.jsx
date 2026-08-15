import AssistantChat from "../components/AssistantChat.jsx";

function Assistant({ currentUser }) {
  return (
    <div className="assistant-page">
      <AssistantChat currentUser={currentUser} />
    </div>
  );
}

export default Assistant;
