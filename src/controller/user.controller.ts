import {
  Body,
  Controller,
  Inject,
  Post,
  Get,
  sleep,
  App,
} from '@midwayjs/core';
import { UserService } from '../service/user.service';
import { JwtService } from '../service/jwt.service';
import { GameService } from '../service/game.service';
import { Context } from '@midwayjs/koa';
import { TransactionService } from '../service/transaction.service';
import { MessageService } from '../service/message.service';
import { OrderService } from '../service/order.service';
import { Application } from '@midwayjs/ws';

@Controller('/user')
export class UserController {
  @Inject()
  userService: UserService;
  @Inject()
  jwtService: JwtService;
  @Inject()
  gameService: GameService;
  @Inject()
  transactionService: TransactionService;
  @Inject()
  messageService: MessageService;
  @Inject()
  orderService: OrderService;
  @App('webSocket')
  wsApp: Application;
  @Inject()
  ctx: Context;

  @Post('/login')
  async login(@Body() body) {
    // console.log(body);
    const { address } = body;
    const { message, user } = await this.userService.login({ address });
    const token = await this.jwtService.generateToken({
      id: user.id,
      address,
    });
    return {
      success: true,
      message,
      code: 200,
      data: {
        ...user,
        token,
      },
    };
  }

  @Get('/getDragonStatus')
  async getDragonStatus() {
    const { message, isBusy } = await this.gameService.getDragonStatus();
    if (message === 'Error') {
      return {
        success: false,
        message,
        code: 500,
      };
    }
    return {
      success: true,
      message,
      code: 200,
      data: {
        isBusy,
      },
    };
  }

  @Post('/getSendPrice')
  async getSendPrice(@Body() body) {
    const { content } = body;
    const user = this.ctx.state.user;
    if (!user) {
      return {
        success: false,
        message: 'Unauthorized',
        code: 401,
      };
    }
    const { cost, expireAt, message, quoteId, orderId } =
      await this.gameService.getSendPrice({
        content,
      });
    if (message === 'Error') {
      return {
        success: false,
        message,
        code: 500,
      };
    }
    return {
      success: true,
      message,
      code: 200,
      data: {
        cost,
        expireAt,
        quoteId,
        orderId,
      },
    };
  }

  @Post('/confirmSend')
  async confirmSend(@Body() body) {
    try {
      const user = this.ctx.state.user;
      const { hash, quoteId, orderId } = body;
      const MAX_TRIES = 3;
      const RETRY_DELAY_MS = 5000;

      // 辅助函数：处理失败响应
      const handleFailure = (message: string) => ({
        success: false,
        message,
        code: 500,
      });

      for (let tryCount = 0; tryCount < MAX_TRIES; tryCount++) {
        const { isSuccess, text, cost } =
          await this.transactionService.getTransactionStatusByHash(hash);

        if (!isSuccess) {
          if (tryCount === MAX_TRIES - 1) {
            return handleFailure('Transaction confirmation failed');
          }
          await sleep(RETRY_DELAY_MS);
          continue;
        }

        console.log('Transaction confirmed');

        // 验证交易
        const { isSuccess: isValidTransaction, message: validationMessage } =
          await this.transactionService.judgeTransaction(text, orderId, cost);
        if (!isValidTransaction) {
          return handleFailure(validationMessage);
        }

        // 更新订单状态为 PAID
        const updateOrderPaid = await this.orderService.updateOrderStatus(
          orderId,
          'PAID'
        );
        if (!updateOrderPaid.success) {
          return handleFailure(
            updateOrderPaid.message || 'Failed to update order status to PAID'
          );
        }

        // 接受报价
        const { isSuccess: acceptQuoteSuccess, message: acceptQuoteMessage } =
          await this.gameService.acceptPriceQuote(quoteId);
        if (!acceptQuoteSuccess) {
          return handleFailure(
            acceptQuoteMessage || 'Failed to accept price quote'
          );
        }

        // 获取订单内容
        const { success: getContentSuccess, content } =
          await this.orderService.getOrderContent(orderId);
        if (!getContentSuccess) {
          return handleFailure('Failed to retrieve order content');
        }

        // 发送消息
        await this.messageService.insertMessage({
          content: text,
          from: 'USER',
          address: user.address,
        });
        await this.messageService.sendMessage({ content });

        // 更新订单状态为 COMPLETED
        const updateOrderCompleted = await this.orderService.updateOrderStatus(
          orderId,
          'COMPLETED'
        );
        this.wsApp.clients.forEach(client => {
          client.send(
            JSON.stringify({
              command: 'refresh',
            })
          );
        });
        if (!updateOrderCompleted.success) {
          return handleFailure(
            updateOrderCompleted.message ||
              'Failed to update order status to COMPLETED'
          );
        }

        // 成功完成所有步骤
        return {
          success: true,
          message: 'Success',
          code: 200,
        };
      }
    } catch (error) {
      console.error(error);
      await this.gameService.unlockAiModel();
      return {
        success: false,
        message: 'An unexpected error occurred',
        code: 500,
      };
    }
  }

  @Get('/getMessages')
  async getMessages() {
    const { messages, success } = await this.messageService.getMessages();
    if (!success) {
      return {
        success: false,
        message: 'Error',
        code: 500,
      };
    }
    return {
      success: true,
      message: 'Success',
      code: 200,
      data: {
        messages,
      },
    };
  }
}
