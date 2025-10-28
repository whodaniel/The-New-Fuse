import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '@the-new-fuse/database';
import { CodeExecutionRequest, CodeExecutionResult, ExecutionEnvironment } from './types';
import { CodeScanner, SecurityIssueSeverity } from './security/code-scanner';
import { RateLimiter } from './security/rate-limiter';
import axios from 'axios';

@Injectable()
export class CodeExecutionService {
  private readonly logger = new Logger(CodeExecutionService.name);
  private readonly cloudflareWorkerUrl: string;
  private readonly apiKey: string;
  private readonly rateLimiter = new RateLimiter(10, 60000); // 10 requests per minute

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly codeScanner: CodeScanner,
  ) {
    this.cloudflareWorkerUrl = this.configService.get<string>('CLOUDFLARE_WORKER_URL');
    this.apiKey = this.configService.get<string>('CODE_EXECUTION_API_KEY');
  }

  async executeCode(request: CodeExecutionRequest): Promise<CodeExecutionResult> {
    const clientId = 'some-client-id'; // Replace with actual client ID mechanism
    if (this.rateLimiter.isRateLimited(clientId)) {
      throw new HttpException('Rate limit exceeded', HttpStatus.TOO_MANY_REQUESTS);
    }

    const scanResult = this.codeScanner.scan(request.code);
    if (scanResult.some(issue => issue.severity === SecurityIssueSeverity.High)) {
      throw new HttpException('High severity security issue detected', HttpStatus.BAD_REQUEST);
    }

    const executionId = uuidv4();
    let result: CodeExecutionResult;

    try {
      if (request.environment === ExecutionEnvironment.CLOUDFLARE_WORKER && this.cloudflareWorkerUrl) {
        result = await this.executeRemotely(executionId, request);
      } else {
        result = await this.executeLocally(executionId, request);
      }
      await this.recordExecution(executionId, request, result);
      return result;
    } catch (error) {
      this.logger.error(`Code execution failed for ${executionId}`, error.stack);
      const errorResult: CodeExecutionResult = {
        executionId,
        success: false,
        output: '',
        error: error.message,
        executionTime: 0,
      };
      await this.recordExecution(executionId, request, errorResult);
      throw new HttpException('Code execution failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  private async executeRemotely(executionId: string, request: CodeExecutionRequest): Promise<CodeExecutionResult> {
    const response = await axios.post(this.cloudflareWorkerUrl, request, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
    });
    return { executionId, ...response.data };
  }

  private async executeLocally(executionId: string, request: CodeExecutionRequest): Promise<CodeExecutionResult> {
    // This is a placeholder for a local sandbox environment (e.g., Docker, vm2)
    this.logger.warn('Local execution is not implemented. Simulating success.');
    return {
      executionId,
      success: true,
      output: 'Local execution placeholder',
      error: null,
      executionTime: 100,
    };
  }

  private async recordExecution(executionId: string, request: CodeExecutionRequest, result: CodeExecutionResult) {
    return this.prisma.codeExecution.create({
      data: {
        id: executionId,
        code: request.code,
        environment: request.environment,
        status: result.success ? 'completed' : 'failed',
        result: JSON.stringify(result),
      },
    });
  }

  async getExecutionHistory() {
    return this.prisma.codeExecution.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }
}
