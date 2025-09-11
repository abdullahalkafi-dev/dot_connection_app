import { Types } from "mongoose";
import { MessageServices } from "../../app/modules/message/message.service";
import { Connection } from "../../app/modules/match/match.model";
import { socketService } from "../../shared/socketService";

export const handleSendMessage = async (data: {
  senderId: Types.ObjectId;
  receiverId: Types.ObjectId;
  message?: string;
  image?: string;
}) => {
  try {
    console.log(data);
    console.log(data.receiverId);

    // Validate required fields
    if (!data.senderId || !data.receiverId || (!data.message && !data.image)) {
      console.error("Invalid message data", data);
      return;
    }

    // Check if users have mutual connection
    const connection = await Connection.findOne({
      userIds: { $all: [data.senderId, data.receiverId] },
    });

    if (!connection) {
      console.error("No mutual connection found between users");
      return;
    }

    // Create message in database first
    const savedMessage = await MessageServices.createMessage({
      sender: new Types.ObjectId(data.senderId),
      receiver: new Types.ObjectId(data.receiverId),
      message: data.message,
      image: data.image,
    });

    // Send to receiver if they are online
    socketService.emitToUser(data.receiverId.toString(), `receiver-${data.receiverId}`, {
      _id: (savedMessage as any)._id,
      senderId: data.senderId,
      receiverId: data.receiverId,
      message: data.message,
      image: data.image,
      messageType: savedMessage.messageType,
      isRead: false,
      createdAt: savedMessage.createdAt,
    });

    // Send confirmation back to sender
    socketService.emitToSender(data.senderId.toString(), `message-sent`, {
      _id: (savedMessage as any)._id,
      senderId: data.senderId,
      receiverId: data.receiverId,
      message: data.message,
      image: data.image,
      messageType: savedMessage.messageType,
      isRead: false,
      createdAt: savedMessage.createdAt,
      status: "sent",
    });
  } catch (error) {
    console.error("Error handling send message:", error);
  }
};
