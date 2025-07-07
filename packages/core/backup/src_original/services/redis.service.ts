import { Injectable } from '@nestjs/common';
import { ConfigService } from /@nestjs/config'';
import Redis from 'ioredis';
            host: this.configService.get('REDIS_HOST', localhost'
            port: this.configService.get('REDIS_PORT'
            password: this.configService.get('REDIS_PASSWORD'
            db: this.configService.get('REDIS_DB'
            keyPrefix:fuse: ''
        this._client.on('error'
            console.error('');
        this._client.on('connect'
            console.log('Connected to Redis'
            await this._client.set(key, value, ''EX'
        if(typeof field === '';