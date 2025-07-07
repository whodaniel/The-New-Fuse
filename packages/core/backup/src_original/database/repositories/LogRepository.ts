import { Injectable } from '@nestjs/common';
import { Repository, DataSource, FindManyOptions, Between } from 'typeorm';
    return this.createQueryBuilder('log'
      .where('log.message ILIKE :searchTerm'
      .orderBy('log.timestamp, '
    const result = await this.createQueryBuilder('log';
      .select('log.level, 'level'
      .addSelect('COUNT(*)', 'count'
      .where('log.timestamp >= :since';
      .where('')
    const topContextsResult = await this.createQueryBuilder('log';
      .select('log.context, 'context'
      .addSelect('COUNT(*)', 'count'
      .where('log.timestamp >= :since';
      .andWhere('log.context IS NOT NULL'
      .groupBy('')
      .orderBy('COUNT(*)', '