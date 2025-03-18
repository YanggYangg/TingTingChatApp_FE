const MessageItem = ({ msg }) => {
  return (
    <div
      className={`flex ${
        msg.sender === "Bạn" ? "justify-end" : "justify-start"
      }`}
    >
      <div
        className={`p-2 rounded-lg w-fit max-w-xs ${
          msg.sender === "Bạn"
            ? "bg-blue-200 text-black"
            : "bg-gray-200 text-black"
        }`}
      >
        {msg.type === "chat" && <p>{msg.text}</p>}

        {msg.type === "image" && (
          <img
            src={msg.imageUrl}
            alt="Sent image"
            className="w-40 h-auto rounded-lg"
          />
        )}

        {msg.type === "file" && (
          <a
            href={msg.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline"
          >
            📎 {msg.fileName}
          </a>
        )}

        {msg.type === "call" && (
          <p className="text-red-500">
            {msg.missed ? "Cuộc gọi nhỡ" : `📞 Cuộc gọi ${msg.callDuration}`}
          </p>
        )}

        <p className="text-xs text-gray-500 text-right">{msg.time}</p>
      </div>
    </div>
  );
};

export default MessageItem;
