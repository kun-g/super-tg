import { Inject, Provide } from '@midwayjs/core';
import { Trace } from 'tonapi-sdk-js';
import prisma from '../db/prisma';
import { Context } from '@midwayjs/koa';

import { toNano } from '@ton/core';
import client from '../utils/tonApiClient';

function isTraceSuccess(trace: Trace): {
  isSuccess: boolean;
  text?: string;
  cost?: number;
} {
  if (!trace.transaction.success) {
    return { isSuccess: false };
  }

  let totalCost = trace.transaction.in_msg.value || 0;
  let text = trace.transaction.in_msg.decoded_body?.text || '';

  if (trace.children && trace.children.length > 0) {
    for (let i = 0; i < trace.children.length; i++) {
      const childResult = isTraceSuccess(trace.children[i]);
      if (!childResult.isSuccess) {
        return { isSuccess: false };
      }
      // Accumulate the cost from child transactions
      totalCost += childResult.cost || 0;
      // If text is not already set, take it from the child
      if (!text && childResult.text) {
        text = childResult.text;
      }
    }
  }

  return {
    isSuccess: true,
    text: text,
    cost: totalCost,
  };
}

@Provide()
export class TransactionService {
  @Inject()
  ctx: Context;
  async getTransactionStatusByHash(hash: string) {
    const trace = await client.traces.getTrace(hash);
    const { isSuccess, text, cost } = isTraceSuccess(trace);
    // console.log(transaction);
    return { isSuccess, text, cost };
  }

  async judgeTransaction(text: string, orderId: string, cost: number) {
    if (!text || !orderId || !cost) {
      return { message: 'Error' };
    }
    const order = await prisma.order.findUnique({
      where: {
        id: orderId,
      },
    });
    if (!order) {
      return { message: 'Error' };
    }
    const orderContent = order.content;
    const orderCost = order.cost;
    const createBy = order.createBy;
    const user = this.ctx.state.user;
    const trueContent = orderContent.split(':')[1];
    if (text !== trueContent) {
      return { message: 'not a valid transaction', isSuccess: false };
    }
    if (String(cost) !== toNano(orderCost.toFixed(9)).toString()) {
      return { message: 'not a valid transaction' };
    }

    if (user.address !== createBy) {
      return { message: 'not a valid transaction', isSuccess: false };
    }
    return { message: 'Success', isSuccess: true };
  }
}
