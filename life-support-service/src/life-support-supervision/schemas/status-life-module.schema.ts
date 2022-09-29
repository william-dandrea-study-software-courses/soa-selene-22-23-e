import { SchemaFactory, Schema, Prop } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type StatusLifeModuleDocument = StatusLifeModule & Document;

@Schema({
  versionKey: false,
})
export class StatusLifeModule {
  @ApiProperty()
  _id: string;

  @ApiProperty()
  @Prop({ required: true, min: 0 })
  id_life_module: number;

  @ApiProperty()
  @Prop({ required: true })
  lifeStatus: boolean;
}

export const StatusLifeModuleSchema =
  SchemaFactory.createForClass(StatusLifeModule);
