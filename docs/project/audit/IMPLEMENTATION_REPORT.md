# Implementation Verification Report

Generated on: 2025-03-12T18:00:55.868Z

## auth - serviceAuth
Status: FOUND (100% confidence)

### Found Implementations:
- packages/core/src/services/auth/service-authentication.ts:2 (interface)
  `export interface AuthStrategy {`
- packages/core/src/services/auth/service-authentication.ts:6 (class)
  `export class ServiceAuthentication {`
- packages/core/src/services/auth/service-authentication.ts:7 (constant)
  `constructor(private readonly authStrategy: AuthStrategy) {}`
- packages/core/src/services/auth/service-authentication.ts:9 (constant)
  `async validateServiceToken(token: string): Promise<boolean> {`
- packages/core/src/services/auth/service-authentication.ts:14 (class)
  `export class CrossServiceAuth {`
- packages/core/src/services/auth/service-authentication.ts:15 (constant)
  `constructor(private readonly authentication: ServiceAuthentication) {}`
- packages/core/src/services/auth/service-authentication.ts:17 (constant)
  `async validateServiceToken(token: string): Promise<boolean> {`
- packages/core/src/services/auth/service-authentication.ts:18 (constant)
  `return this.authentication.validateServiceToken(token);`
- packages/core/src/services/auth/service-authentication.ts:24 (constant)
  `ServiceAuthentication,`
- packages/core/src/services/auth/service-authentication.ts:25 (constant)
  `AuthStrategy,`
- packages/core/src/services/auth/service-authentication.ts:26 (constant)
  `CrossServiceAuth`

---

## dataConsistency - validation
Status: FOUND (100% confidence)

### Found Implementations:
- packages/core/src/workflow/validator.ts:27 (constant)
  `async validateTemplate(template: WorkflowTemplate): Promise<void> {`
- packages/core/src/workflow/validator.ts:52 (constant)
  `await (this as any).validateStep(step, stepIds);`
- packages/core/src/workflow/validator.ts:57 (constant)
  `(this as any).validateStepDependencies((template as any).steps);`
- packages/core/src/workflow/validator.ts:59 (constant)
  `(this as any).(logger as any).debug(`Template ${(template as any).id} validated successfully`, { templateId: (template as any).id });`
- packages/core/src/workflow/validator.ts:77 (constant)
  `private async validateStep(step: WorkflowStep, stepIds: Set<string>): Promise<void> {`
- packages/core/src/workflow/validator.ts:108 (constant)
  `await (this as any).validateStepConfig(step);`
- packages/core/src/workflow/validator.ts:111 (constant)
  `private async validateStepConfig(step: WorkflowStep): Promise<void> {`
- packages/core/src/workflow/validator.ts:193 (constant)
  `if (!(this as any).validateLocales((config as any).locales)) {`
- packages/core/src/workflow/validator.ts:217 (constant)
  `private validateLocales(locales: string[]): boolean {`
- packages/core/src/workflow/validator.ts:222 (constant)
  `private async validateStepDependencies(steps: WorkflowStep[]): Promise<void> {`
- packages/core/src/workflow/security.ts:24 (constant)
  `async validateWorkflowSecurity(`
- packages/core/src/workflow/gateway.ts:8 (constant)
  `const apiSpec = await this.validateAPISpec(service.spec);`
- packages/core/src/workflow/gateway.ts:21 (constant)
  `const validation = await this.validateRequest(request);`
- packages/core/src/workflow/engine.ts:30 (constant)
  `await (this as any).(validator as any).validateTemplate(template);`
- packages/core/src/workflow/engine.ts:235 (constant)
  `private validateStepParameters(step: WorkflowStep): boolean {`
- packages/core/src/workflow/WorkflowTemplates.ts:298 (constant)
  `id: 'validate',`
- packages/core/src/workflow/WorkflowTemplates.ts:322 (constant)
  `dependencies: ['validate'],`
- packages/core/src/workflow/WorkflowTemplates.ts:605 (constant)
  `validateParams: true,`
- packages/core/src/workflow/WorkflowTemplates.ts:606 (constant)
  `validateReturns: true,`
- packages/core/src/workflow/WorkflowTemplates.ts:607 (constant)
  `validateExceptions: true`
- packages/core/src/workflow/WorkflowTemplates.ts:746 (constant)
  `actions: ['format', 'optimize', 'validate']`
- packages/core/src/workflow/WorkflowTemplates.ts:789 (constant)
  `process: ['transform', 'validate', 'enrich']`
- packages/core/src/workflow/WorkflowTemplates.ts:927 (constant)
  `process: ['transform', 'validate', 'enrich']`
- packages/core/src/workflow/WorkflowTemplates.ts:1032 (constant)
  `id: 'validate',`
- packages/core/src/workflow/WorkflowTemplates.ts:1038 (constant)
  `mode: 'validate'`
- packages/core/src/workflow/WorkflowTemplates.ts:1052 (constant)
  `dependencies: ['validate'],`
- packages/core/src/workflow/TemplateValidator.ts:13 (constant)
  `validate(template: WorkflowTemplate): void {`
- packages/core/src/workflow/TemplateValidator.ts:14 (constant)
  `(this as any).validateTemplate(template);`
- packages/core/src/workflow/TemplateValidator.ts:17 (constant)
  `private validateTemplate(template: WorkflowTemplate): void {`
- packages/core/src/workflow/TemplateValidator.ts:18 (constant)
  `(this as any).validateBasicFields(template);`
- packages/core/src/workflow/TemplateValidator.ts:19 (constant)
  `(this as any).validateSteps((template as any).steps);`
- packages/core/src/workflow/TemplateValidator.ts:20 (constant)
  `(this as any).validateDependencies(template);`
- packages/core/src/workflow/TemplateValidator.ts:21 (constant)
  `(this as any).validateCyclicDependencies(template);`
- packages/core/src/workflow/TemplateValidator.ts:24 (constant)
  `private validateBasicFields(template: WorkflowTemplate): void {`
- packages/core/src/workflow/TemplateValidator.ts:36 (constant)
  `private validateSteps(steps: WorkflowStep[]): void {`
- packages/core/src/workflow/TemplateValidator.ts:50 (constant)
  `private validateDependencies(template: WorkflowTemplate): void {`
- packages/core/src/workflow/TemplateValidator.ts:71 (constant)
  `private validateCyclicDependencies(template: WorkflowTemplate): void {`
- packages/core/src/validation/data-validation.ts:2 (interface)
  `export interface ValidationStrategy<T> {`
- packages/core/src/validation/data-validation.ts:3 (constant)
  `validate(data: T): Promise<boolean>;`
- packages/core/src/validation/data-validation.ts:7 (class)
  `export class ValidatorFactory {`
- packages/core/src/validation/data-validation.ts:8 (constant)
  `private static validators = new Map<string, ValidationStrategy<any>>();`
- packages/core/src/validation/data-validation.ts:10 (constant)
  `static register<T>(key: string, validator: ValidationStrategy<T>): void {`
- packages/core/src/validation/data-validation.ts:14 (constant)
  `static getValidator<T>(key: string): ValidationStrategy<T> {`
- packages/core/src/validation/data-validation.ts:23 (class)
  `export class DataValidation<T> {`
- packages/core/src/validation/data-validation.ts:24 (constant)
  `constructor(private readonly strategy: ValidationStrategy<T>) {}`
- packages/core/src/validation/data-validation.ts:26 (constant)
  `async validate(data: T): Promise<boolean> {`
- packages/core/src/validation/data-validation.ts:27 (constant)
  `return this.strategy.validate(data);`
- packages/core/src/validation/data-validation.ts:37 (constant)
  `ValidationStrategy,`
- packages/core/src/validation/data-validation.ts:38 (constant)
  `ValidatorFactory,`
- packages/core/src/validation/data-validation.ts:39 (constant)
  `DataValidation`
- packages/core/src/types/validation.ts:61 (constant)
  `validateAllRules?: boolean;`
- packages/core/src/types/validation.ts:77 (constant)
  `validate(data: any, schema: ValidationSchema, options?: ValidationOptions): Promise<ValidationResult>;`
