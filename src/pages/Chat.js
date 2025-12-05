import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { ChatContext } from "../context/ChatContext";
import ChatWindow from "../components/ChatWindow";
import CreateChannelModal from "../components/CreateChannelModal";
import "../styles/Chat.css";

const Chat = () => {
  const navigate = useNavigate();
  const { user, logout, token } = useContext(AuthContext);
  const { channels, selectChannel, currentChannel, fetchChannels } =
    useContext(ChatContext);
  const [showModal, setShowModal] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState([]);

  useEffect(() => {
    if (!token) {
      navigate("/login");
    }
  }, [token, navigate]);

  useEffect(() => {
    fetchChannels();
  }, [fetchChannels]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleCreateChannel = () => {
    setShowModal(true);
    setIsPrivate(false);
    setSelectedMembers([]);
  };

  return (
    <div className="chat-container">
      <div className="sidebar">
        <div className="user-info">
          <div className="user-info-content">
            <h3>{user?.username}</h3>
            <p className="user-email">{user?.email}</p>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>

        <div className="channels-section">
          <h2>Channels</h2>
          <button className="create-btn" onClick={handleCreateChannel}>
            + New Channel
          </button>

          <div className="channels-list">
            {channels.map((channel) => (
              <div
                key={channel._id}
                className={`channel-item ${
                  currentChannel?._id === channel._id ? "active" : ""
                }`}
                onClick={() => selectChannel(channel._id)}
              >
                <span className="channel-icon">#</span>
                <span className="channel-name">{channel.name}</span>
                {channel.isPrivate && <span className="private-badge">🔒</span>}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="chat-main">
        {currentChannel ? (
          <ChatWindow />
        ) : (
          <div className="no-channel-selected">
            <p>Select a channel to start chatting</p>
          </div>
        )}
      </div>

      {showModal && (
        <CreateChannelModal
          onClose={() => setShowModal(false)}
          onPrivateChange={setIsPrivate}
          isPrivate={isPrivate}
          selectedMembers={selectedMembers}
          onMembersChange={setSelectedMembers}
        />
      )}
    </div>
  );
};

export default Chat;
