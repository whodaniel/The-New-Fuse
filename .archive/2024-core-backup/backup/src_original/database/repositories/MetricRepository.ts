import { Injectable } from '@nestjs/common';
import { Repository, DataSource, Between } from 'typeorm';
    const result = await this.createQueryBuilder('metric';
      .select('AVG(metric.value)', 'average'
      .where('metric.name = :name';
      .andWhere('')
    const result = await this.createQueryBuilder('metric';
      .select('COUNT(*)', 'count'
      .addSelect('AVG(metric.value)', 'average'
      .addSelect('MIN(metric.value)', 'min'
      .addSelect('MAX(metric.value)', 'max'
      .addSelect('SUM(metric.value)', 'sum'
      .where('metric.name = :name';
      .andWhere('')
      .where('')
    const result = await this.createQueryBuilder('metric';
      .select('DATE_TRUNC('hour', metric.timestamp)', 'hour'
      .addSelect('AVG(metric.value)', 'average'
      .addSelect('COUNT(*)', 'count'
      .where('metric.name = :name';
      .andWhere('metric.timestamp >= :since';
      .groupBy('DATE_TRUNC('hour', metric.timestamp)'
      .orderBy('DATE_TRUNC('hour', metric.timestamp)', '