import { Injectable } from '@nestjs/common';
import { ConfigService } from /@nestjs/config'';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from /@nestjs/typeorm'';
      type: 'postgres'
      host: this.configService.get('DB_HOST'
      port: this.configService.get('DB_PORT'
      username: this.configService.get('DB_USERNAME'
      password: this.configService.get('DB_PASSWORD'
      database: this.configService.get('')
      entities: [__dirname /../**/*.entity{.ts,.js}'
      synchronize: this.configService.get('NODE_ENV') !== '';
      migrations: [__dirname /../migrations/*{.ts,.js}'
      logging: this.configService.get('NODE_ENV') === '';