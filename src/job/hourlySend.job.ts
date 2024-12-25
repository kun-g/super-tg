import { Job, IJob } from '@midwayjs/cron';
import { FORMAT } from '@midwayjs/core';
import prisma from '../db/prisma';
import { Decimal } from '@prisma/client/runtime/library';

@Job({
  //   cronTime: FORMAT.CRONTAB.
  cronTime: FORMAT.CRONTAB.EVERY_HOUR,
  start: true,
  runOnInit: true,
})
export class HourlySendJob implements IJob {
  async onTick() {
    console.log('start to send hourly bonus');
    const now = new Date();
    const startTime = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      now.getHours() - 1,
      0,
      0
    ).getTime();
    const endTime = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      now.getHours() - 1,
      59,
      59
    ).getTime();

    const hourlyBonus = await prisma.hourlyBonus.findFirst({
      where: {
        startTime,
        endTime,
        status: 'PENDING',
      },
      include: {
        lastOrder: true,
        userBonuses: true,
      },
    });
    console.log('hourlyBonus', hourlyBonus);
    if (!hourlyBonus) {
      console.log(`HourlyBonus not found for period ${startTime} - ${endTime}`);
      return;
    }

    const allCompletedOrders = await prisma.order.findMany({
      where: {
        status: 'COMPLETED',
        createdAt: {
          gte: new Date(startTime),
          lte: new Date(endTime),
        },
        HourlyBonusId: hourlyBonus.id,
      },
    });

    if (allCompletedOrders.length === 0) {
      console.log(`No orders found for period ${startTime} - ${endTime}`);
      await prisma.hourlyBonus.update({
        where: {
          id: hourlyBonus.id,
        },
        data: {
          status: 'COMPLETED',
        },
      });
      return;
    }

    const lastUserId = hourlyBonus.userId;

    const participatingUsers = await prisma.order.findMany({
      where: {
        HourlyBonusId: hourlyBonus.id,
        status: 'COMPLETED',
      },
      distinct: ['userId'],
      select: { userId: true },
    });

    const uniqueUsers = participatingUsers
      .map(u => u.userId)
      .filter(u => u !== null);

    if (uniqueUsers.length === 0) {
      await prisma.hourlyBonus.update({
        where: {
          id: hourlyBonus.id,
        },
        data: {
          status: 'COMPLETED',
        },
      });
      console.log(`No unique users found for period ${startTime} - ${endTime}`);
      return;
    }

    // 计算总成本
    const totalCost = await prisma.order.aggregate({
      where: {
        HourlyBonusId: hourlyBonus.id,
        status: 'COMPLETED',
      },
      _sum: {
        cost: true,
      },
    });

    const totalBonus = new Decimal(totalCost._sum.cost || 0.0);

    if (totalBonus.isZero()) {
      console.log(
        `HourlyBonus ${hourlyBonus.id} has zero total bonus. Marked as COMPLETED.`
      );
      await prisma.hourlyBonus.update({
        where: {
          id: hourlyBonus.id,
        },
        data: {
          status: 'COMPLETED',
        },
      });
      return;
    }

    const bonusForLastUser = totalBonus.mul(0.1);
    const bonusForOthers = totalBonus
      .mul(0.9)
      .div(uniqueUsers.length > 1 ? uniqueUsers.length - 1 : 1);

    await prisma.$transaction(async tx => {
      // 创建 UserBonus 记录
      for (const userId of uniqueUsers) {
        let bonusAmount: Decimal;

        if (userId === lastUserId) {
          bonusAmount = bonusForLastUser;
        } else {
          bonusAmount = bonusForOthers;
        }

        await tx.userBonus.create({
          data: {
            hourlyBonusId: hourlyBonus.id,
            userId,
            bonusAmount,
          },
        });
      }

      // 更新 HourlyBonus 状态为 COMPLETED
      await tx.hourlyBonus.update({
        where: { id: hourlyBonus.id },
        data: { status: 'COMPLETED' },
      });
    });
  }
}
