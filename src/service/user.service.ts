import { Provide } from '@midwayjs/core';
import { ILoginParams, IUserOptions } from '../interface';
import prisma from '../db/prisma';

@Provide()
export class UserService {
  async getUser(options: IUserOptions) {
    return {
      uid: options.uid,
      username: 'mockedName',
      phone: '12345678901',
      email: 'xxx.xxx@xxx.com',
    };
  }

  async login(options: ILoginParams) {
    const { address } = options;
    let message = 'login failed';
    let code = 500;

    if (!address) {
      message = 'address is required';
      return { message, code };
    }

    try {
      const [user] = await prisma.$transaction([
        prisma.user.findFirst({
          where: {
            address,
          },
        }),
      ]);

      if (!user) {
        const newUser = await prisma.$transaction([
          prisma.user.create({
            data: {
              address,
            },
          }),
        ]);
        message = 'Login successful';
        code = 200;
        return { message, code, user: newUser[0] };
      } else {
        message = 'Login successful';
        code = 200;
        return { message, code, user };
      }
    } catch (error) {
      console.error('Error in login:', error);
      return { message: 'Internal server error', code: 500 };
    }
  }
}
