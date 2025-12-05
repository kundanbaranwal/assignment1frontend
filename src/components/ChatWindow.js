import React, { useContext, useState, useRef, useEffect } from "react";
import { ChatContext } from "../context/ChatContext";
import { channelAPI } from "../utils/api";
import InviteModal from "./InviteModal";
import "../styles/ChatWindow.css";

const ChatWindow = () => {
  const {
    currentChannel,
    messages,
    onlineUsers,
    typingUsers,
    sendMessage,
    sendTyping,
    sendStopTyping,
    markMessageAsRead,
    fetchChannels,
    selectChannel,
    loadMoreMessages,
  } = useContext(ChatContext);
  const [messageInput, setMessageInput] = useState("");
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const currentUserId = localStorage.getItem("userId");
    messages.forEach((message) => {
      if (message.sender?._id !== currentUserId && message._id) {
        const hasUserRead = message.readBy?.some(
          (read) => read.userId?._id === currentUserId
        );
        if (!hasUserRead) {
          markMessageAsRead(message._id);
        }
      }
    });
  }, [messages, markMessageAsRead]);

  const handleInputChange = (e) => {
    setMessageInput(e.target.value);

    sendTyping();

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      sendStopTyping();
    }, 3000);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (messageInput.trim()) {
      sendMessage(messageInput);
      setMessageInput("");
      sendStopTyping();
    }
  };

  const handleDeleteChannel = async () => {
    if (
      !window.confirm(
        "Are you sure you want to delete this channel? This cannot be undone."
      )
    ) {
      return;
    }

    try {
      setLoading(true);
      await channelAPI.deleteChannel(currentChannel._id);
      alert("Channel deleted successfully");
      await fetchChannels();
      selectChannel(null);
    } catch (error) {
      alert("Failed to delete channel");
    } finally {
      setLoading(false);
    }
  };

  if (!currentChannel) {
    return <div>No channel selected</div>;
  }

  const isCreator =
    currentChannel.createdBy?._id === localStorage.getItem("userId");

  return (
    <div className="chat-window">
      <div className="chat-header">
        <div className="header-info">
          <h2>{currentChannel.name}</h2>
          {currentChannel.isPrivate && (
            <span className="private-badge">🔒</span>
          )}
          <p className="online-count">({onlineUsers.length} online)</p>
        </div>
        {isCreator && (
          <div className="header-actions">
            {currentChannel.isPrivate && (
              <button
                className="invite-btn"
                onClick={() => setShowInviteModal(true)}
              >
                👥 Invite
              </button>
            )}
            <button
              className="delete-btn"
              onClick={handleDeleteChannel}
              disabled={loading}
            >
              🗑️ Delete
            </button>
          </div>
        )}
      </div>

      <div className="messages-container">
        {messages.length > 0 && (
          <button className="load-more-btn" onClick={loadMoreMessages}>
            ⬆️ Load More
          </button>
        )}
        {messages.map((message) => {
          const readByArray = Array.isArray(message.readBy)
            ? message.readBy
            : [];
          const isMessageRead = readByArray.length > 0;
          const readCount = readByArray.length;

          return (
            <div key={message._id} className="message">
              <strong>{message.sender?.username || "Unknown"}</strong>
              <p>{message.content}</p>
              <div className="message-footer">
                <small>
                  {new Date(message.createdAt).toLocaleTimeString()}
                </small>
                {isMessageRead && (
                  <div className="read-receipt">
                    <span className="read-status">✓✓ Read ({readCount})</span>
                    <div className="read-by-tooltip">
                      {readByArray.map((read, idx) => (
                        <div key={idx} className="read-user-info">
                          <span className="read-user-name">
                            {read.userId?.username || "Unknown"}
                          </span>
                          <span className="read-timestamp">
                            {new Date(read.readAt).toLocaleTimeString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {typingUsers.length > 0 && (
          <div className="typing-indicator">
            {typingUsers.map((user) => (
              <span key={user.userId}>{user.username} is typing...</span>
            ))}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <form className="message-input-form" onSubmit={handleSendMessage}>
        <input
          type="text"
          value={messageInput}
          onChange={handleInputChange}
          placeholder="Type a message..."
          className="message-input"
        />
        <button type="submit" className="send-btn">
          Send
        </button>
      </form>

      {showInviteModal && (
        <InviteModal
          onClose={() => setShowInviteModal(false)}
          channelId={currentChannel._id}
          channelMembers={currentChannel.members}
        />
      )}
    </div>
  );
};

export default ChatWindow;
