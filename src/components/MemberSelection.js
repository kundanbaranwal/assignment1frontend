import React, { useState, useEffect } from "react";
import { authAPI } from "../utils/api";
import "../styles/MemberSelection.css";

const MemberSelection = ({ selectedMembers, onMembersChange }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await authAPI.getAllUsers();
        setUsers(response.data);
        setLoading(false);
      } catch (error) {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const toggleMember = (userId) => {
    if (selectedMembers.includes(userId)) {
      onMembersChange(selectedMembers.filter((id) => id !== userId));
    } else {
      onMembersChange([...selectedMembers, userId]);
    }
  };

  const removeMember = (userId) => {
    onMembersChange(selectedMembers.filter((id) => id !== userId));
  };

  if (loading) {
    return <div>Loading users...</div>;
  }

  return (
    <div className="member-selection">
      <label>Select Members</label>
      <div className="member-list">
        {users.map((user) => (
          <label key={user._id} className="member-item">
            <input
              type="checkbox"
              checked={selectedMembers.includes(user._id)}
              onChange={() => toggleMember(user._id)}
            />
            <span>{user.username}</span>
          </label>
        ))}
      </div>

      {selectedMembers.length > 0 && (
        <div className="selected-members">
          <h4>Selected Members ({selectedMembers.length})</h4>
          <div className="member-tags">
            {selectedMembers.map((memberId) => {
              const user = users.find((u) => u._id === memberId);
              return (
                <span key={memberId} className="member-tag">
                  {user?.username}
                  <button
                    type="button"
                    onClick={() => removeMember(memberId)}
                    className="remove-tag"
                  >
                    ×
                  </button>
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default MemberSelection;
