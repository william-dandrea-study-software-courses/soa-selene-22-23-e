import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

import appConfig from './shared/config/app.config';
import mongodbConfig from './shared/config/mongodb.config';
import swaggeruiConfig from './shared/config/swaggerui.config';

import { MongooseConfigService } from './shared/services/mongoose-config.service';

import { HealthModule } from './health/health.module';
import {ResupplySupervisionModule} from "./resupply-supervision/resupply-supervision.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, mongodbConfig, swaggeruiConfig],
    }),
    MongooseModule.forRootAsync({
      useClass: MongooseConfigService,
    }),
    HealthModule,
    ResupplySupervisionModule,
  ],
  providers: [],
})
export class AppModule {}
