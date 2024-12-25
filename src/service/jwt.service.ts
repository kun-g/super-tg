import { Provide, Config } from '@midwayjs/core';
import * as jwt from 'jsonwebtoken';

@Provide()
export class JwtService {
  @Config('jwt.secret')
  private secret: string;

  // 生成 Token
  async generateToken(payload: object): Promise<string> {
    return jwt.sign(payload, this.secret);
  }

  // 验证 Token
  async verifyToken(token: string): Promise<any> {
    try {
      return jwt.verify(token, this.secret);
    } catch (err) {
      throw new Error('Invalid or expired token');
    }
  }
}
