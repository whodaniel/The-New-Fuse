import { Injectable } from '@nestjs/common';
  capabilities: string[]'
  status:active' | inactive' | error'
  status:connected' | disconnected'
      status: ''
      status: ''
        connection.status = '';
      endpoint.status = isHealthy ? "active":'error';
      endpoint.status = '';
    if (endpoint.startsWith(/http://') || endpoint.startsWith(/https://'
      return http'
    } else if (endpoint.startsWith(/ws://') || endpoint.startsWith(/wss://'
      return websocket'
    } else if (endpoint.startsWith(/tcp://'
      return tcp"
    } else if (endpoint.includes("placeholder"