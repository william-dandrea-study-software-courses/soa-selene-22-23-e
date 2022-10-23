import {Controller, Logger} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Kafka } from "kafkajs"
import {NewsFormalisationService} from "../services/news-formalisation.service";

@ApiTags("spacesuit-monitoring")
@Controller("/")
export class NewsFormalisationController {
  private readonly logger = new Logger(NewsFormalisationController.name);

  private kafka = new Kafka({
    clientId: 'spacecraft',
    brokers: ['kafka-service:9092']
  })

  constructor(private spacesuitMonitoringService:NewsFormalisationService) {
    this.event_spacesuit_problem_listener()
  }

  async event_spacesuit_problem_listener(){
    const consumer = this.kafka.consumer({ groupId: 'news-formalisation-consumer' });
    // Consuming
    await consumer.connect()
    await consumer.subscribe({ topic: 'problem-spacesuit'})

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        this.logger.log("Spacesuit problem detected value: " + message.value.toLocaleString())
        this.logger.log("Spacesuit id : " + JSON.parse(message.value.toLocaleString())["spacesuit_id"])
        await this.spacesuitMonitoringService.sendNewsToMary(JSON.parse(message.value.toLocaleString()));
      },
    });
  }
}