- packages/core/src/types/prompt.types.ts:42 (constant)
  `validate(params: Record<string, unknown>): {`
- packages/core/src/types/analysis.ts:54 (constant)
  `validateOnly?: boolean;`
- packages/core/src/temp_auth/TokenManager.ts:87 (constant)
  `async validateAccessToken(token: string): Promise<TokenPayload | null> {`
- packages/core/src/temp_auth/TokenManager.ts:105 (constant)
  `(this as any).(logger as any).error('Failed to validate access token:', error as Error);`
- packages/core/src/temp_auth/TokenManager.ts:110 (constant)
  `async validateRefreshToken(token: string): Promise<RefreshTokenPayload | null> {`
- packages/core/src/temp_auth/TokenManager.ts:130 (constant)
  `(this as any).(logger as any).error('Failed to validate refresh token:', error as Error);`
- packages/core/src/temp_auth/AuthenticationService.ts:126 (constant)
  `const payload = await (this as any).(tokenManager as any).validateRefreshToken(refreshToken);`
- packages/core/src/temp_auth/AuthenticationService.ts:160 (constant)
  `async validateSession(sessionId: string): Promise<boolean> {`
- packages/core/src/temp_auth/AuthenticationService.ts:199 (constant)
  `(this as any).validatePassword(newPassword);`
- packages/core/src/temp_auth/AuthenticationService.ts:291 (constant)
  `private validatePassword(password: string): void {`
- packages/core/src/task/scheduler.ts:167 (constant)
  `await (this as any).validateDependencies(task);`
- packages/core/src/task/scheduler.ts:263 (constant)
  `private async validateDependencies(task: Task): Promise<void> {`
- packages/core/src/task/TaskExecutor.ts:209 (constant)
  `case 'validate':`
- packages/core/src/task/TaskExecutor.ts:210 (constant)
  `return this.validateData(data, config);`
- packages/core/src/task/TaskExecutor.ts:239 (constant)
  `private async validateData(data: any, config: Record<string, string>): Promise<any> {`
- packages/core/src/services/prompt.service.ts:140 (constant)
  `public validateTemplate(`
- packages/core/src/services/agent-llm.service.ts:101 (constant)
  `(this as any).validateContextRequirements(systemPrompt, context);`
- packages/core/src/services/agent-llm.service.ts:102 (constant)
  `(this as any).validateContextRequirements(userPrompt, context);`
- packages/core/src/services/agent-llm.service.ts:104 (constant)
  `(this as any).validateContextRequirements(responsePrompt, context);`
- packages/core/src/services/agent-llm.service.ts:151 (constant)
  `private validateContextRequirements(`
- packages/core/src/services/WebSocketManager.ts:26 (constant)
  `const isValid = await sessionManager.validateSession(sessionId);`
- packages/core/src/services/UserService.ts:7 (constant)
  `import { validate } from 'class-validator';`
- packages/core/src/services/UserService.ts:44 (constant)
  `const errors = await validate(user);`
- packages/core/src/services/UserService.ts:62 (constant)
  `const isValid = await (user as any).validatePassword(password);`
- packages/core/src/services/UserService.ts:104 (constant)
  `const isValid = await (user as any).validatePassword(currentPassword);`
- packages/core/src/services/UserService.ts:113 (constant)
  `await (this as any).(sessionRepository as any).invalidateUserSessions(userId);`
- packages/core/src/services/UserService.ts:137 (constant)
  `async invalidateSession(token: string): Promise<boolean> {`
- packages/core/src/services/UserService.ts:138 (constant)
  `return (this as any).(sessionRepository as any).invalidateSession(token);`
- packages/core/src/services/UserService.ts:141 (constant)
  `async invalidateAllSessions(userId: string): Promise<boolean> {`
- packages/core/src/services/UserService.ts:142 (constant)
  `return (this as any).(sessionRepository as any).invalidateUserSessions(userId);`
- packages/core/src/services/TaskService.ts:5 (constant)
  `import { validate } from 'class-validator';`
- packages/core/src/services/TaskService.ts:28 (constant)
  `const errors = await validate(task);`
- packages/core/src/security/security.service.ts:98 (constant)
  `validatePassword(password: string): boolean {`
- packages/core/src/security/security.service.ts:104 (constant)
  `validateEmail(email: string): boolean {`
- packages/core/src/security/index.ts:95 (constant)
  `const isValid = await (this as any).(authService as any).validateCredentials(`
- packages/core/src/security/auth.ts:64 (constant)
  `(this as any).validatePassword(value);`
- packages/core/src/security/auth.ts:86 (constant)
  `async validateCredentials(`
- packages/core/src/security/auth.ts:152 (constant)
  `async validateToken(token: string): Promise<AuthToken | null> {`
- packages/core/src/security/auth.ts:211 (constant)
  `async validateSession(sessionId: string): Promise<AuthSession | null> {`
- packages/core/src/security/auth.ts:252 (constant)
  `private validatePassword(password: string): void {`
- packages/core/src/security/SecurityService.ts:216 (constant)
  `async validateMessage(message: any, context: {`
- packages/core/src/security/AuthenticationService.ts:294 (constant)
  `async validateToken(token: string): Promise<User | null> {`
- packages/core/src/security/AuthenticationService.ts:305 (constant)
  `async validateSession(sessionId: string): Promise<Session | null> {`
- packages/core/src/routes/socialRoutes.ts:4 (constant)
  `import { validateRequest } from '../middleware/validation';`
- packages/core/src/routes/socialRoutes.ts:13 (constant)
  `validateRequest('socialInteraction'),`
- packages/core/src/routes/socialRoutes.ts:26 (constant)
  `validateRequest('socialPreferences'),`
- packages/core/src/routes/memoryRoutes.ts:4 (constant)
  `import { validateRequest } from '../middleware/validation';`
- packages/core/src/routes/memoryRoutes.ts:13 (constant)
  `validateRequest('memory'),`
- packages/core/src/routes/agentRoutes.ts:4 (constant)
  `import { validateRequest } from '../middleware/validation';`
- packages/core/src/routes/agentRoutes.ts:13 (constant)
  `validateRequest('interaction'),`
- packages/core/src/response/clineResponse.ts:50 (constant)
  `(this as any).validateResponse();`
- packages/core/src/response/clineResponse.ts:53 (constant)
  `private validateResponse(): void {`
- packages/core/src/optimization/CacheManager.ts:136 (constant)
  `async invalidateByTag(tag: string): Promise<number> {`
- packages/core/src/optimization/CacheManager.ts:149 (constant)
  `(this as any).(logger as any).info('Cache entries invalidated by tag', { tag, count: keys.length });`
- packages/core/src/llm/LLMProvider.ts:82 (constant)
  `protected validateConfig(): void {`
- packages/core/src/llm/LLMProvider.ts:100 (constant)
  `protected validateContext(context: LLMContext): void {`
- packages/core/src/llm/LLMProvider.ts:118 (constant)
  `protected async validateTokenCount(context: LLMContext): Promise<boolean> {`
- packages/core/src/llm/LLMProvider.ts:164 (constant)
  `(this as any).validateContext(context);`
- packages/core/src/llm/LLMProvider.ts:167 (constant)
  `const isValid = await (this as any).validateTokenCount(context);`
- packages/core/src/integration/integrationOrchestrator.ts:75 (constant)
  `await (this as any).validateIntegration(task);`
- packages/core/src/integration/integrationOrchestrator.ts:148 (constant)
  `private async validateIntegration(task: IntegrationTask): Promise<void> {`
- packages/core/src/integration/WebSocketService.ts:63 (constant)
  `if (!(this as any).validateMessage(message)) {`
- packages/core/src/integration/WebSocketService.ts:75 (constant)
  `private validateMessage(message: any): boolean {`
- packages/core/src/innovation/integrationOrchestrator.ts:51 (constant)
  `await (this as any)._validateIntegration(task);`
- packages/core/src/innovation/integrationOrchestrator.ts:118 (constant)
  `private async _validateIntegration(task: IntegrationTask): Promise<void> {`
