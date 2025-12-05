import React, { useState, useContext } from "react";
import { ChatContext } from "../context/ChatContext";
import MemberSelection from "./MemberSelection";
import "../styles/CreateChannelModal.css";

const CreateChannelModal = ({
  onClose,
  onPrivateChange,
  isPrivate,
  selectedMembers,
  onMembersChange,
}) => {
  const { createChannel } = useContext(ChatContext);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await createChannel(
        name,
        description,
        isPrivate,
        isPrivate ? selectedMembers : []
      );
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create channel");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>Create Channel</h2>
        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Channel Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter channel name"
              required
            />
          </div>

          <div className="form-group">
            <label>Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter channel description"
            />
          </div>

          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={isPrivate}
                onChange={(e) => {
                  onPrivateChange(e.target.checked);
                  if (!e.target.checked) {
                    onMembersChange([]);
                  }
                }}
              />
              Private Channel
            </label>
          </div>

          {isPrivate && (
            <MemberSelection
              selectedMembers={selectedMembers}
              onMembersChange={onMembersChange}
            />
          )}

          <div className="modal-buttons">
            <button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create"}
            </button>
            <button type="button" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateChannelModal;
