import { App, Inject, Provide } from '@midwayjs/core';
import prisma from '../db/prisma';
import { Context } from '@midwayjs/koa';
import { Application } from '@midwayjs/ws';

@Provide()
export class GameService {
  @Inject()
  ctx: Context;
  @App('webSocket')
  wsApp: Application;

  async getDragonStatus() {
    try {
      const aiModel = await prisma.aiModel.findUnique({
        where: {
          id: 'ONLY_ONE',
        },
      });
      if (!aiModel) {
        return { message: 'Error aiModel not initialized' };
      }
      const isBusy = aiModel.isBusy;
      return isBusy
        ? { message: 'Dragon is busy', isBusy }
        : { message: 'Dragon is sleeping', isBusy };
    } catch (e) {
      return { message: 'Error' };
    }
  }

  async getSendPrice({ content }: { content: string }) {
    const user = this.ctx.state.user;
    console.log(user, 'user');
    try {
      const { cost, expireAt, quoteId, orderId } = await prisma.$transaction(
        async tx => {
          const ps = await tx.pricingState.findUnique({
            where: {
              id: 'ONLY_ONE',
            },
          });
          if (!ps) {
            return { message: 'Error pricingState not initialized' };
          }
          const lockConst = await ps.cost.plus(
            0.01 * Math.pow(2, ps.cost.toNumber())
          );
          const expireAt = new Date(Date.now() + 1000 * 60 * 5);
          const quote = await tx.priceQuote.create({
            data: {
              createdAt: new Date(),
              lockedCost: lockConst,
              lockedVersion: ps.version,
              status: 'PENDING',
              expireAt,
              pricingStateId: ps.id,
              userId: user.id,
            },
          });

          const now = new Date();
          const hourlyBonus = await tx.hourlyBonus.findFirst({
            where: {
              status: 'PENDING',
              startTime: {
                lte: now.getTime(),
              },
              endTime: {
                gte: now.getTime(),
              },
            },
          });

          // 创建订单
          const order = await tx.order.create({
            data: {
              content,
              status: 'PENDING',
              expiresAt: expireAt,
              cost: lockConst,
              createBy: user.address,
              userId: user.id,
              HourlyBonusId: hourlyBonus.id,
            },
          });
          return {
            cost: lockConst,
            expireAt,
            quoteId: quote.id,
            orderId: order.id,
          };
        }
      );
      return {
        message: 'Success',
        cost,
        expireAt,
        quoteId,
        orderId,
      };
    } catch (e) {
      console.log(e);
      return { message: 'Error' };
    }
  }

  async lockAiModel() {
    const user = this.ctx.state.user;
    return prisma.$transaction(async tx => {
      // 1. 读取当前 AiModel
      const model = await tx.aiModel.findUnique({
        where: { id: 'ONLY_ONE' },
      });

      if (!model) {
        throw new Error('AI Model not found in the database.');
      }

      // 2. 检查是否已被占用
      if (model.isBusy) {
        throw new Error('AI Model is currently busy. Please try again later.');
      }

      // 3. 尝试更新模型状态，使用 version 作为乐观锁
      const updateResult = await tx.aiModel.updateMany({
        where: {
          id: 'ONLY_ONE',
          version: model.version, // 确保版本号匹配
        },
        data: {
          isBusy: true,
          currentUserId: user.tid,
          version: { increment: 1 }, // 自增版本号
        },
      });

      if (updateResult.count === 0) {
        // 更新失败，可能是因为版本号不匹配，存在并发冲突
        throw new Error(
          'Failed to lock the AI Model due to a conflict. Please retry.'
        );
      }
      await this.wsApp.clients.forEach(client => {
        client.send(
          JSON.stringify({
            command: 'changeSendStatusBusy',
          })
        );
      });
      // 成功锁定模型
      return true;
    });
  }

  async unlockAiModel(session_id?: string) {
    return prisma.$transaction(async tx => {
      // 1. 读取当前 AiModel
      const model = await tx.aiModel.findUnique({
        where: { id: 'ONLY_ONE' },
      });

      if (!model) {
        throw new Error('AI Model not found in the database.');
      }

      // 2. 检查是否已被占用
      if (!model.isBusy) {
        throw new Error('AI Model is not currently locked.');
      }

      // 3. 构建更新数据，根据是否传递 session_id 决定是否更新 currentSessionId
      const updateData: any = {
        isBusy: false,
        currentUserId: '',
        version: { increment: 1 }, // 自增版本号
      };

      if (session_id) {
        updateData.currentSessionId = session_id;
      }

      // 4. 尝试更新模型状态，使用 version 作为乐观锁
      const updateResult = await tx.aiModel.updateMany({
        where: {
          id: 'ONLY_ONE',
          version: model.version, // 确保版本号匹配
        },
        data: updateData,
      });

      if (updateResult.count === 0) {
        // 更新失败，可能是因为版本号不匹配，存在并发冲突
        throw new Error(
          'Failed to unlock the AI Model due to a conflict. Please retry.'
        );
      }

      await this.wsApp.clients.forEach(client => {
        client.send(
          JSON.stringify({
            command: 'changeSendStatusFree',
          })
        );
      });

      // 成功解锁模型
      return true;
    });
  }

  async getAiModelCurrentSessionId() {
    const model = await prisma.aiModel.findUnique({
      where: { id: 'ONLY_ONE' },
    });
    if (!model) {
      // throw new Error('AI Model not found in the database.');
      return { message: 'AI Model not found in the database.' };
    }
    return {
      message: 'Success',
      currentSessionId: model.currentSessionId || '',
    };
  }

  async acceptPriceQuote(quoteId: string) {
    return await prisma.$transaction(async tx => {
      const quote = await tx.priceQuote.findUnique({
        where: {
          id: quoteId,
        },
        include: {
          pricingState: true,
        },
      });
      if (!quote) {
        return { message: 'Error quote not found' };
      }
      if (!quote.pricingState) {
        return { message: 'Error pricingState not found' };
      }
      if (quote.status !== 'PENDING') {
        // 已经 ACCEPTED 或 EXPIRED
        return { message: 'Error quote is not pending' };
      }
      const ps = quote.pricingState;
      if (ps.version !== quote.lockedVersion || new Date() > quote.expireAt) {
        await tx.priceQuote.update({
          where: {
            id: quote.id,
          },
          data: { status: 'EXPIRED' },
        });
        // throw new Error('Quote is expired or version mismatch');
        return { message: 'Quote is expired or version mismatch' };
      }
      const oldCount = ps.count;
      const newCount = oldCount + 1;

      const newCost = ps.cost.plus(0.01 * Math.pow(2, oldCount));

      const updatedPs = await tx.pricingState.updateMany({
        where: {
          id: ps.id,
          version: ps.version,
        },
        data: {
          count: newCount,
          cost: newCost,
          version: { increment: 1 },
        },
      });
      if (updatedPs.count === 0) {
        return { message: 'PricingState conflict again, please retry' };
      }
      await tx.priceQuote.update({
        where: {
          id: quote.id,
        },
        data: {
          status: 'ACCEPTED',
        },
      });
      await this.lockAiModel();

      return { message: 'Success', isSuccess: true };
    });
  }
}
