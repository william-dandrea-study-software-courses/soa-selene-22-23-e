import {HttpException, HttpStatus, Injectable, Logger} from '@nestjs/common';
import { Model} from "mongoose";
import {InjectModel, Prop} from "@nestjs/mongoose";
import { Kafka } from "kafkajs"
import {Spacesuit, SpacesuitDocument} from '../schemas/spacesuit.schema';

import { SpacesuitDTO} from "../dto/spacesuit.dto";
import {SpacesuitAlreadyExistException} from "../exceptions/spacesuit-already-exist.exception";

@Injectable()
export class SpacesuitService {
  private readonly logger = new Logger(SpacesuitService.name);


  private kafka = new Kafka({
    clientId: 'spacecraft',
    brokers: ['kafka-service:9092']
  })

  constructor(@InjectModel(Spacesuit.name) private spacesuitModel: Model<SpacesuitDocument>) {}

  async getSpacesuits(): Promise<SpacesuitDTO[]> {
    return this.spacesuitModel.find().then(spacesuits => {
      let response : SpacesuitDTO[]=[];
      spacesuits.forEach(spacesuit => {
        let dto = new SpacesuitDTO();
        dto.id_spacesuit = spacesuit.id_spacesuit;
        dto.current_vital = spacesuit.current_vital;
        response.push(dto);
      })
      return response;
    });
  }

  async postSpacesuit(spacesuitDTO: SpacesuitDTO): Promise<SpacesuitDTO> {
    const alreadyExists = await this.spacesuitModel.find({ id_spacesuit: spacesuitDTO.id_spacesuit });
    if (alreadyExists.length > 0) {
      throw new SpacesuitAlreadyExistException(spacesuitDTO.id_spacesuit);
    }
    return await this.spacesuitModel.create(spacesuitDTO);
  }

  async putSpacesuit(spacesuitDTO: SpacesuitDTO, id_spacesuit: number): Promise<Spacesuit>{
    let spacesuit = await this.spacesuitModel.findOne({ id_spacesuit: id_spacesuit });
    this.logger.log(spacesuit)
    spacesuit.id_astronaut = spacesuitDTO.id_astronaut;
    spacesuit.current_vital = spacesuitDTO.current_vital;
    // if(spacesuit.current_vital.o2_rate < 80 || spacesuit.current_vital.temperature<10||spacesuit.current_vital.power < 10){
    //   const producer = await this.kafka.producer()
    //
    //   // Producing
    //   await producer.connect()
    //   this.logger.log('Sending event to inform that the combinaison has bad vitals')
    //   await producer.send({
    //     topic: 'problem-spacesuit',
    //     messages: [
    //       { key: 'spacesuit-problem',value:'{"o2_rate" :'+spacesuitDTO.current_vital.o2_rate+',"temperature" :'+ spacesuitDTO.current_vital.temperature+',"power" :'+ spacesuitDTO.current_vital.power+',"spacesuit_id":'+ id_spacesuit+'}'},
    //     ],
    //   });
    //   await producer.disconnect();
    // }
    spacesuit.save();
    return spacesuit;
  }

  async getSpacesuit(spacesuitId: number): Promise<SpacesuitDTO> {
    const spacesuit = await this.spacesuitModel.findOne({ id_spacecraft: spacesuitId });
    if(spacesuit === null) {
      throw new HttpException("spaceCraft not found",HttpStatus.NOT_FOUND,);
    }
    let dto = new SpacesuitDTO();
    dto.id_spacesuit = spacesuit.id_spacesuit;
    dto.current_vital = spacesuit.current_vital;
    return dto;
  }

  async sendSpacesuitVitals(): Promise<void>{
    const producer = await this.kafka.producer()

    let spacesuits = await this.spacesuitModel.find();
    let message: { value: string }[] = [];
    spacesuits.forEach(spacesuit => {
      if(spacesuit.id_astronaut !== -1) {
        message.push({value: '{"cardiac_rythm" :' + spacesuit.current_vital.cardiac_rythm + ',"pressure" :' + spacesuit.current_vital.pressure + ',"o2_rate" :' + spacesuit.current_vital.o2_rate + ',"temperature" :' + spacesuit.current_vital.temperature + ',"power" :' + spacesuit.current_vital.power + ',"astronaut_id" :' + spacesuit.id_astronaut + ',"spacesuit_id":' + spacesuit.id_spacesuit + '}'})
      }
      })
    // Producing
    await producer.connect()
    this.logger.log('Sending combinaison vitals')


    await producer.send({
      topic: 'spacesuit-vitals',
      messages: message,
    });
    await producer.disconnect();
  }
}