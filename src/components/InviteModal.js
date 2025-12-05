import React, { useState, useEffect } from "react";
import { authAPI, channelAPI } from "../utils/api";
import "../styles/InviteModal.css";

const InviteModal = ({ onClose, channelId, channelMembers = [] }) => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await authAPI.getAllUsers();
        const memberIds = channelMembers.map((m) => m._id);
        const availableUsers = response.data.filter(
          (user) => !memberIds.includes(user._id)
        );
        setUsers(availableUsers);
        setLoading(false);
      } catch (error) {
        setError("Failed to load users");
        setLoading(false);
      }
    };
    fetchUsers();
  }, [channelMembers]);

  const handleInvite = async () => {
    if (!selectedUser) {
      setError("Please select a user");
      return;
    }

    setInviting(true);
    setError("");
    setMessage("");

    try {
      await channelAPI.inviteUser(channelId, selectedUser);
      setMessage("User invited successfully!");
      setSelectedUser("");
      const response = await authAPI.getAllUsers();
      const memberIds = channelMembers.map((m) => m._id);
      const updatedUsers = response.data.filter(
        (user) => !memberIds.includes(user._id) && user._id !== selectedUser
      );
      setUsers(updatedUsers);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to invite user");
    } finally {
      setInviting(false);
    }
  };

  if (loading) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>Invite Members</h2>
        {error && <div className="error-message">{error}</div>}
        {message && <div className="success-message">{message}</div>}

        {users.length === 0 ? (
          <p>All users are already members of this channel</p>
        ) : (
          <div>
            <div className="form-group">
              <label>Select User</label>
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
              >
                <option value="">-- Select a user --</option>
                {users.map((user) => (
                  <option key={user._id} value={user._id}>
                    {user.username} ({user.email})
                  </option>
                ))}
              </select>
            </div>

            <div className="modal-buttons">
              <button
                onClick={handleInvite}
                disabled={inviting || !selectedUser}
              >
                {inviting ? "Inviting..." : "Invite"}
              </button>
              <button onClick={onClose}>Close</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InviteModal;
