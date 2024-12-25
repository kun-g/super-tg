import { Job, IJob } from '@midwayjs/cron';
import { FORMAT } from '@midwayjs/core';
import prisma from '../db/prisma';
import { toNano } from 'ton';
import initWallet, { getSecretKey } from '../utils/walletContract';
import { internal } from '@ton/core';

@Job({
  cronTime: FORMAT.CRONTAB.EVERY_PER_5_MINUTE,
  start: true,
  runOnInit: true,
})
export class SendQueue implements IJob {
  async onTick() {
    console.log('start to send queue');
    const userBonuses = await prisma.userBonus.findMany({
      where: {
        sendStatus: 'PENDING',
      },
    });

    if (userBonuses.length === 0) {
      console.log('No user bonuses wait to send');
      return;
    }

    for (const userBonus of userBonuses) {
      const { userId, bonusAmount } = userBonus;
      const user = await prisma.user.findUnique({
        where: {
          id: userId,
        },
      });
      if (!user) {
        console.log(`User ${userId} not found`);
        continue;
      }
      const { address } = user;

      const fee = toNano(0.05);
      const amount = toNano(bonusAmount.toNumber());
      if (amount < fee) {
        console.log(`Bonus amount ${amount} is less than fee ${fee}`);
        continue;
      }
      // 计算可发送的金额（余额减去手续费）
      const sendValue = amount - fee;
      const wallet = await initWallet();
      const key = await getSecretKey();
      // 发送逻辑
      try {
        await wallet.sendTransfer({
          seqno: await wallet.getSeqno(),
          secretKey: key.secretKey,
          messages: [
            internal({
              to: address,
              value: sendValue,
              body: '尼德霍格的恩赐',
              bounce: true,
            }),
          ],
        });
        await prisma.userBonus.update({
          where: {
            id: userBonus.id,
          },
          data: {
            sendStatus: "COMPLETED",
          },
        });
        console.log('Send bonus success');
      } catch (e) {
        console.log('Send bonus failed');
      }
    }
  }
}
