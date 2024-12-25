import { MidwayConfig } from '@midwayjs/core';

export default {
  // use for cookie sign key, should change to your own and keep security
  keys: '1734941976704_1593',
  koa: {
    port: 7001,
  },
  jwt: {
    secret: 'dragon_ai_for_tg_test',
    expiresIn: '1d',
  },
  webSocket: {
    enableServerHeartbeatCheck: true,
    serverHeartbeatInterval: 30000,
  },
} as MidwayConfig;
