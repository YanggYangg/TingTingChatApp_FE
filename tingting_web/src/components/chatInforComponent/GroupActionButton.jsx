// GroupActionButton.jsx
const GroupActionButton = ({ icon, text }) => {
    return (
      <button className="flex flex-col items-center text-sm text-gray-700 hover:text-blue-500">
        <span className="text-2xl">{icon}</span>
        <span>{text}</span>
      </button>
    );
  };
  
  export default GroupActionButton;