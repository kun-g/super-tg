import { Inject, Provide } from '@midwayjs/core';
// import prisma from '../db/prisma';
import axios from 'axios';
import { GameService } from './game.service';
import { SenderType } from '@prisma/client';
import prisma from '../db/prisma';

@Provide()
export class MessageService {
  @Inject()
  GameService: GameService;
  async sendMessage({ content }: { content: string }) {
    const apiKey = 'sk-6074fe63383c42cabc916f3b468df674';
    const appId = '8e3e8378773145d2a22323a1d6be32ab'; // 替换为实际的应用 ID

    const url = `https://dashscope.aliyuncs.com/api/v1/apps/${appId}/completion`;
    const { message, currentSessionId } =
      await this.GameService.getAiModelCurrentSessionId();
    if (message !== 'Success') {
      return {
        success: false,
        message: 'Error',
      };
    }
    const data = {
      input: {
        prompt: content,
        // 如果session_id为空，则不传
        ...(currentSessionId && { session_id: currentSessionId }),
      },
      parameters: {},
      debug: {},
    };

    try {
      const response = await axios.post(url, data, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 200) {
        const { text, session_id } = response.data.output;
        await this.insertMessage({ content: text, from: 'AI' });
        await this.GameService.unlockAiModel(session_id);
        return {
          success: true,
        };
      } else {
        return {
          success: false,
          message: response.data.message,
        };
      }
    } catch (error) {
      return {
        success: false,
        message: 'Error',
      };
    }
  }

  async insertMessage({
    content,
    from,
    address,
  }: {
    content: string;
    from: SenderType;
    address?: string;
  }) {
    // 插入消息记录
    await prisma.message.create({
      data: {
        content,
        senderType: from,
        createdAt: new Date(),
        ...(address && { address }),
      },
    });
  }

  async getMessages() {
    const messages = await prisma.message.findMany({
      orderBy: {
        id: 'asc',
      },
    });
    return {
      success: true,
      messages,
    };
  }
}
