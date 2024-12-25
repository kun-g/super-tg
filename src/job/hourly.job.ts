import { Job, IJob } from '@midwayjs/cron';
import { FORMAT } from '@midwayjs/core';
import prisma from '../db/prisma';

@Job({
  cronTime: FORMAT.CRONTAB.EVERY_HOUR,
  start: true,
  runOnInit: true,
})
export class HourlyJob implements IJob {
  async onTick() {
    const now = new Date();
    const startTime = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      now.getHours(),
      0,
      0
    ).getTime();

    const endTime = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      now.getHours(),
      59,
      59
    ).getTime();

    const hourlyBonus = await prisma.hourlyBonus.findFirst({
      where: {
        startTime,
        endTime,
      },
    });

    if (hourlyBonus) {
      console.log(
        `HourlyBonus already created for period ${startTime} - ${endTime}`
      );
      return;
    }

    await prisma.hourlyBonus.create({
      data: {
        startTime,
        endTime,
        totalBonus: 0,
        status: 'PENDING',
      },
    });
    console.log(`HourlyBonus created for period ${startTime} - ${endTime}`);
  }

  onComplete(result: any) {
    console.log(`HourlyBonus created`);
  }
}
