import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
@Injectable()
export class MemoryClustering {
  constructor(private readonly configService: ConfigService) {}

  async clusterItems(): any {
    console.log('Clustering items:', items.length);
    return items;
  }

  async analyzeContent(item: any): any {
    if(item: any): any {
      return item.content.split(' ').slice(0, 5);
    }
    return [];
  }
}