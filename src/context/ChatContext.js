import React, { useEffect, useCallback, useState } from "react";
import io from "socket.io-client";
import { channelAPI, messageAPI } from "../utils/api";

export const ChatContext = React.createContext();

export const ChatProvider = ({ children, token }) => {
  const [channels, setChannels] = useState([]);
  const [currentChannel, setCurrentChannel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [socket, setSocket] = useState(null);
  const [loading, setLoading] = useState(false);
  const [messageOffset, setMessageOffset] = useState(0);

  const WS_URL = process.env.REACT_APP_WS_URL || "http://localhost:5000";

  useEffect(() => {
    if (!token) return;

    const newSocket = io(WS_URL, {
      auth: { token },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    newSocket.on("connect", () => {});

    newSocket.on("error", (error) => {});

    newSocket.on("receive-message", (message) => {
      setMessages((prev) => {
        const updated = [...prev, { ...message, readBy: message.readBy || [] }];
        setCurrentChannel((ch) => {
          if (ch) {
            const cacheKey = `messages_${ch._id}`;
            localStorage.setItem(cacheKey, JSON.stringify(updated));
          }
          return ch;
        });
        return updated;
      });
    });

    newSocket.on("message-read", (data) => {
      const { messageId, readBy } = data;
      setMessages((prev) =>
        prev.map((msg) => (msg._id === messageId ? { ...msg, readBy } : msg))
      );
    });

    newSocket.on("user-online", (data) => {
      setOnlineUsers((prev) => {
        if (!prev.some((u) => u.userId === data.userId)) {
          return [...prev, data];
        }
        return prev;
      });
    });

    newSocket.on("user-offline", (data) => {
      setOnlineUsers((prev) => prev.filter((u) => u.userId !== data.userId));
    });

    newSocket.on("channel-online-users", (users) => {
      setOnlineUsers(users);
    });

    newSocket.on("user-typing", (data) => {
      setTypingUsers((prev) => {
        if (!prev.some((u) => u.userId === data.userId)) {
          return [...prev, data];
        }
        return prev;
      });
    });

    newSocket.on("user-stop-typing", (data) => {
      setTypingUsers((prev) => prev.filter((u) => u.userId !== data.userId));
    });

    setSocket(newSocket);
    //y
    return () => {
      newSocket.disconnect();
    };
  }, [token, WS_URL]);

  const fetchChannels = useCallback(async () => {
    try {
      setLoading(true);
      const response = await channelAPI.getChannels();
      setChannels(response.data);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  }, []);

  const selectChannel = useCallback(
    async (channelId) => {
      try {
        setLoading(true);
        const channel = await channelAPI.getChannelById(channelId);
        setCurrentChannel(channel.data);

        const cacheKey = `messages_${channelId}`;
        const cachedData = localStorage.getItem(cacheKey);

        if (cachedData) {
          const cached = JSON.parse(cachedData);
          setMessages(cached);
          setMessageOffset(cached.length);
        }

        const messagesResponse = await messageAPI.getMessages(channelId);
        const messagesWithReadBy = messagesResponse.data.map((msg) => ({
          ...msg,
          readBy: msg.readBy || [],
        }));

        const cachedLength = cachedData ? JSON.parse(cachedData).length : 0;
        if (messagesWithReadBy.length > cachedLength) {
          setMessages(messagesWithReadBy);
          setMessageOffset(messagesWithReadBy.length);
        }

        localStorage.setItem(cacheKey, JSON.stringify(messagesWithReadBy));

        socket?.emit("join-channel", channelId);

        setOnlineUsers([]);
      } finally {
        setLoading(false);
      }
    },
    [socket]
  );

  const leaveChannel = useCallback(
    (channelId) => {
      socket?.emit("leave-channel", channelId);
      setOnlineUsers([]);
    },
    [socket]
  );

  const createChannel = useCallback(
    async (name, description, isPrivate, members) => {
      try {
        const response = await channelAPI.createChannel(
          name,
          description,
          isPrivate,
          members
        );

        if (isPrivate && members && members.length > 0) {
          for (const memberId of members) {
            await channelAPI.inviteUser(response.data.channel._id, memberId);
          }
        }

        await fetchChannels();
        return response.data.channel;
      } catch (error) {
        throw error;
      }
    },
    [fetchChannels]
  );

  const sendMessage = useCallback(
    (content) => {
      if (!currentChannel || !socket) return;

      socket.emit("new-message", {
        channelId: currentChannel._id,
        message: {
          content,
          createdAt: new Date().toISOString(),
        },
      });
    },
    [currentChannel, socket]
  );

  const inviteUser = useCallback(
    async (userId) => {
      if (!currentChannel) return;
      try {
        const response = await channelAPI.inviteUser(
          currentChannel._id,
          userId
        );
        setCurrentChannel(response.data.channel);
      } catch (error) {
        throw error;
      }
    },
    [currentChannel]
  );

  const removeUser = useCallback(
    async (userId) => {
      if (!currentChannel) return;
      try {
        const response = await channelAPI.removeUser(
          currentChannel._id,
          userId
        );
        setCurrentChannel(response.data.channel);
      } catch (error) {
        throw error;
      }
    },
    [currentChannel]
  );

  const sendTyping = useCallback(() => {
    if (!currentChannel || !socket) return;
    socket.emit("typing", { channelId: currentChannel._id });
  }, [currentChannel, socket]);

  const sendStopTyping = useCallback(() => {
    if (!currentChannel || !socket) return;
    socket.emit("stop-typing", { channelId: currentChannel._id });
  }, [currentChannel, socket]);

  const markMessageAsRead = useCallback(async (messageId) => {
    try {
      const response = await messageAPI.markAsRead(messageId);

      if (response.data && response.data.data) {
        const updatedMessage = response.data.data;

        setMessages((prev) => {
          const updated = prev.map((msg) =>
            msg._id === messageId
              ? { ...msg, readBy: updatedMessage.readBy || [] }
              : msg
          );
          return updated;
        });
      } else {
      }
    } catch (error) {}
  }, []);

  const loadMoreMessages = useCallback(async () => {
    if (!currentChannel) return;
    try {
      const response = await messageAPI.getMessageHistory(
        currentChannel._id,
        messageOffset
      );
      if (response.data && response.data.length > 0) {
        const messagesWithReadBy = response.data.map((msg) => ({
          ...msg,
          readBy: msg.readBy || [],
        }));
        setMessages((prev) => {
          const updated = [...messagesWithReadBy, ...prev];
          const cacheKey = `messages_${currentChannel._id}`;
          localStorage.setItem(cacheKey, JSON.stringify(updated));
          return updated;
        });
        setMessageOffset((prev) => prev + messagesWithReadBy.length);
      }
    } catch (error) {}
  }, [currentChannel, messageOffset]);
  return (
    <ChatContext.Provider
      value={{
        channels,
        currentChannel,
        messages,
        onlineUsers,
        typingUsers,
        loading,
        socket,
        fetchChannels,
        selectChannel,
        leaveChannel,
        createChannel,
        sendMessage,
        inviteUser,
        removeUser,
        sendTyping,
        sendStopTyping,
        markMessageAsRead,
        loadMoreMessages,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};
