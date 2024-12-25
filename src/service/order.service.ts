import { Provide } from '@midwayjs/core';
import prisma from '../db/prisma';
import { OrderStatus } from '@prisma/client';

@Provide()
export class OrderService {
  async getOrderContent(orderId: string) {
    try {
      const order = await prisma.order.findUnique({
        where: {
          id: orderId,
        },
      });
      if (!order) {
        return { message: 'Error order not found', success: false };
      }
      return { message: 'Success', content: order.content, success: true };
    } catch (e) {
      return { message: 'Error', success: false };
    }
  }

  async updateOrderStatus(orderId: string, status: OrderStatus) {
    const order = await prisma.order.findUnique({
      where: {
        id: orderId,
      },
    });
    if (!order) {
      return { message: 'Error order not found', success: false };
    }
    try {
      await prisma.order.update({
        where: {
          id: orderId,
        },
        data: {
          status,
        },
      });
      if (status === OrderStatus.COMPLETED) {
        const currentHourlyBonus = await prisma.hourlyBonus.findFirst({
          where: {
            startTime: {
              lte: new Date().getTime(),
            },
            endTime: {
              gte: new Date().getTime(),
            },
            status: 'PENDING',
          },
        });
        if (!currentHourlyBonus) {
          return { message: 'Error hourly bonus not found', success: false };
        } else {
          await prisma.hourlyBonus.update({
            where: {
              id: currentHourlyBonus.id,
            },
            data: {
              totalBonus: {
                increment: order.cost,
              },
              userId: order.userId,
              lastSenderAddress: order.createBy,
              lastOrderId: order.id,
            },
          });
          return { message: 'Success', success: true };
        }
      }
      return { message: 'Success', success: true };
    } catch (e) {
      console.log(e);
      return { message: 'Error', success: false };
    }
  }
}