- packages/core/src/entities/prompt.entity.ts:53 (constant)
  `validate(params: Record<string, unknown>): { isValid: boolean; errors?: string[] } {`
- packages/core/src/database/databaseManager.ts:65 (constant)
  `(this as any).config = (this as any).validateConfig(config);`
- packages/core/src/database/databaseManager.ts:77 (constant)
  `private validateConfig(config: DatabaseConfig): DatabaseConfig {`
- packages/core/src/config/ConfigurationService.ts:390 (constant)
  `async validate(): Promise<boolean> {`
- packages/core/src/config/ConfigValidator.ts:43 (constant)
  `async validate(path: string, value: any): Promise<ValidationResult> {`
- packages/core/src/config/ConfigValidator.ts:135 (constant)
  `validateEnvironmentVariables(`
- packages/core/src/config/ConfigValidator.ts:171 (constant)
  `validateDependencies(`
- packages/core/src/config/ConfigValidator.ts:203 (constant)
  `validateConstraints(`
- packages/core/src/config/ConfigManager.ts:21 (constant)
  `validate?: boolean;`
- packages/core/src/config/ConfigManager.ts:68 (constant)
  `await (this as any).validateConfiguration();`
- packages/core/src/config/ConfigManager.ts:195 (constant)
  `await (this as any).validateConfiguration();`
- packages/core/src/config/ConfigManager.ts:218 (constant)
  `private async validateConfiguration(): Promise<void> {`
- packages/core/src/config/ConfigManager.ts:250 (constant)
  `if ((options as any).validate && (this as any).(schemas as any).has(path)) {`
- packages/core/src/communication/validator.ts:135 (constant)
  `async validate(message: Message): Promise<MessageValidationError[]> {`
- packages/core/src/communication/validator.ts:159 (constant)
  `const validationResult = (schema as any).validate(message, { abortEarly: false });`
- packages/core/src/communication/validator.ts:171 (constant)
  `await (this as any).validateCustomRules(message, errors);`
- packages/core/src/communication/validator.ts:176 (constant)
  `private async validateCustomRules(`
- packages/core/src/communication/index.ts:37 (constant)
  `const errors = await (this as any).(validator as any).validate(fullMessage);`
- packages/core/src/communication/Protocol.ts:70 (constant)
  `async validateMessage(message: any): Promise<Message> {`
- packages/core/src/communication/Protocol.ts:148 (constant)
  `await (this as any).validateMessage(message);`
- packages/core/src/communication/MessageValidator.ts:26 (constant)
  `async validate(message: Message): Promise<void> {`
- packages/core/src/communication/MessageValidator.ts:29 (constant)
  `await (this as any).validateSchema(message);`
- packages/core/src/communication/MessageValidator.ts:32 (constant)
  `await (this as any).validateContent(message);`
- packages/core/src/communication/MessageValidator.ts:35 (constant)
  `await (this as any).validateMetadata(message);`
- packages/core/src/communication/MessageValidator.ts:38 (constant)
  `await (this as any).validateBusinessRules(message);`
- packages/core/src/communication/MessageValidator.ts:60 (constant)
  `private async validateSchema(message: Message): Promise<void> {`
- packages/core/src/communication/MessageValidator.ts:68 (constant)
  `private async validateContent(message: Message): Promise<void> {`
- packages/core/src/communication/MessageValidator.ts:100 (constant)
  `private async validateMetadata(message: Message): Promise<void> {`
- packages/core/src/communication/MessageValidator.ts:137 (constant)
  `private async validateBusinessRules(message: Message): Promise<void> {`
- packages/core/src/communication/MessageBroker.ts:76 (constant)
  `await (this as any).(protocol as any).validateMessage(message);`
- packages/core/src/communication/CommunicationProtocol.ts:57 (constant)
  `await (this as any).(validator as any).validate(message);`
- packages/core/src/cache/CacheService.ts:39 (constant)
  `async invalidate(pattern: string): Promise<void> {`
- packages/core/src/auth/firebase-auth.service.ts:42 (constant)
  `async validateSession(token: string): Promise<(Session & { user: User }) | null> {`
- packages/core/src/auth/auth.service.ts:18 (constant)
  `async validateUser(email: string, password: string): Promise<any> {`
- packages/core/src/auth/auth.service.ts:64 (constant)
  `async validateToken(token: string): Promise<any> {`
- packages/core/src/auth/auth-service.ts:29 (constant)
  `async validateUser(email: string, password: string): Promise<UserWithoutPassword | null> {`
- packages/core/src/auth/AuthenticationService.ts:21 (constant)
  `async validatePermissions(userId: string, resource: string, action: string): Promise<boolean> {`
- packages/core/src/websocket/gateways/ai-coder.gateway.ts:52 (constant)
  `const validation = this.validateMessageStructure(message);`
- packages/core/src/websocket/gateways/ai-coder.gateway.ts:65 (constant)
  `private validateMessageStructure(message: any): {`
- packages/core/src/services/protocol/protocol-translator.service.ts:14 (constant)
  `async validateProtocolCompliance(`
- packages/core/src/services/monitoring/MessageProcessor.ts:48 (constant)
  `* Process and validate an incoming message`
- packages/core/src/services/monitoring/MessageProcessor.ts:55 (constant)
  `const structureValidation = (this as any).validateMessageStructure(message);`
- packages/core/src/services/monitoring/MessageProcessor.ts:98 (constant)
  `private validateMessageStructure(message: BaseMessage): ValidationResult {`
- packages/core/src/services/auth/service-authentication.ts:3 (constant)
  `validate(token: string): Promise<boolean>;`
- packages/core/src/services/auth/service-authentication.ts:9 (constant)
  `async validateServiceToken(token: string): Promise<boolean> {`
- packages/core/src/services/auth/service-authentication.ts:10 (constant)
  `return this.authStrategy.validate(token);`
- packages/core/src/services/auth/service-authentication.ts:17 (constant)
  `async validateServiceToken(token: string): Promise<boolean> {`
- packages/core/src/services/auth/service-authentication.ts:18 (constant)
  `return this.authentication.validateServiceToken(token);`
- packages/core/src/security/tests/auth.service.spec.ts:92 (constant)
  `it('should validate password policy', async () => {`
- packages/core/src/security/tests/auth.service.spec.ts:100 (constant)
  `describe('validateCredentials', () => {`
- packages/core/src/security/tests/auth.service.spec.ts:101 (constant)
  `it('should validate password credentials', async () => {`
- packages/core/src/security/tests/auth.service.spec.ts:108 (constant)
  `const isValid = await (service as any).validateCredentials(`
- packages/core/src/security/tests/auth.service.spec.ts:117 (constant)
  `it('should validate API key credentials', async () => {`
- packages/core/src/security/tests/auth.service.spec.ts:124 (constant)
  `const isValid = await (service as any).validateCredentials(`
- packages/core/src/security/tests/auth.service.spec.ts:141 (constant)
  `const isValid = await (service as any).validateCredentials(`
- packages/core/src/security/tests/auth.service.spec.ts:217 (constant)
  `describe('validateSession', () => {`
- packages/core/src/security/tests/auth.service.spec.ts:218 (constant)
  `it('should validate active session', async () => {`
- packages/core/src/security/tests/auth.service.spec.ts:232 (constant)
  `const validatedSession = await (service as any).validateSession((session as any).id);`
- packages/core/src/security/tests/auth.service.spec.ts:234 (constant)
  `expect(validatedSession).toBeDefined();`
- packages/core/src/security/tests/auth.service.spec.ts:235 (constant)
  `expect((validatedSession as any).id).toBe((session as any).id);`
- packages/core/src/security/tests/auth.service.spec.ts:236 (constant)
  `expect((validatedSession as any).status).toBe('active');`
- packages/core/src/security/tests/auth.service.spec.ts:253 (constant)
  `const validatedSession = await (service as any).validateSession((session as any).id);`
- packages/core/src/security/tests/auth.service.spec.ts:255 (constant)
  `expect(validatedSession).toBeNull();`
- packages/core/src/security/tests/auth.service.spec.ts:272 (constant)
  `const validatedSession = await (service as any).validateSession((session as any).id);`
