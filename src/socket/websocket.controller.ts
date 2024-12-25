import {
  Inject,
  OnWSConnection,
  WSBroadCast,
  WSController,
} from '@midwayjs/core';
import { Context } from '@midwayjs/ws';

@WSController()
export class WebsocketController {
  @Inject()
  ctx: Context;

  @OnWSConnection()
  async onConnection() {
    console.log(`namespace / got a connection ${this.ctx.readyState}`);
    this.ctx.send(JSON.stringify({ command: 'connected' }));
  }

  @WSBroadCast()
  async sendMessage(data: { command: 'refresh' }) {
    return data;
  }
}
