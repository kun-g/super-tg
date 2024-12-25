import { Configuration, App } from '@midwayjs/core';
import * as koa from '@midwayjs/koa';
import * as validate from '@midwayjs/validate';
import * as info from '@midwayjs/info';
import { join } from 'path';
// import { DefaultErrorFilter } from './filter/default.filter';
// import { NotFoundFilter } from './filter/notfound.filter';
import { ReportMiddleware } from './middleware/report.middleware';
import prisma from './db/prisma';
import * as crossDomain from '@midwayjs/cross-domain';
import * as jwt from '@midwayjs/jwt';
import { JwtMiddleware } from './middleware/jwt.middleware';
import * as cron from '@midwayjs/cron';
import * as ws from '@midwayjs/ws';

@Configuration({
  imports: [
    koa,
    ws,
    validate,
    crossDomain,
    jwt,
    cron,
    {
      component: info,
      enabledEnvironment: ['local'],
    },
  ],
  importConfigs: [join(__dirname, './config')],
})
export class MainConfiguration {
  @App('koa')
  app: koa.Application;

  async onReady() {
    // add middleware
    this.app.useMiddleware([ReportMiddleware, JwtMiddleware]);
    await prisma.$connect();
    // 获取当前模型状态
    const state = await prisma.dragonState.findMany();
    // create default state
    if (!state.length) {
      await prisma.dragonState.create({
        data: {},
      });
    }
    // add filter
    // this.app.useFilter([NotFoundFilter, DefaultErrorFilter]);
  }
}
