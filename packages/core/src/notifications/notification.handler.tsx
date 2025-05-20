import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class NotificationHandler implements OnModuleInit {
  constructor(private prisma: PrismaService) {}

  async onModuleInit(): Promise<void> {): Promise<any> {
    this.startNotificationStream(): Promise<any> {
    try {
      const stream = await this.prisma.notification.stream({ 
        name: notification-stream'
      })): void {
        // Handle the notification event
        ): void {
      console.error('Error in notification stream:', error);
      // Implement retry logic if needed
    }
  }
}
