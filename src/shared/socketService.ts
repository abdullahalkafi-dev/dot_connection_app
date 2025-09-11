import { Types } from "mongoose";

export interface SocketService {
  getIO(): any;
  getUsers(): Map<any, any>;
  emitToUser(userId: string, event: string, data: any): void;
  emitToSender(senderId: string, event: string, data: any): void;
}

class SocketServiceImpl implements SocketService {
  private io: any = null;
  private users: Map<any, any> = new Map();

  setIO(ioInstance: any) {
    this.io = ioInstance;
  }

  setUsers(usersMap: Map<any, any>) {
    this.users = usersMap;
  }

  getIO() {
    return this.io;
  }

  getUsers() {
    return this.users;
  }

  emitToUser(userId: string, event: string, data: any): void {
    if (!this.io || !this.users) return;

    let userSocketId: string | undefined;
    this.users.forEach((socketIds: string[], uId: string) => {
      if (uId.toString() === userId.toString()) {
        if (socketIds && socketIds.length > 0) {
          userSocketId = socketIds[0];
        }
      }
    });

    if (userSocketId) {
      this.io.to(userSocketId).emit(event, data);
    }
  }

  emitToSender(senderId: string, event: string, data: any): void {
    this.emitToUser(senderId, event, data);
  }
}

export const socketService = new SocketServiceImpl();