- packages/core/src/security/tests/auth.service.spec.ts:274 (constant)
  `expect(validatedSession).toBeNull();`
- packages/core/src/security/tests/auth.service.spec.js:70 (constant)
  `it('should validate password policy', async () => {`
- packages/core/src/security/tests/auth.service.spec.js:75 (constant)
  `describe('validateCredentials', () => {`
- packages/core/src/security/tests/auth.service.spec.js:76 (constant)
  `it('should validate password credentials', async () => {`
- packages/core/src/security/tests/auth.service.spec.js:79 (constant)
  `const isValid = await service.validateCredentials(types_1.AuthMethod.PASSWORD, password, credentials);`
- packages/core/src/security/tests/auth.service.spec.js:82 (constant)
  `it('should validate API key credentials', async () => {`
- packages/core/src/security/tests/auth.service.spec.js:85 (constant)
  `const isValid = await service.validateCredentials(types_1.AuthMethod.API_KEY, apiKey, credentials);`
- packages/core/src/security/tests/auth.service.spec.js:91 (constant)
  `const isValid = await service.validateCredentials(types_1.AuthMethod.API_KEY, apiKey, credentials);`
- packages/core/src/security/tests/auth.service.spec.js:149 (constant)
  `describe('validateSession', () => {`
- packages/core/src/security/tests/auth.service.spec.js:150 (constant)
  `it('should validate active session', async () => {`
- packages/core/src/security/tests/auth.service.spec.js:162 (constant)
  `const validatedSession = await service.validateSession(session.id);`
- packages/core/src/security/tests/auth.service.spec.js:163 (constant)
  `expect(validatedSession).toBeDefined();`
- packages/core/src/security/tests/auth.service.spec.js:164 (constant)
  `expect(validatedSession.id).toBe(session.id);`
- packages/core/src/security/tests/auth.service.spec.js:165 (constant)
  `expect(validatedSession.status).toBe('active');`
- packages/core/src/security/tests/auth.service.spec.js:179 (constant)
  `const validatedSession = await service.validateSession(session.id);`
- packages/core/src/security/tests/auth.service.spec.js:180 (constant)
  `expect(validatedSession).toBeNull();`
- packages/core/src/security/tests/auth.service.spec.js:194 (constant)
  `const validatedSession = await service.validateSession(session.id);`
- packages/core/src/security/tests/auth.service.spec.js:195 (constant)
  `expect(validatedSession).toBeNull();`
- packages/core/src/security/middleware/auth.middleware.ts:17 (constant)
  `const session = await (this as any).validateSession(token, req);`
- packages/core/src/security/middleware/auth.middleware.ts:28 (constant)
  `'token_validated',`
- packages/core/src/security/middleware/auth.middleware.ts:72 (constant)
  `private async validateSession(`
- packages/core/src/security/middleware/auth.middleware.ts:77 (constant)
  `const validatedToken = await (this as any).securityService.(authService as any).validateToken(token);`
- packages/core/src/security/middleware/auth.middleware.ts:78 (constant)
  `if (!validatedToken: any){`
- packages/core/src/security/middleware/auth.middleware.ts:82 (constant)
  `// Get and validate session`
- packages/core/src/security/middleware/auth.middleware.ts:83 (constant)
  `const session = await (this as any).securityService.(authService as any).validateSession(`
- packages/core/src/security/middleware/auth.middleware.ts:84 (constant)
  `(validatedToken as any).id,`
- packages/core/src/database/repositories/SessionRepository.ts:24 (constant)
  `async invalidateSession(token: string): Promise<boolean> {`
- packages/core/src/database/repositories/SessionRepository.ts:32 (constant)
  `async invalidateUserSessions(userId: string): Promise<boolean> {`
- packages/core/src/database/entities/User.ts:52 (constant)
  `async validatePassword(password: string): Promise<boolean> {`
- packages/core/src/agents/workflow/agent-workflow.service.ts:13 (constant)
  `await this.validateWorkflow(workflow);`
- packages/core/src/agents/workflow/agent-workflow.service.ts:25 (constant)
  `private async validateWorkflow(workflow: AgentWorkflow): Promise<void> {`
- packages/core/src/agents/workflow/agent-workflow.service.ts:27 (constant)
  `this.validateAgentAvailability(workflow.requiredAgents),`
- packages/core/src/agents/workflow/agent-workflow.service.ts:28 (constant)
  `this.validateResourceRequirements(workflow.resourceRequirements),`
- packages/core/src/agents/workflow/agent-workflow.service.ts:29 (constant)
  `this.validateWorkflowRules(workflow.rules)`
- packages/core/src/agents/communication/agent-bridge.service.ts:15 (constant)
  `await this.messageValidator.validate(message);`
- apps/backend/src/services/validationService.ts:2 (constant)
  `import { validate, ValidationError as ClassValidatorError } from 'class-validator';`
- apps/backend/src/services/validationService.ts:28 (constant)
  `async validateRequest<T extends object>(`
- apps/backend/src/services/validationService.ts:33 (constant)
  `return this.validateSync(data, dto, config);`
- apps/backend/src/services/validationService.ts:36 (constant)
  `validateSchema(data: unknown, schema: object): boolean {`
- apps/backend/src/services/validationService.ts:46 (constant)
  `validateValue(data: unknown, rules: object): boolean {`
- apps/backend/src/services/validationService.ts:56 (constant)
  `async validateSync<T extends object>(`
- apps/backend/src/services/validationService.ts:66 (constant)
  `const errors = await validate(instance, validatorConfig);`
- apps/backend/src/services/validationService.js:39 (constant)
  `async validateRequest(data, dto, config = {}) {`
- apps/backend/src/services/validationService.js:44 (constant)
  `const errors = await (0, class_validator_1.validate)(instance, validatorConfig);`
- apps/backend/src/services/validationService.js:72 (constant)
  `validateSync(data, dto, config = {}) {`
- apps/backend/src/services/validationService.js:77 (constant)
  `const errors = (0, class_validator_1.validate)(instance, validatorConfig);`
- apps/backend/src/services/validationService.js:97 (constant)
  `validateValue(value, rules) {`
- apps/backend/src/services/validationService.js:120 (constant)
  `validateSchema(data, schema) {`
- apps/backend/src/services/validationService.js:122 (constant)
  `return this.validateObject(data, schema);`
- apps/backend/src/services/validationService.js:129 (constant)
  `validateObject(data, schema) {`
- apps/backend/src/services/validationService.js:138 (constant)
  `if (!this.validateObject(data[key], value)) {`
- apps/backend/src/services/validationService.d.ts:14 (constant)
  `validateRequest<T extends object>(data: any, dto: new () => T, config?: Partial<ValidationConfig>): Promise<ValidationResult>;`
- apps/backend/src/services/validationService.d.ts:16 (constant)
  `validateSync<T extends object>(data: any, dto: new () => T, config?: Partial<ValidationConfig>): ValidationResult;`
- apps/backend/src/services/validationService.d.ts:17 (constant)
  `validateValue(value: any, rules: {`
- apps/backend/src/services/validationService.d.ts:20 (constant)
  `validateSchema(data: any, schema: object): boolean;`
- apps/backend/src/services/validationService.d.ts:21 (constant)
  `private validateObject;`
- apps/backend/src/services/authService.ts:10 (constant)
  `async validateUser(email: string, password: string): Promise<User | null> {`
- apps/backend/src/services/authService.js:52 (constant)
  `async validateUser(email, password) {`
- apps/backend/src/services/authService.d.ts:6 (constant)
  `validateUser(email: string, password: string): Promise<User | null>;`
- apps/backend/src/scripts/augment-bridge.js:107 (constant)
  `AugmentBridge.prototype.validateMessage = function (data) {`
- apps/backend/src/scripts/augment-bridge.js:123 (constant)
  `if (!this.validateMessage(data)) {`
- apps/backend/src/n8n/workflow.validator.ts:2 (constant)
  `validate(nodes: any[], edges: any[], nodeTypes: any[]): string[] {`
- apps/backend/src/n8n/workflow.validator.ts:21 (constant)
  `const paramErrors = this.validateNodeParameters(node, nodeTypeData);`
