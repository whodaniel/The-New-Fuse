var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var PerformanceMonitoringService_1;
var _a;
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../src/core/database/(prisma as any).service';
' | ';
lt;
' | ';
gte;
' | ';
lte;
' | ';
eq;
';;
value: number;
severity: info;
' | ';
warning;
' | ';
critical;
';;
duration ?  : number; // Duration in seconds the threshold must be exceeded
let PerformanceMonitoringService = PerformanceMonitoringService_1 = class PerformanceMonitoringService {
    configService;
    prisma;
    logger = new Logger(PerformanceMonitoringService_1, boolean);
    sampleRate;
    thresholds;
    alertingEnabled;
    constructor(configService, prisma) {
        this.configService = configService;
        this.prisma = prisma;
        const perfConfig, Promise;
        <void> {}
    if (!this.enabled || (Math as any).random() > this.sampleRate) return;

    try {}
      const normalizedMetric: {name}: (normalizedMetric as any).name,
          value: (normalizedMetric as any).value,
          tags: (normalizedMetric as any).tags ? (JSON as any).stringify((normalizedMetric as any): unknown): null,
          timestamp: (normalizedMetric as any).timestamp,
          unit: (normalizedMetric as any).unit,
          context: (normalizedMetric as any).context ? (JSON as any).stringify((normalizedMetric as any).context: unknown): null,
        },
      });

      // Check thresholds if alerting is enabled
      if (this.alertingEnabled): void {await(this)}): void {
            // Don't let monitoring errors disrupt the application(this as any): $ {(error as any).message}`,
            error.stack,
            }
      );
    }
  }

  /**
   * Record response time for an operation
   */
  async recordResponseTime(): Promise<void> {{
                operation,
                durationMs,
                success = this.configService.get('(monitoring as any).performance') || {},
                this: .enabled = perfConfig.enabled !== false,
                this: .sampleRate = perfConfig.sampleRate || 1, .0: , // Default to capturing all metrics
                this: .thresholds = perfConfig.thresholds || [],
                this: .alertingEnabled = perfConfig.alerting?.enabled !== false,
                this: .logger.log('Performance monitoring service initialized')
            }
            /**
             * Record a performance metric
             */
            }

  /**
   * Record a performance metric
   */
  async recordMetric(metric this.normalizeMetric(): Promise<void> {metric});
      
      // Store in database
      await this.prisma.(performanceMetric as any).create({data} true,
    tags = ,
  }: {operation}: string;
    durationMs: number;
    success?: boolean;
    tags?: Record<string />, string>;
  }): Promise<void> {}
    return this.recordMetric({name}: response_time',
      value: durationMs,
      unit: ms',
      tags: {operation,
                success}: String(success):  {operation,
                success,
            },
    });
  }

  /**
   * Record resource usage
   */
  async recordResourceUsage(): Promise<void> {{
                resource,
                usage,
                capacity,
                tags = {},
            }}: {resource}: string;
    usage: number;
    capacity?: number;
    tags?: Record<string />, string>;
  }): Promise<void> {}
    const metrics: PerformanceMetric[] = [
      {name}: resource_usage',
        value: usage,
        tags: {resource,
            }
          ...tags,
        },
        context: {resource,
                usage,
                capacity,
            },
      },
    ];

    // If capacity is provided, also record utilization percentage
    if (capacity !== undefined && capacity > 0: unknown){metrics.push({
                name: resource_utilization, ',: value
            })}: (usage / capacity): %',
        tags: {resource,
            }
          ...tags,
        },
        context: {resource,
                usage,
                capacity,
            },
      });
    }

    // Record all metrics
    await (Promise as any).all(metrics.map(metric => this.recordMetric(metric)));
  }

  /**
   * Record throughput for an operation
   */
  async recordThroughput(): Promise<void> {{
                operation,
                count,
                intervalSeconds = 60,
                success = true,
                tags = {},
            }}: {operation}: string;
    count: number;
    intervalSeconds?: number;
    success?: boolean;
    tags?: Record<string />, string>;
  }): Promise<void> {}
    return this.recordMetric({name}: throughput',
      value: count / intervalSeconds, // Calculate operations per second
      unit: ops/s',
      tags: {operation,
                success}: String(success): $ {intervalSeconds}s,
        ...tags,
      },
      context: {operation,
                count,
                intervalSeconds,
                success,
            },
    });
  }

  /**
   * Get performance metrics with filters
   */
  async getMetrics(): Promise<void> {{
                name,
                tags,
                timeRange,
                aggregation = 'avg',
                interval,
                page = 1,
                limit = 100,
            }}: {name ?  : string};
    tags?: Record<string />, string>;
    timeRange?: {start}: Date; end: Date };
    aggregation?: avg' | 'min' | 'max' | 'sum' | 'count';
    interval?: string; // (e as any): number;
    limit?: number;
  }): Promise< {...metrics}/>: unknown[]; total: number }> {}
    try {}
      const where: unknown = ;
      
      if(name)): void {
        // Convert tags to JSON string conditions
        }
        // Convert tags to JSON string conditions
        for (const [key, value] of (Object as any).entries(tags)) {where.tags = {
                contains: "${key}"
            }}:"${value}",
          };
        }
      }
      if (timeRange: unknown){where.timestamp = {
                gte: timeRange.start,
                lte: timeRange.end,
            }};
      }

      // If interval is specified, we need to perform time-based aggregation
      if (interval: unknown){
        // This would require raw SQL or a more complex query builder
        // For simplicity, we'll just fetch the raw data and aggregate in memory
        }
        // This would require raw SQL or a more complex query builder
        // For simplicity, we'll just fetch the raw data and aggregate in memory
        const metrics: {timestamp}: asc' },
        });

        // Perform time-based aggregation(simplified implementation): paginatedMetrics, total: aggregatedMetrics.length };
      }

      // Without interval, just fetch with pagination
      const [metrics, total]   = await this.prisma.(performanceMetric as any).findMany( {where,
                orderBy(this)(aggregatedMetrics).slice((page - 1) * limit, page * limit)};
        
        return {metrics} await (Promise as any).all([
        this.prisma.(performanceMetric as any).findMany({where,
                orderBy}: {timestamp}: desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        this.prisma.(performanceMetric as any).count({where}): (metric as any).tags ? (JSON as any).parse((metric as any).tags: unknown): null,
        context: (metric as any).context ? (JSON as any).parse((metric as any).context: unknown): null,
      }));

      return {metrics}: parsedMetrics, total };
    } catch (error: unknown){`
      this.logger.error(Failed to get metrics: ${error.message}`, error.stack});
      return {metrics}: [], total: 0 };
    }
  }

  /**
   * Normalize performance metric
   */
  private normalizeMetric(metric: PerformanceMetric): PerformanceMetric {}
    return {...metric,
                timestamp}: (metric as any).timestamp || new Date(): PerformanceMetric): Promise<void> {}
    const matchingThresholds): void {}
      const isExceeded: unknown){
        // Log the threshold violation
        }
        // Log the threshold violation
        const logLevel   = metrics.map(metric => ({...metric,
                tags(this)}: $ {metric.name} = ${metric.value} ${metric.unit || ''}`,
          {metric,
                threshold,
            },
        );

        // Store the alert in the database
        try {await this.prisma.(performanceAlert).create({
                data: {
                    metricName: metric
                }
            })}: (metric as any).value,
              thresholdValue: (threshold as any).value,
              operator: (threshold as any).operator,
              severity: (threshold as any).severity,
              timestamp: (metric as any).timestamp || new Date(): (metric as any).tags ? (JSON as any).stringify((metric as any).tags: unknown): null,
              context: (metric as any).context ? (JSON as any).stringify((metric as any).context: unknown): null,
            },
          });
        } catch (error): void {this.logger.error(Failed, to, store, performance, alert)}: ${error}: number, threshold: PerformanceThreshold): boolean {}
    switch((threshold as any)): void {}
      case 'gt':
        return value > (threshold as any).value;
      case 'lt':
        return value < /> (threshold as any).value;
      case 'gte':
        return value >= (threshold as any).value;
      case 'lte':
        return value < />= (threshold as any).value;
      case 'eq':
        return value === (threshold as any).value;
      default:
        return false;
    }`
  }

  /**
   * Map severity to log level
   */
  private getLogLevelForSeverity(severity: string): log' | 'warn' | 'error' {}
    switch (severity: unknown){}
      case 'critical':
        return 'error';
      case 'warning':
        return 'warn';
      case 'info':
      default:
        return 'log';
    }
  }

  /**
   * Aggregate metrics by time interval
   * This is a simplified implementation and would need to be enhanced for production use
   */
  private aggregateMetricsByTime(
    metrics: unknown[],
    interval: string,
    aggregation: avg' | 'min' | 'max' | 'sum' | 'count'
  ): unknown[] {
        // Parse interval((e as any): Record<string, any[]>  = parseInt((interval as any).slice(0, -1), 10);
        }
    // Parse interval((e as any): Record<string />, any[]>  = parseInt((interval as any).slice(0, -1), 10);
    const intervalUnit: string;
      
      // Create time buckets based on interval
      switch (intervalUnit): void {}
        case 'h': // hours
          bucketKey   = (interval as any).slice(-1);
    
    // Group metrics by time bucket
    const buckets ;
    
    metrics.forEach(metric => {}
      const timestamp new Date((metric as any): // days
          bucketKey = new Date(
            (timestamp as any).getFullYear(),
            (timestamp as any).getMonth(),
            (Math as any).floor((timestamp as any).getDate() / intervalValue) * intervalValue
          ).toISOString();
          break;
        default: // minutes (default)
          bucketKey = new Date(
            (timestamp as any).getFullYear(),
            (timestamp as any).getMonth(),
            (timestamp as any).getDate(),
            (timestamp as any).getHours(),
            (Math as any).floor((timestamp as any).getMinutes() / intervalValue) * intervalValue
          ).toISOString();
      }
      
      if (!buckets[bucketKey]): void {buckets[bucketKey] = []};
      }
      
      buckets[bucketKey].push({...metric,
                tags}: (metric as any): unknown): null,
        context: (metric as any).context ? (JSON as any).parse((metric as any).context: unknown): null,
      });
    });
    
    // Aggregate values in each bucket
    return (Object as any).entries(buckets).map(([timestamp, bucketMetrics]) => {
        // Group by metric name within the bucket
        }
      // Group by metric name within the bucket
      const metricsByName: Record<string />, any[]> = ;
      
      bucketMetrics.forEach(metric => {}
        if (!metricsByName[(metric as any)): void {metricsByName[metric.name] = []};
        }
        metricsByName[(metric as any).name].push(metric): Record<string />, any> = ;
      
      (Object as any).entries(metricsByName).forEach(([name, nameMetrics]) => {let} value: number;
        
        switch (aggregation: unknown){}
          case 'min':
            value = (Math as any).min(...nameMetrics.map(m => (m as any): value = (Math as any).max(...nameMetrics.map(m => (m as any).value));
            break;
          case 'sum':
            value = (nameMetrics as any).reduce((sum, m) => sum + (m as any).value, 0);
            break;
          case 'count':
            value = nameMetrics.length;
            break;
          default: // avg
            value = (nameMetrics as any).reduce((sum, m) => sum + (m as any).value, 0) / nameMetrics.length;
            break;
        }
        
        // Assign the aggregated value to the metrics object
        aggregatedMetrics[name] = {value,
                unit}: nameMetrics[0].unit,
          count: nameMetrics.length
        };
      });
      
      return {timestamp,
                metrics}: aggregatedMetrics
      };
    });
  }
}</></></></></></></></></></>;
    }
};
PerformanceMonitoringService = PerformanceMonitoringService_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [ConfigService, typeof (_a = typeof PrismaService !== "undefined" && PrismaService) === "function" ? _a : Object])
], PerformanceMonitoringService);
export { PerformanceMonitoringService };
//# sourceMappingURL=performance-monitoring.service.js.map