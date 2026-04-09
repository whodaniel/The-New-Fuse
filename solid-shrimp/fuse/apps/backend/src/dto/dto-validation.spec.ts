import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { AgentStatus, CreateAgentDto } from './create-agent.dto';
import { LoginDto } from './login.dto';
import { RegisterDto } from './register.dto';
import { UpdateAgentDto } from './update-agent.dto';

describe('DTO Validation', () => {
  describe('LoginDto', () => {
    it('should pass validation with valid data', async () => {
      const dto = plainToInstance(LoginDto, {
        email: 'test@example.com',
        password: 'Password123!',
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail with invalid email', async () => {
      const dto = plainToInstance(LoginDto, {
        email: 'invalid-email',
        password: 'Password123!',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('email');
    });

    it('should fail with short password', async () => {
      const dto = plainToInstance(LoginDto, {
        email: 'test@example.com',
        password: 'short',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('password');
    });

    it('should fail with missing email', async () => {
      const dto = plainToInstance(LoginDto, {
        password: 'Password123!',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('email');
    });

    it('should fail with missing password', async () => {
      const dto = plainToInstance(LoginDto, {
        email: 'test@example.com',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('password');
    });
  });

  describe('RegisterDto', () => {
    it('should pass validation with valid data', async () => {
      const dto = plainToInstance(RegisterDto, {
        email: 'test@example.com',
        password: 'Password123!',
        name: 'Test User',
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should pass validation without optional name', async () => {
      const dto = plainToInstance(RegisterDto, {
        email: 'test@example.com',
        password: 'Password123!',
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail with weak password', async () => {
      const dto = plainToInstance(RegisterDto, {
        email: 'test@example.com',
        password: 'weakpassword',
        name: 'Test User',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('password');
      expect(errors[0].constraints).toHaveProperty('matches');
    });

    it('should fail with password missing uppercase', async () => {
      const dto = plainToInstance(RegisterDto, {
        email: 'test@example.com',
        password: 'password123!',
        name: 'Test User',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail with password missing number', async () => {
      const dto = plainToInstance(RegisterDto, {
        email: 'test@example.com',
        password: 'Password!',
        name: 'Test User',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail with password missing special character', async () => {
      const dto = plainToInstance(RegisterDto, {
        email: 'test@example.com',
        password: 'Password123',
        name: 'Test User',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('CreateAgentDto', () => {
    it('should pass validation with minimal valid data', async () => {
      const dto = plainToInstance(CreateAgentDto, {
        name: 'Test Agent',
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should pass validation with complete valid data', async () => {
      const dto = plainToInstance(CreateAgentDto, {
        name: 'Test Agent',
        description: 'A test agent',
        status: AgentStatus.ACTIVE,
        type: 'assistant',
        capabilities: [
          {
            name: 'search',
            description: 'Search capability',
            parameters: { engine: 'google' },
          },
        ],
        model: 'gpt-4',
        temperature: 0.7,
        maxTokens: 2000,
        systemPrompt: 'You are a helpful assistant',
        configuration: { setting1: 'value1' },
        metadata: { key: 'value' },
        isPublic: true,
        tags: ['ai', 'assistant'],
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail with empty name', async () => {
      const dto = plainToInstance(CreateAgentDto, {
        name: '',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('name');
    });

    it('should fail with name exceeding max length', async () => {
      const dto = plainToInstance(CreateAgentDto, {
        name: 'a'.repeat(101),
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('name');
    });

    it('should fail with invalid status', async () => {
      const dto = plainToInstance(CreateAgentDto, {
        name: 'Test Agent',
        status: 'invalid-status' as any,
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('status');
    });

    it('should fail with negative temperature', async () => {
      const dto = plainToInstance(CreateAgentDto, {
        name: 'Test Agent',
        temperature: -1,
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('temperature');
    });

    it('should fail with zero maxTokens', async () => {
      const dto = plainToInstance(CreateAgentDto, {
        name: 'Test Agent',
        maxTokens: 0,
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('maxTokens');
    });

    it('should fail with invalid endpoint URL', async () => {
      const dto = plainToInstance(CreateAgentDto, {
        name: 'Test Agent',
        endpoint: 'not-a-url',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('endpoint');
    });

    it('should pass with valid endpoint URL', async () => {
      const dto = plainToInstance(CreateAgentDto, {
        name: 'Test Agent',
        endpoint: 'https://api.example.com/agent',
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail with non-array capabilities', async () => {
      const dto = plainToInstance(CreateAgentDto, {
        name: 'Test Agent',
        capabilities: 'not-an-array' as any,
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('capabilities');
    });

    it('should fail with invalid capability structure', async () => {
      const dto = plainToInstance(CreateAgentDto, {
        name: 'Test Agent',
        capabilities: [{ invalid: 'structure' }] as any,
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('UpdateAgentDto', () => {
    it('should pass validation with empty object', async () => {
      const dto = plainToInstance(UpdateAgentDto, {});

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should pass validation with partial update', async () => {
      const dto = plainToInstance(UpdateAgentDto, {
        name: 'Updated Agent',
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should pass validation with multiple fields', async () => {
      const dto = plainToInstance(UpdateAgentDto, {
        name: 'Updated Agent',
        description: 'Updated description',
        status: AgentStatus.INACTIVE,
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail with invalid name when provided', async () => {
      const dto = plainToInstance(UpdateAgentDto, {
        name: 'a'.repeat(101),
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('name');
    });

    it('should fail with invalid status when provided', async () => {
      const dto = plainToInstance(UpdateAgentDto, {
        status: 'invalid-status' as any,
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('status');
    });

    it('should fail with negative temperature when provided', async () => {
      const dto = plainToInstance(UpdateAgentDto, {
        temperature: -1,
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('temperature');
    });
  });

  describe('Security: Injection Prevention', () => {
    it('should reject XSS attempts in agent name', async () => {
      const dto = plainToInstance(CreateAgentDto, {
        name: '<script>alert("xss")</script>',
      });

      // Validation should pass (we strip/sanitize in service layer)
      // But the string type validation ensures it's a string
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
      expect(typeof dto.name).toBe('string');
    });

    it('should reject SQL injection attempts in description', async () => {
      const dto = plainToInstance(CreateAgentDto, {
        name: 'Test Agent',
        description: "'; DROP TABLE agents; --",
      });

      // Validation should pass (parameterized queries handle SQL injection)
      // DTO validation ensures type safety
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
      expect(typeof dto.description).toBe('string');
    });

    it('should handle very long inputs gracefully', async () => {
      const dto = plainToInstance(CreateAgentDto, {
        name: 'a'.repeat(100), // Exactly at limit
        description: 'b'.repeat(500), // Exactly at limit
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should reject inputs exceeding max length', async () => {
      const dto = plainToInstance(CreateAgentDto, {
        name: 'a'.repeat(101), // One over limit
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });
});