- apps/backend/src/n8n/workflow.validator.ts:25 (constant)
  `const credentialErrors = this.validateNodeCredentials(node, nodeTypeData);`
- apps/backend/src/n8n/workflow.validator.ts:30 (constant)
  `const connectionErrors = this.validateConnections(nodes, edges);`
- apps/backend/src/n8n/workflow.validator.ts:40 (constant)
  `private validateNodeParameters(node: any, nodeTypeData: any): string[] {`
- apps/backend/src/n8n/workflow.validator.ts:55 (constant)
  `private validateNodeCredentials(node: any, nodeTypeData: any): string[] {`
- apps/backend/src/n8n/workflow.validator.ts:70 (constant)
  `private validateConnections(nodes: any[], edges: any[]): string[] {`
- apps/backend/src/n8n/workflow.validator.js:5 (constant)
  `validate(nodes, edges, nodeTypes) {`
- apps/backend/src/n8n/workflow.validator.js:17 (constant)
  `const paramErrors = this.validateNodeParameters(node, nodeTypeData);`
- apps/backend/src/n8n/workflow.validator.js:19 (constant)
  `const credentialErrors = this.validateNodeCredentials(node, nodeTypeData);`
- apps/backend/src/n8n/workflow.validator.js:22 (constant)
  `const connectionErrors = this.validateConnections(nodes, edges);`
- apps/backend/src/n8n/workflow.validator.js:28 (constant)
  `validateNodeParameters(node, nodeTypeData) {`
- apps/backend/src/n8n/workflow.validator.js:38 (constant)
  `validateNodeCredentials(node, nodeTypeData) {`
- apps/backend/src/n8n/workflow.validator.js:48 (constant)
  `validateConnections(nodes, edges) {`
- apps/backend/src/n8n/workflow.validator.d.ts:2 (constant)
  `validate(nodes: any[], edges: any[], nodeTypes: any[]): string[];`
- apps/backend/src/n8n/workflow.validator.d.ts:3 (constant)
  `private validateNodeParameters;`
- apps/backend/src/n8n/workflow.validator.d.ts:4 (constant)
  `private validateNodeCredentials;`
- apps/backend/src/n8n/workflow.validator.d.ts:5 (constant)
  `private validateConnections;`
- apps/backend/src/n8n/n8n-integration.controller.ts:28 (constant)
  `const validationErrors = this.validator.validate(workflowData.nodes, workflowData.edges, nodeTypes);`
- apps/backend/src/n8n/n8n-integration.controller.js:34 (constant)
  `const validationErrors = this.validator.validate(workflowData.nodes, workflowData.edges, nodeTypes);`
- apps/backend/src/middleware/validationMiddleware.ts:10 (constant)
  `validateQuery?: boolean;`
- apps/backend/src/middleware/validationMiddleware.ts:11 (constant)
  `validateBody?: boolean;`
- apps/backend/src/middleware/validationMiddleware.ts:12 (constant)
  `validateParams?: boolean;`
- apps/backend/src/middleware/validationMiddleware.ts:28 (constant)
  `if (options.validateBody && req.body) {`
- apps/backend/src/middleware/validationMiddleware.ts:30 (constant)
  `const result = await this.validationService.validateRequest(req.body, options.dto);`
- apps/backend/src/middleware/validationMiddleware.ts:40 (constant)
  `const isValid = this.validationService.validateSchema(req.body, options.schema);`
- apps/backend/src/middleware/validationMiddleware.ts:48 (constant)
  `this.validationService.validateValue(req.body, options.rules)`
- apps/backend/src/middleware/validationMiddleware.ts:54 (constant)
  `if (options.validateQuery && req.query) {`
- apps/backend/src/middleware/validationMiddleware.ts:56 (constant)
  `const isValid = this.validationService.validateSchema(req.query, options.schema);`
- apps/backend/src/middleware/validationMiddleware.ts:64 (constant)
  `this.validationService.validateValue(req.query, options.rules)`
- apps/backend/src/middleware/validationMiddleware.ts:70 (constant)
  `if (options.validateParams && req.params) {`
- apps/backend/src/middleware/validationMiddleware.ts:72 (constant)
  `const isValid = this.validationService.validateSchema(req.params, options.schema);`
- apps/backend/src/middleware/validationMiddleware.ts:80 (constant)
  `this.validationService.validateValue(req.params, options.rules)`
- apps/backend/src/middleware/validationMiddleware.js:25 (constant)
  `if (options.validateBody && req.body) {`
- apps/backend/src/middleware/validationMiddleware.js:27 (constant)
  `const result = await this.validationService.validateRequest(req.body, options.dto);`
- apps/backend/src/middleware/validationMiddleware.js:36 (constant)
  `const isValid = this.validationService.validateSchema(req.body, options.schema);`
- apps/backend/src/middleware/validationMiddleware.js:42 (constant)
  `validationPromises.push(this.validationService.validateValue(req.body, options.rules));`
- apps/backend/src/middleware/validationMiddleware.js:45 (constant)
  `if (options.validateQuery && req.query) {`
- apps/backend/src/middleware/validationMiddleware.js:47 (constant)
  `const isValid = this.validationService.validateSchema(req.query, options.schema);`
- apps/backend/src/middleware/validationMiddleware.js:53 (constant)
  `validationPromises.push(this.validationService.validateValue(req.query, options.rules));`
- apps/backend/src/middleware/validationMiddleware.js:56 (constant)
  `if (options.validateParams && req.params) {`
- apps/backend/src/middleware/validationMiddleware.js:58 (constant)
  `const isValid = this.validationService.validateSchema(req.params, options.schema);`
- apps/backend/src/middleware/validationMiddleware.js:64 (constant)
  `validationPromises.push(this.validationService.validateValue(req.params, options.rules));`
- apps/backend/src/middleware/validationMiddleware.d.ts:11 (constant)
  `validateQuery?: boolean;`
- apps/backend/src/middleware/validationMiddleware.d.ts:12 (constant)
  `validateBody?: boolean;`
- apps/backend/src/middleware/validationMiddleware.d.ts:13 (constant)
  `validateParams?: boolean;`
- apps/backend/src/auth/firebase-auth.guard.ts:17 (constant)
  `const decodedToken = await this.authService.validateFirebaseToken(token);`
- apps/backend/src/auth/auth.service.ts:18 (constant)
  `async validateUser(email: string, password: string) {`
- apps/backend/src/services/agent/agent-coordinator.ts:31 (constant)
  `await this.validateResponse(response);`
- apps/frontend/src/utils/workflowValidation.ts:3 (constant)
  `exports.validateWorkflow = exports.validateWorkflowExecution = exports.validateWorkflowConnections = exports.validateNodeConfiguration = exports.isValidEdge = exports.isValidNode = exports.isValidCondition = exports.isValidPosition = void 0;`
- apps/frontend/src/utils/workflowValidation.ts:78 (constant)
  `const validateNodeConfiguration = (node) => {`
- apps/frontend/src/utils/workflowValidation.ts:116 (constant)
  `exports.validateNodeConfiguration = validateNodeConfiguration;`
- apps/frontend/src/utils/workflowValidation.ts:117 (constant)
  `const validateWorkflowConnections = (nodes, edges) => {`
- apps/frontend/src/utils/workflowValidation.ts:153 (constant)
  `exports.validateWorkflowConnections = validateWorkflowConnections;`
- apps/frontend/src/utils/workflowValidation.ts:154 (constant)
  `const validateWorkflowExecution = (nodes) => {`
- apps/frontend/src/utils/workflowValidation.ts:157 (constant)
  `const configErrors = (0, exports.validateNodeConfiguration)(node);`
- apps/frontend/src/utils/workflowValidation.ts:172 (constant)
  `exports.validateWorkflowExecution = validateWorkflowExecution;`
- apps/frontend/src/utils/workflowValidation.ts:173 (constant)
  `const validateWorkflow = (nodes, edges) => {`
- apps/frontend/src/utils/workflowValidation.ts:185 (constant)
  `errors.push(...(0, exports.validateWorkflowConnections)(nodes, edges));`
