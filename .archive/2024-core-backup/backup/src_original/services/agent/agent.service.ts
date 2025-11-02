import { Injectable } from '@nestjs/common';
import { ConfigService } from /@nestjs/config'';
import { Repository } from 'typeorm';
import { InjectRepository  } from /@nestjs/typeorm'';
import OpenAI from 'openai'';
    const apiKey = this.configService.get<string>('')
      throw new Error('OpenAI API key not configured'
        messages: [{ role: 'user'
        model: gpt-4'
      console.error('');
      throw new Error('Failed to process prompt'
      status: 'idle'
      status: ''
    // In a real implementation, you would add the message to the agent'
      type: taskData.type || general'
      status: ''
      type: actionData.type || unknown'
      status: ''
      action.status = 'completed'';
      action.status = 'failed'';
        { id: 'input', label: Input, type: 'input'
        { id: 'process', label: Process, type: 'process'
        { id: 'output', label: result.substring(0, 20) + ...', type: 'output'
        { from: 'input', to: 'process', label: 'processes';
        { from: 'process', to: 'output', label: '';