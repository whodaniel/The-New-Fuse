import { Injectable } from '@nestjs/common';
import * as Joi from 'joi';

@Injectable()
export class ConfigValidator {
  private readonly schema: Joi.ObjectSchema;

  constructor() {
    this.schema = Joi.object({
      NODE_ENV: Joi.string()
        .valid('development', 'production', 'test')
        .default('development'),
      PORT: Joi.number().default(3000),
      DATABASE_URL: Joi.string().required(),
    });
  }

  validate(config: any): { error?: Joi.ValidationError; value: any } {
    return this.schema.validate(config, { abortEarly: false });
  }
}
