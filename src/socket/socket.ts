import { Server } from "socket.io";

import { socketService } from "../shared/socketService";
import { handleSendMessage } from "./userMessage/message";
import { User } from "../app/modules/user/user.model";
import { Message } from "../app/modules/message/message.model";

export const users = new Map();
export const activeChatUsers = new Map(); // Map to track active chat sessions

let io: Server; // Store io instance globally

const setupSocket = (server: any) => {
  io = new Server(server, {
    cors: {
      origin: ["*", "http://localhost:3000", "http://localhost:5173"],
      methods: ["GET", "POST"],
    },
  });

  // Set socket service instances
  socketService.setIO(io);
  socketService.setUsers(users);

  io.on("connection", (socket) => {
    console.log(`
      new user connected

      `);

    socket.on("register", (userId) => {
      const existingSockets = users.get(userId) || [];
      users.set(userId, [...existingSockets, socket.id]);
      console.log("onlineUsers", Array.from(users.keys()));
      io.emit("onlineUsers", Array.from(users.keys()));
    });

    socket.on("updateFcmToken", async (data) => {
      const { userId, fcmToken } = data;
      try {
        if (userId && fcmToken) {
          await User.findByIdAndUpdate(userId, { fcmToken });
          console.log(
            `FCM token updated for user ${userId} via socket: ${fcmToken}`
          );
          socket.emit("fcmTokenUpdated", { success: true });
        }
      } catch (error) {
        console.error("Error updating FCM token via socket:", error);
        socket.emit("fcmTokenUpdated", {
          success: false,
          error: "Failed to update FCM token",
        });
      }
    });

    socket.on("activeChat", (data) => {
      console.log("activeChat", data);
      if (data.senderId) {
        activeChatUsers.set(data.receiverId, data.senderId);
      } else {
        activeChatUsers.delete(data.receiverId);
      }
    });

    socket.on("sendMessage", async (data) => {
      try {
        console.log(
          "sendMessage",
          !data.senderId || !data.receiverId || (!data.message && !data.image)
        );
        // Add basic validation
        if (
          !data.senderId ||
          !data.receiverId ||
          (!data.message && !data.image)
        ) {
          socket.emit("error", { message: "Invalid message data" });
          return;
        }

        await handleSendMessage(data); // Call the function to handle sending messages
      } catch (error) {
        console.error("Error in sendMessage:", error);
        socket.emit("error", { message: "Failed to send message" });
      }
    });

    socket.on("markAsRead", async (data) => {
      try {
        console.log("markAsRead", data);
        const { senderId, receiverId } = data;

        if (senderId && receiverId) {
          await Message.updateMany(
            { sender: senderId, receiver: receiverId, isRead: false },
            { $set: { isRead: true, readAt: new Date() } }
          );

          // Notify the sender that messages have been read
          socketService.emitToUser(senderId, `messages-read`, {
            senderId,
            receiverId,
            isRead: true,
          });
        }
      } catch (error) {
        console.error("Error marking messages as read:", error);
        socket.emit("error", { message: "Failed to mark messages as read" });
      }
    });

    socket.on("disconnect", () => {
      users.forEach((socketIds, userId) => {
        const updated = socketIds.filter((id: any) => id !== socket.id);
        if (updated.length > 0) {
          users.set(userId, updated);
        } else {
          users.delete(userId);
          activeChatUsers.delete(userId);
        }
      });
      io.emit("onlineUsers", Array.from(users.keys()));
    });
  });

  return io;
};

export { setupSocket, io };
