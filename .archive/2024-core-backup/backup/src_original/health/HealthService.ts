import { /* TODO: specify imports */ } from /@nestjs/common'';
import { SmartAPIGateway } from /../api-management/SmartAPIGateway';';
      return {status: 'healthy, latency: Date.now() -start};'
      return{status: 'unhealthy, error: error.message };'
        latency: 'Date.now() -start'
    } catch (error) { return {status: ''
      // Implement API health check'
      status: 'healthy,'
        latency: ''
 privategetOverallStatus(services:ServiceHealth[])healthy|degraded' |unhealthy{ const unhealthyCount = 'services.filter('s => s.status' === 'unhealthy).length;'';
    if(unhealthyCount' === '0) {'';