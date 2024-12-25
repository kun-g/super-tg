// src/middleware/jwt.middleware.ts
import { Provide, Middleware, Inject, ScopeEnum, Scope } from '@midwayjs/core';
import { JwtService } from '../service/jwt.service';

@Provide()
@Scope(ScopeEnum.Request) // 将中间件改为请求级
@Middleware()
export class JwtMiddleware {
  @Inject()
  jwtService: JwtService;

  resolve() {
    return async (ctx, next) => {
      const authHeader = ctx.headers['authorization'];
      const { method, path } = ctx.request;
      if (['/user/login', '/user/getMessages'].includes(path)) {
        await next();
        return;
      }
      if (path.startsWith('/ai')) {
        await next();
        return;
      }
      // todo:要完善鉴权
      if (path === '/ai/dragon_fire_attack' && method === 'POST') {
        await next();
        return;
      }
      if (!authHeader) {
        ctx.status = 401;
        ctx.body = { code: 401, message: 'Authorization header is missing' };
        return;
      }

      const token = authHeader.split(' ')[1]; // Bearer <token>
      try {
        const payload = await this.jwtService.verifyToken(token);
        console.log(payload);
        ctx.state.user = payload; // 将解析后的用户信息存入 ctx.state
        await next();
      } catch (err) {
        console.log(err);
        if (err.message === 'jwt expired') {
          ctx.status = 401;
          ctx.body = { code: 401, message: 'Invalid or expired token' };
        }
      }
    };
  }

  // 中间件的顺序和路由范围
  static getName() {
    return 'jwt';
  }

  static match(ctx) {
    // 只保护特定的路由
    return ctx.path.startsWith('/protected');
  }
}
