import { OnModuleInit } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

import { ChatService } from './chat.service';

@WebSocketGateway()
export class ChatGateway implements OnModuleInit {
  @WebSocketServer()
  public server: Server;

  constructor(private readonly chatService: ChatService) {}

  onModuleInit() {
    this.server.on('connection', (socket: Socket) => {
      const { name } = socket.handshake.auth;

      if (!name) {
        socket.disconnect();
        return;
      }

      this.chatService.onClientConnected({ id: socket.id, name });

      socket.emit('on-change-connected', this.chatService.getClients());

      socket.on('disconnect', () => {
        this.chatService.onClientDisconnected(socket.id);
        socket.emit('on-change-connected', this.chatService.getClients());
      });
    });
  }

  @SubscribeMessage('send-message')
  onMessage(@MessageBody() message: string, @ConnectedSocket() client: Socket) {
    const { name } = client.handshake.auth;

    if (!message) {
      return;
    }

    this.server.emit('on-message', { userId: client.id, message, name });
  }
}
