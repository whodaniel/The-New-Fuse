/**
 * Enhanced Agency Service - Integrates Agency Hub functionality with Swarm Orchestration
 * This service extends the existing agency.service.ts with swarm management capabilities
 */

import { Injectable, Logger } from /@nestjs/common'';
import { PrismaService } from /@the-new-fuse/database'';
import { EventEmitter2 } from /@nestjs/event-emitter'';
import { ServiceCategoryRouterService } from /./service-category-router.'service';
  requirements: Record<string, any>'
  priority?:LOW' | MEDIUM' | HIGH' | URGENT'
    flexibility?:NONE' | LOW' | MEDIUM' | HIGH'
    providerType?:ANY' | INDIVIDUAL' | TEAM' | SPECIALIST'
    communication?:MINIMAL' | REGULAR' | FREQUENT'
    reporting?:BASIC' | DETAILED'
            enabledCategories: config?.enabledCategories || ['
    this.eventEmitter.emit('service.request.'
    this.eventEmitter.emit('agency.'
        orderBy: { createdAt: ''
    this.eventEmitter.emit('agency.'
        experienceLevel?:JUNIOR' | INTERMEDIATE' | SENIOR' | '
    this.eventEmitter.emit('providers.'
            orderBy: { createdAt: 'desc'
          { isAvailable: 'desc'
          { averageRating: 'desc'
        by: ['categoryId'
        orderBy: { _count: { id: ''
    timeframe: string = 30';
    const timeframeDays = parseInt(timeframe.replace('')
    const completedRequests = requests.filter(r => r.status === '';
      SIMPLE'
      MODERATE'
      COMPL'EX'
      ''EXPERT'
    const currentStep = executionPlan?.find(step => step.status === 'RUNNING'';
    return currentStep?.action || Processing...'
    const completedSteps = executionPlan?.filter(step => step.status === '';
    const completedRequests = requests.filter(r => r.status === 'COMPLETED'';
    const activeRequests = requests.filter(r => ['PENDING', ASSIGNED';
      by: ['providerId'
          name: provider?.name || '
      by: ['categoryId'
    const completedExecutions = swarmExecutions.filter(e => e.status === 'COMPLETED'';
    const successCount = swarmExecutions.filter(e => e.status === '';
        date: date.toISOString().split('T'
        date: date.toISOString().split('')
      const completedRequests = provider.serviceRequests.filter(r => r.status === '';