- apps/frontend/src/utils/workflowValidation.ts:186 (constant)
  `errors.push(...(0, exports.validateWorkflowExecution)(nodes));`
- apps/frontend/src/utils/workflowValidation.ts:192 (constant)
  `exports.validateWorkflow = validateWorkflow;`
- apps/frontend/src/utils/workflowValidation.js:3 (constant)
  `exports.validateWorkflow = exports.validateWorkflowExecution = exports.validateWorkflowConnections = exports.validateNodeConfiguration = exports.isValidEdge = exports.isValidNode = exports.isValidCondition = exports.isValidPosition = void 0;`
- apps/frontend/src/utils/workflowValidation.js:78 (constant)
  `const validateNodeConfiguration = (node) => {`
- apps/frontend/src/utils/workflowValidation.js:116 (constant)
  `exports.validateNodeConfiguration = validateNodeConfiguration;`
- apps/frontend/src/utils/workflowValidation.js:117 (constant)
  `const validateWorkflowConnections = (nodes, edges) => {`
- apps/frontend/src/utils/workflowValidation.js:153 (constant)
  `exports.validateWorkflowConnections = validateWorkflowConnections;`
- apps/frontend/src/utils/workflowValidation.js:154 (constant)
  `const validateWorkflowExecution = (nodes) => {`
- apps/frontend/src/utils/workflowValidation.js:157 (constant)
  `const configErrors = (0, exports.validateNodeConfiguration)(node);`
- apps/frontend/src/utils/workflowValidation.js:172 (constant)
  `exports.validateWorkflowExecution = validateWorkflowExecution;`
- apps/frontend/src/utils/workflowValidation.js:173 (constant)
  `const validateWorkflow = (nodes, edges) => {`
- apps/frontend/src/utils/workflowValidation.js:185 (constant)
  `errors.push(...(0, exports.validateWorkflowConnections)(nodes, edges));`
- apps/frontend/src/utils/workflowValidation.js:186 (constant)
  `errors.push(...(0, exports.validateWorkflowExecution)(nodes));`
- apps/frontend/src/utils/workflowValidation.js:192 (constant)
  `exports.validateWorkflow = validateWorkflow;`
- apps/frontend/src/utils/workflow.ts:19 (constant)
  `export const validateWorkflow = (nodes, edges) => {`
- apps/frontend/src/utils/workflow.js:19 (constant)
  `export const validateWorkflow = (nodes, edges) => {`
- apps/frontend/src/utils/workflow.d.ts:24 (constant)
  `export declare const validateWorkflow: (nodes: WorkflowNode[], edges: WorkflowEdge[]) => {`
- apps/frontend/src/utils/chat.ts:22 (constant)
  `export const validateChatInput = (input: string): boolean => {`
- apps/frontend/src/types/services.ts:6 (constant)
  `validateCaptcha(token: string): Promise<boolean>;`
- apps/frontend/src/types/services.ts:7 (constant)
  `validateCSRFToken(token: string): boolean;`
- apps/frontend/src/types/services.ts:13 (constant)
  `validateSession(sessionId: string): boolean;`
- apps/frontend/src/hooks/useMessages.ts:39 (constant)
  `if (!selectedAgent || !conversationId || !(0, message_utils_1.validateMessage)(content))`
- apps/frontend/src/hooks/useMessages.js:39 (constant)
  `if (!selectedAgent || !conversationId || !(0, message_utils_1.validateMessage)(content))`
- apps/frontend/src/lib/uploadHandler.ts:4 (constant)
  `exports.validateFile = validateFile;`
- apps/frontend/src/lib/uploadHandler.ts:29 (constant)
  `function validateFile(file) {`
- apps/frontend/src/lib/uploadHandler.js:4 (constant)
  `exports.validateFile = validateFile;`
- apps/frontend/src/lib/uploadHandler.js:29 (constant)
  `function validateFile(file) {`
- apps/frontend/src/lib/session.ts:13 (constant)
  `export async function validateSessionTokenForUser(): Promise<boolean> {`
- apps/frontend/src/lib/session.js:3 (constant)
  `export default async function validateSessionTokenForUser() {`
- apps/frontend/src/lib/session.d.ts:1 (constant)
  `export default function validateSessionTokenForUser(): Promise<boolean>;`
- apps/frontend/src/lib/route.ts:15 (constant)
  `(0, uploadHandler_1.validateFile)(file);`
- apps/frontend/src/lib/route.js:15 (constant)
  `(0, uploadHandler_1.validateFile)(file);`
- apps/frontend/src/lib/prompt_manager.tsx:26 (constant)
  `validate(params) {`
- apps/frontend/src/lib/prompt_manager.tsx:78 (constant)
  `const validation = prompt.validate(params);`
- apps/frontend/src/lib/prompt_manager.ts:28 (constant)
  `validate(params) {`
- apps/frontend/src/lib/prompt_manager.ts:96 (constant)
  `const validation = prompt.validate(params);`
- apps/frontend/src/lib/prompt_manager.js:26 (constant)
  `validate(params) {`
- apps/frontend/src/lib/prompt_manager.js:78 (constant)
  `const validation = prompt.validate(params);`
- apps/frontend/src/lib/message-utils.ts:3 (constant)
  `exports.createSocketPayload = exports.formatTimestamp = exports.validateMessage = exports.getAgentStatusColor = exports.getAgentNameById = exports.createUserMessage = exports.mapMessageResponseToMessage = void 0;`
- apps/frontend/src/lib/message-utils.ts:36 (constant)
  `const validateMessage = (content) => {`
- apps/frontend/src/lib/message-utils.ts:39 (constant)
  `exports.validateMessage = validateMessage;`
- apps/frontend/src/lib/message-utils.js:3 (constant)
  `exports.createSocketPayload = exports.formatTimestamp = exports.validateMessage = exports.getAgentStatusColor = exports.getAgentNameById = exports.createUserMessage = exports.mapMessageResponseToMessage = void 0;`
- apps/frontend/src/lib/message-utils.js:36 (constant)
  `const validateMessage = (content) => {`
- apps/frontend/src/lib/message-utils.js:39 (constant)
  `exports.validateMessage = validateMessage;`
- apps/frontend/src/lib/index copy 4.ts:3 (constant)
  `exports.createSocketPayload = exports.formatTimestamp = exports.validateMessage = exports.getAgentStatusColor = exports.getAgentNameById = exports.createUserMessage = exports.mapMessageResponseToMessage = exports.useAgents = exports.useMessages = exports.AgentSelector = exports.TypingIndicator = exports.EnhancedChatBubble = exports.ChatInterface = void 0;`
- apps/frontend/src/lib/index copy 4.ts:21 (constant)
  `Object.defineProperty(exports, "validateMessage", { enumerable: true, get: function () { return message_utils_1.validateMessage; } });`
- apps/frontend/src/lib/index copy 4.js:3 (constant)
  `exports.createSocketPayload = exports.formatTimestamp = exports.validateMessage = exports.getAgentStatusColor = exports.getAgentNameById = exports.createUserMessage = exports.mapMessageResponseToMessage = exports.useAgents = exports.useMessages = exports.AgentSelector = exports.TypingIndicator = exports.EnhancedChatBubble = exports.ChatInterface = void 0;`
- apps/frontend/src/lib/index copy 4.js:21 (constant)
  `Object.defineProperty(exports, "validateMessage", { enumerable: true, get: function () { return message_utils_1.validateMessage; } });`
- apps/frontend/src/lib/dashboard.ts:99 (constant)
  `validateName() {`
- apps/frontend/src/lib/dashboard.js:99 (constant)
  `validateName() {`
- apps/frontend/src/lib/agent.ts:3 (constant)
  `exports.convertApiStatus = exports.validateAgentStatus = exports.transformStoreToApiAgent = exports.transformApiToStoreAgent = void 0;`
- apps/frontend/src/lib/agent.ts:24 (constant)
  `const validateAgentStatus = (status) => {`
- apps/frontend/src/lib/agent.ts:30 (constant)
  `exports.validateAgentStatus = validateAgentStatus;`
