import { Inject, Controller, Get, Post, Body } from '@midwayjs/core';
import { Context } from '@midwayjs/koa';
import { AiService } from '../service/ai.service';

@Controller('/ai')
export class AIController {
  @Inject()
  ctx: Context;
  @Inject()
  aiService: AiService;

  @Get('/get_treasurer')
  async getTreasurer() {
    const balance = await this.aiService.getTreasurer();
    return {
      success: true,
      code: 200,
      data: {
        balance,
      },
    };
  }

  @Get('/get_hourly_treasure')
  async getHourlyTreasure() {
    const { balance, lastSenderAddress } =
      await this.aiService.getHourlyTreasure();
    return {
      success: true,
      code: 200,
      data: {
        balance,
        lastSenderAddress,
      },
    };
  }

  @Post('/dragon_fire_attack')
  async dragonFireAttack(@Body() body) {
    const { address } = body;
    console.log(body);
    const { message } = await this.aiService.sendTransaction({ address });
    return {
      success: true,
      code: 200,
      message,
    };
  }
}