- apps/frontend/src/lib/agent.js:3 (constant)
  `exports.convertApiStatus = exports.validateAgentStatus = exports.transformStoreToApiAgent = exports.transformApiToStoreAgent = void 0;`
- apps/frontend/src/lib/agent.js:24 (constant)
  `const validateAgentStatus = (status) => {`
- apps/frontend/src/lib/agent.js:30 (constant)
  `exports.validateAgentStatus = validateAgentStatus;`
- apps/frontend/src/examples/error-tracking-usage.tsx:27 (constant)
  `function validateUserForm(formData: Record<string, unknown>) {`
- apps/frontend/src/examples/error-tracking-usage.tsx:234 (constant)
  `validateUserForm,`
- apps/frontend/src/components/chat-interface.tsx:35 (constant)
  `if ((0, message_utils_1.validateMessage)(input)) {`
- apps/frontend/src/components/chat-interface.tsx:97 (constant)
  `<button_1.Button onClick={handleSendMessage} disabled={!(0, message_utils_1.validateMessage)(input) || !isConnected || !selectedAgent} className="px-6">`
- apps/frontend/src/components/chat-interface.ts:36 (constant)
  `if ((0, message_utils_1.validateMessage)(input)) {`
- apps/frontend/src/components/chat-interface.ts:101 (constant)
  `<button_1.Button onClick={handleSendMessage} disabled={!(0, message_utils_1.validateMessage)(input) || !isConnected || !selectedAgent} className="px-6">`
- apps/frontend/src/components/chat-interface.js:36 (constant)
  `if ((0, message_utils_1.validateMessage)(input)) {`
- apps/frontend/src/components/chat-interface.js:101 (constant)
  `<button_1.Button onClick={handleSendMessage} disabled={!(0, message_utils_1.validateMessage)(input) || !isConnected || !selectedAgent} className="px-6">`
- apps/frontend/src/components/LLMConfigManager.tsx:32 (constant)
  `const isValid = await (0, providers_1.validateProviderConfig)(config);`
- apps/frontend/src/components/LLMConfigManager.ts:22 (constant)
  `const isValid = await (0, providers_1.validateProviderConfig)(config);`
- apps/frontend/src/components/LLMConfigManager.js:22 (constant)
  `const isValid = await (0, providers_1.validateProviderConfig)(config);`
- apps/frontend/src/core/utils/validation.ts:11 (constant)
  `validate(data) {`
- apps/frontend/src/core/utils/validation.ts:16 (constant)
  `if (!rule.validate(value)) {`
- apps/frontend/src/core/utils/validation.ts:29 (constant)
  `validate: (value) => value !== undefined && value !== null && value !== '',`
- apps/frontend/src/core/utils/validation.ts:33 (constant)
  `validate: (value) => value.length >= length,`
- apps/frontend/src/core/utils/validation.ts:37 (constant)
  `validate: (value) => value.length <= length,`
- apps/frontend/src/core/utils/validation.ts:41 (constant)
  `validate: (value) => regex.test(value),`
- apps/frontend/src/core/utils/validation.ts:45 (constant)
  `validate: (value) => /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value),`
- apps/frontend/src/core/utils/validation.ts:49 (constant)
  `validate: (value) => !isNaN(value),`
- apps/frontend/src/core/utils/validation.ts:53 (constant)
  `validate: (value) => value >= min,`
- apps/frontend/src/core/utils/validation.ts:57 (constant)
  `validate: (value) => value <= max,`
- apps/frontend/src/core/utils/validation.ts:61 (constant)
  `validate: (value) => {`
- apps/frontend/src/core/utils/validation.ts:72 (constant)
  `custom: (validateFn, message) => ({`
- apps/frontend/src/core/utils/validation.ts:73 (constant)
  `validate: validateFn,`
- apps/frontend/src/core/utils/validation.js:11 (constant)
  `validate(data) {`
- apps/frontend/src/core/utils/validation.js:16 (constant)
  `if (!rule.validate(value)) {`
- apps/frontend/src/core/utils/validation.js:29 (constant)
  `validate: (value) => value !== undefined && value !== null && value !== '',`
- apps/frontend/src/core/utils/validation.js:33 (constant)
  `validate: (value) => value.length >= length,`
- apps/frontend/src/core/utils/validation.js:37 (constant)
  `validate: (value) => value.length <= length,`
- apps/frontend/src/core/utils/validation.js:41 (constant)
  `validate: (value) => regex.test(value),`
- apps/frontend/src/core/utils/validation.js:45 (constant)
  `validate: (value) => /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value),`
- apps/frontend/src/core/utils/validation.js:49 (constant)
  `validate: (value) => !isNaN(value),`
- apps/frontend/src/core/utils/validation.js:53 (constant)
  `validate: (value) => value >= min,`
- apps/frontend/src/core/utils/validation.js:57 (constant)
  `validate: (value) => value <= max,`
- apps/frontend/src/core/utils/validation.js:61 (constant)
  `validate: (value) => {`
- apps/frontend/src/core/utils/validation.js:72 (constant)
  `custom: (validateFn, message) => ({`
- apps/frontend/src/core/utils/validation.js:73 (constant)
  `validate: validateFn,`
- apps/frontend/src/core/utils/validation.d.ts:2 (constant)
  `validate: (value: T) => boolean;`
- apps/frontend/src/core/utils/validation.d.ts:12 (constant)
  `validate<T extends Record<string, any>>(data: T): ValidationResult;`
- apps/frontend/src/core/utils/validation.d.ts:24 (constant)
  `custom: <T>(validateFn: (value: T) => boolean, message: string) => ValidationRule<T>;`
- apps/frontend/src/core/utils/security.ts:29 (constant)
  `static validatePassword(password) {`
- apps/frontend/src/core/utils/security.ts:93 (constant)
  `static validateEmail(email) {`
- apps/frontend/src/core/utils/security.js:29 (constant)
  `static validatePassword(password) {`
- apps/frontend/src/core/utils/security.js:93 (constant)
  `static validateEmail(email) {`
- apps/frontend/src/core/utils/security.d.ts:6 (constant)
  `static validatePassword(password: string): {`
- apps/frontend/src/core/utils/security.d.ts:14 (constant)
  `static validateEmail(email: string): boolean;`
- apps/frontend/src/core/services/ConfigService.ts:24 (constant)
  `this.config = this.validateConfig(config);`
- apps/frontend/src/core/services/ConfigService.ts:41 (constant)
  `validateConfig(config) {`
- apps/frontend/src/core/services/ConfigService.js:24 (constant)
  `this.config = this.validateConfig(config);`
- apps/frontend/src/core/services/ConfigService.js:41 (constant)
  `validateConfig(config) {`
- apps/frontend/src/core/services/ConfigService.d.ts:19 (constant)
  `private validateConfig;`
- apps/frontend/src/components/workflow/WorkflowCanvas.tsx:22 (constant)
  `const { nodes, edges, selectedNode, isReadOnly, actions: { addNode, updateNode, removeNode, addEdge, updateEdge, removeEdge, selectNode, clearSelection, validate, optimize, exportWorkflow, importWorkflow, }, } = (0, WorkflowContext_1.useWorkflow)();`
- apps/frontend/src/components/workflow/WorkflowCanvas.tsx:70 (constant)
  `const isValid = validate();`
- apps/frontend/src/components/workflow/WorkflowCanvas.tsx:74 (constant)
  `}, [validate]);`
- apps/frontend/src/components/workflow/WorkflowCanvas.js:22 (constant)
  `const { nodes, edges, selectedNode, isReadOnly, actions: { addNode, updateNode, removeNode, addEdge, updateEdge, removeEdge, selectNode, clearSelection, validate, optimize, exportWorkflow, importWorkflow, }, } = (0, WorkflowContext_1.useWorkflow)();`
- apps/frontend/src/components/workflow/WorkflowCanvas.js:70 (constant)
  `const isValid = validate();`
- apps/frontend/src/components/workflow/WorkflowCanvas.js:74 (constant)
  `}, [validate]);`
- apps/frontend/src/components/features/AgentTraining.tsx:59 (constant)
  `const validateMutation = (0, react_query_1.useMutation)({`
- apps/frontend/src/components/features/AgentTraining.tsx:60 (constant)
  `mutationFn: (testData) => agentService_1.agentService.validateTraining(agentId, testData),`
- apps/frontend/src/components/features/AgentTraining.tsx:81 (constant)
  `validateMutation.mutate(testData);`
- apps/frontend/src/components/features/AgentTraining.tsx:104 (constant)
  `<Button_1.Button variant="outline" onClick={handleValidateTraining} disabled={validateMutation.isPending || !customData}>`
- apps/frontend/src/components/features/AgentTraining.ts:52 (constant)
  `const validateMutation = (0, react_query_1.useMutation)({`
- apps/frontend/src/components/features/AgentTraining.ts:53 (constant)
  `mutationFn: (testData) => agentService_1.agentService.validateTraining(agentId, testData),`
- apps/frontend/src/components/features/AgentTraining.ts:75 (constant)
  `validateMutation.mutate(testData);`
- apps/frontend/src/components/features/AgentTraining.ts:98 (constant)
  `<Button_1.Button variant="outline" onClick={handleValidateTraining} disabled={validateMutation.isPending || !customData}>`
- apps/frontend/src/components/features/AgentTraining.js:52 (constant)
  `const validateMutation = (0, react_query_1.useMutation)({`
- apps/frontend/src/components/features/AgentTraining.js:53 (constant)
  `mutationFn: (testData) => agentService_1.agentService.validateTraining(agentId, testData),`
- apps/frontend/src/components/features/AgentTraining.js:75 (constant)
  `validateMutation.mutate(testData);`
- apps/frontend/src/components/features/AgentTraining.js:98 (constant)
  `<Button_1.Button variant="outline" onClick={handleValidateTraining} disabled={validateMutation.isPending || !customData}>`
- apps/frontend/src/components/features/AgentCreationForm.tsx:65 (constant)
  `const validateForm = () => {`
- apps/frontend/src/components/features/AgentCreationForm.tsx:84 (constant)
  `const validateEnhancedForm = () => {`
- apps/frontend/src/components/features/AgentCreationForm.tsx:85 (constant)
  `if (!validateForm())`
- apps/frontend/src/components/features/AgentCreationForm.tsx:101 (constant)
  `if (!validateEnhancedForm()) {`
- apps/frontend/src/components/features/AgentCreationForm.js:65 (constant)
  `const validateForm = () => {`
- apps/frontend/src/components/features/AgentCreationForm.js:84 (constant)
  `const validateEnhancedForm = () => {`
- apps/frontend/src/components/features/AgentCreationForm.js:85 (constant)
  `if (!validateForm())`
- apps/frontend/src/components/features/AgentCreationForm.js:101 (constant)
  `if (!validateEnhancedForm()) {`
- apps/frontend/src/components/chat/chat-interface.tsx:35 (constant)
  `if ((0, message_utils_1.validateMessage)(input)) {`
- apps/frontend/src/components/chat/chat-interface.tsx:97 (constant)
  `<button_1.Button onClick={handleSendMessage} disabled={!(0, message_utils_1.validateMessage)(input) || !isConnected || !selectedAgent} className="px-6">`
- apps/frontend/src/components/chat/chat-interface.ts:36 (constant)
  `if ((0, message_utils_1.validateMessage)(input)) {`
- apps/frontend/src/components/chat/chat-interface.ts:101 (constant)
  `<button_1.Button onClick={handleSendMessage} disabled={!(0, message_utils_1.validateMessage)(input) || !isConnected || !selectedAgent} className="px-6">`
- apps/frontend/src/components/chat/chat-interface.js:36 (constant)
  `if ((0, message_utils_1.validateMessage)(input)) {`
- apps/frontend/src/components/chat/chat-interface.js:101 (constant)
  `<button_1.Button onClick={handleSendMessage} disabled={!(0, message_utils_1.validateMessage)(input) || !isConnected || !selectedAgent} className="px-6">`
- apps/frontend/src/components/WorkflowEditor/index.tsx:9 (constant)
  `import { validateN8nWorkflow, createDynamicValidator } from './utils/validation';`
- apps/frontend/src/components/WorkflowEditor/index.tsx:43 (constant)
  `const errors = validator.validate(nodes, edges);`
- apps/frontend/src/components/WorkflowEditor/index.tsx:75 (constant)
  `const currentValidationErrors = validator.validate(nodes, edges);`
- apps/frontend/src/components/WorkflowEditor/index.tsx:90 (constant)
  `const validationResult = validateN8nWorkflow(n8nWorkflowJson, dynamicNodeValidators);`
- apps/frontend/src/components/WorkflowEditor/index.js:9 (constant)
  `import { validateN8nWorkflow, createDynamicValidator } from './utils/validation';`
- apps/frontend/src/components/WorkflowEditor/index.js:43 (constant)
  `const errors = validator.validate(nodes, edges);`
- apps/frontend/src/components/WorkflowEditor/index.js:75 (constant)
  `const currentValidationErrors = validator.validate(nodes, edges);`
- apps/frontend/src/components/WorkflowEditor/index.js:90 (constant)
  `const validationResult = validateN8nWorkflow(n8nWorkflowJson, dynamicNodeValidators);`
- apps/frontend/src/components/PrivateRoute/index.jsx:4 (constant)
  `import validateSessionTokenForUser from "@/utils/session";`
- apps/frontend/src/components/PrivateRoute/index.jsx:20 (constant)
  `const validateSession = async () => {`
- apps/frontend/src/components/PrivateRoute/index.jsx:55 (constant)
  `const isValid = await validateSessionTokenForUser();`
- apps/frontend/src/components/PrivateRoute/index.jsx:67 (constant)
  `const isValid = await validateSessionTokenForUser();`
- apps/frontend/src/components/PrivateRoute/index.jsx:78 (constant)
  `validateSession();`
- apps/frontend/src/shared/features/settings/LLMConfigManager.tsx:6 (constant)
  `import { SUPPORTED_PROVIDERS, PROVIDER_DEFAULTS, validateProviderConfig } from '@/services/llm/providers';`
- apps/frontend/src/shared/features/settings/LLMConfigManager.tsx:22 (constant)
  `const isValid = await validateProviderConfig(config);`
- apps/frontend/src/shared/features/settings/LLMConfigManager.js:6 (constant)
  `import { SUPPORTED_PROVIDERS, PROVIDER_DEFAULTS, validateProviderConfig } from '@/services/llm/providers';`
- apps/frontend/src/shared/features/settings/LLMConfigManager.js:22 (constant)
  `const isValid = await validateProviderConfig(config);`
- apps/frontend/src/components/WorkflowEditor/utils/realtime-validation.ts:5 (constant)
  `validate(nodes, edges) {`
- apps/frontend/src/components/WorkflowEditor/utils/realtime-validation.js:5 (constant)
  `validate(nodes, edges) {`
- apps/frontend/src/components/WorkflowEditor/utils/realtime-validation.d.ts:4 (constant)
  `validate(nodes: any[], edges: any[]): string[];`
- apps/frontend/src/components/WorkflowEditor/utils/node-config-builder.ts:34 (constant)
  `static validateParameters(config, parameters) {`
- apps/frontend/src/components/WorkflowEditor/utils/node-config-builder.js:34 (constant)
  `static validateParameters(config, parameters) {`
- apps/frontend/src/components/WorkflowEditor/utils/node-config-builder.d.ts:25 (constant)
  `static validateParameters(config: NodeConfig, parameters: Record<string, any>): string[];`
- apps/frontend/src/components/WorkflowEditor/utils/converter.ts:36 (function)
  `export function validateWorkflow(workflow) {`
- apps/frontend/src/components/WorkflowEditor/utils/converter.js:36 (function)
  `export function validateWorkflow(workflow) {`
- apps/frontend/src/components/WorkflowEditor/utils/converter.d.ts:21 (constant)
  `export declare function validateWorkflow(workflow: N8nWorkflow): boolean;`
- apps/frontend/src/pages/FineTuning/Steps/Privacy/index.jsx:99 (constant)
  `for download URLs are pre-validated and signed by a minimal trust`

---

