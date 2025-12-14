import { ValidationResult } from '../types';

/**
 * Input Validation and Sanitization Module
 * Provides comprehensive input validation and sanitization for all user inputs
 */
export class InputValidator {
	private maliciousPatterns: RegExp[];
	private contentFilters: Record<string, RegExp[]>;
	private rateLimitStore: Map<string, number[]>;

	constructor() {
		// Malicious patterns to detect
		this.maliciousPatterns = [
			/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, // Script tags
			/javascript:/gi, // JavaScript URLs
			/vbscript:/gi, // VBScript URLs
			/data:text\/html/gi, // Data URLs
			/on\w+\s*=/gi, // Event handlers
			/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, // Iframes
			/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, // Objects
			/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, // Embeds
			/expression\s*\(/gi, // CSS expressions
			/vbscript\s*:/gi, // VBScript
			/data\s*:\s*text/gi, // Data URLs
			/&#/gi, // HTML entities
			/%[0-9a-f]{2}/gi, // URL encoded characters
		];

		// Content filtering patterns
		this.contentFilters = {
			// SQL injection patterns
			sqlInjection: [
				/(?:\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b.*\b(select|from|where|into)\b)/gi,
				/(?:'|(\\x27)|(\\x2D\\x2D)|(\\\\x27)|(\\\\x2D\\x2D)|(;)|(\\x3B)|(\\x2D\\x2D)|(\\x23)|(\\x2F\\x2A)|(\\x2A\\x2F))/gi,
				/(?:\bor\b.*=.*\b(or|and)\b)/gi
			],
			// XSS patterns
			xss: [
				/<script[^>]*>.*?<\/script>/gi,
				/javascript:[^"']*/gi,
				/on\w+="[^"]*"/gi,
				/on\w+='[^']*'/gi,
				/<iframe[^>]*>.*?<\/iframe>/gi,
				/<object[^>]*>.*?<\/object>/gi
			],
			// Command injection patterns
			commandInjection: [
				/;\s*(rm|del|format|shutdown|reboot|halt)/gi,
				/\|\s*(rm|del|format|shutdown|reboot|halt)/gi,
				/&\s*(rm|del|format|shutdown|reboot|halt)/gi,
				/\$\([^)]*\)/gi, // Command substitution
				/`[^`]*`/gi // Backtick execution
			],
			// Path traversal patterns
			pathTraversal: [
				/\.\.[\/\\]/gi,
				/\/etc\/passwd/gi,
				/\/etc\/shadow/gi,
				/\/etc\/hosts/gi,
				/windows\\system32/gi,
				/program files/gi
			],
			// Sensitive data patterns
			sensitiveData: [
				/\b\d{4}[\s\-]?\d{4}[\s\-]?\d{4}[\s\-]?\d{4}\b/gi, // Credit cards
				/\b\d{3}[\s\-]?\d{2}[\s\-]?\d{4}\b/gi, // SSN
				/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/gi, // Emails (basic)
				/\b\d{10,15}\b/gi // Phone numbers
			]
		};

		// Rate limiting storage
		this.rateLimitStore = new Map();
	}

	/**
	 * Comprehensive input validation and sanitization
	 */
	validateAndSanitizeInput(input: string, type: string = 'general', options: any = {}): ValidationResult {
		const errors: string[] = [];
		let sanitized = input;

		// Basic validation
		if (!input || typeof input !== 'string') {
			errors.push('Input must be a non-empty string');
			return { isValid: false, errors, sanitized: '', riskLevel: 'high' };
		}

		// Length validation
		const maxLengths: Record<string, number> = {
			message: 10000,
			filename: 255,
			url: 2048,
			command: 1000,
			general: 5000
		};

		const maxLength = maxLengths[type] || maxLengths.general;
		if (input.length > maxLength) {
			errors.push(`Input exceeds maximum length of ${maxLength} characters`);
			sanitized = input.substring(0, maxLength);
		}

		// Type-specific validation and sanitization
		switch (type) {
			case 'message':
				sanitized = this._sanitizeMessage(sanitized);
				break;
			case 'filename':
				sanitized = this._sanitizeFilename(sanitized);
				break;
			case 'url':
				sanitized = this._sanitizeUrl(sanitized);
				break;
			case 'command':
				sanitized = this._sanitizeCommand(sanitized);
				break;
			case 'json':
				sanitized = this._sanitizeJson(sanitized);
				break;
			default:
				sanitized = this._sanitizeGeneral(sanitized);
		}

		// Content filtering
		const contentAnalysis = this._analyzeContent(sanitized, type);
		errors.push(...contentAnalysis.errors);

		// Risk assessment
		const riskLevel = this._assessRisk(sanitized, contentAnalysis, type);

		return {
			isValid: errors.length === 0,
			errors,
			sanitized,
			riskLevel,
			warnings: contentAnalysis.warnings
		};
	}

	/**
	 * Sanitize chat messages
	 */
	_sanitizeMessage(input: string): string {
		let sanitized = input;

		// Remove HTML tags
		sanitized = sanitized.replace(/<[^>]*>/g, '');

		// Remove null bytes and control characters (except newlines and tabs)
		sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '');

		// Normalize whitespace
		sanitized = sanitized.replace(/\s+/g, ' ').trim();

		return sanitized;
	}

	/**
	 * Sanitize filenames
	 */
	_sanitizeFilename(input: string): string {
		// Remove invalid characters for filenames
		let sanitized = input.replace(/[<>:"/\\|?*\x00-\x1F]/g, '');

		// Remove leading/trailing dots and spaces
		sanitized = sanitized.replace(/^[.\s]+|[.\s]+$/g, '');

		// Limit length
		if (sanitized.length > 255) {
			sanitized = sanitized.substring(0, 255);
		}

		return sanitized;
	}

	/**
	 * Sanitize URLs
	 */
	_sanitizeUrl(input: string): string {
		try {
			const url = new URL(input);

			// Only allow HTTP/HTTPS protocols
			if (!['http:', 'https:'].includes(url.protocol)) {
				throw new Error('Invalid protocol');
			}

			// Basic URL validation
			if (url.hostname.length > 253) {
				throw new Error('Hostname too long');
			}

			return url.toString();
		} catch {
			throw new Error('Invalid URL format');
		}
	}

	/**
	 * Sanitize commands
	 */
	_sanitizeCommand(input: string): string {
		// Remove dangerous characters and patterns
		let sanitized = input.replace(/[;&|`$(){}[\]<>]/g, '');

		// Remove command chaining
		sanitized = sanitized.replace(/\s+(&&|\|\||;)\s+/g, ' ');

		return sanitized.trim();
	}

	/**
	 * Sanitize JSON input
	 */
	_sanitizeJson(input: string): string {
		try {
			// Parse and re-stringify to ensure valid JSON
			const parsed = JSON.parse(input);
			return JSON.stringify(parsed);
		} catch {
			throw new Error('Invalid JSON format');
		}
	}

	/**
	 * General sanitization
	 */
	_sanitizeGeneral(input: string): string {
		// Remove control characters
		let sanitized = input.replace(/[\x00-\x1F\x7F-\x9F]/g, '');

		// Normalize whitespace
		sanitized = sanitized.replace(/\s+/g, ' ').trim();

		return sanitized;
	}

	/**
	 * Analyze content for malicious patterns
	 */
	_analyzeContent(input: string, type: string): { errors: string[]; warnings: string[] } {
		const errors: string[] = [];
		const warnings: string[] = [];

		// Check for malicious patterns
		for (const pattern of this.maliciousPatterns) {
			if (pattern.test(input)) {
				errors.push('Malicious content detected');
				break;
			}
		}

		// Type-specific content filtering
		for (const [category, patterns] of Object.entries(this.contentFilters)) {
			for (const pattern of patterns) {
				if (pattern.test(input)) {
					if (category === 'sensitiveData') {
						warnings.push(`${category} pattern detected`);
					} else {
						errors.push(`${category} pattern detected`);
					}
				}
			}
		}

		// Additional checks based on type
		if (type === 'message') {
			// Check for excessive special characters
			const specialChars = input.match(/[^a-zA-Z0-9\s]/g);
			if (specialChars && specialChars.length > input.length * 0.3) {
				warnings.push('High ratio of special characters detected');
			}

			// Check for repetitive patterns
			if (this._hasRepetitivePatterns(input)) {
				warnings.push('Repetitive patterns detected');
			}
		}

		return { errors, warnings };
	}

	/**
	 * Assess risk level of input
	 */
	_assessRisk(input: string, analysis: { errors: string[]; warnings: string[] }, type: string): 'low' | 'medium' | 'high' | 'unknown' {
		let riskScore = 0;

		// Base risk from errors
		riskScore += analysis.errors.length * 10;

		// Risk from warnings
		riskScore += analysis.warnings.length * 2;

		// Length-based risk
		if (input.length > 1000) riskScore += 2;
		if (input.length > 5000) riskScore += 5;

		// Type-specific risk assessment
		switch (type) {
			case 'command':
				riskScore += 5; // Commands are inherently riskier
				break;
			case 'url':
				riskScore += 3; // URLs can be dangerous
				break;
			case 'json':
				riskScore += 2; // JSON parsing can be risky
				break;
		}

		// Determine risk level
		if (riskScore >= 15) return 'high';
		if (riskScore >= 7) return 'medium';
		return 'low';
	}

	/**
	 * Check for repetitive patterns
	 */
	_hasRepetitivePatterns(input: string): boolean {
		// Check for repeated characters
		if (/(.)\1{10,}/.test(input)) return true;

		// Check for repeated words
		const words = input.toLowerCase().split(/\s+/);
		const wordCounts: Record<string, number> = {};
		for (const word of words) {
			if (word.length > 3) {
				wordCounts[word] = (wordCounts[word] || 0) + 1;
				if (wordCounts[word] > 5) return true;
			}
		}

		return false;
	}

	/**
	 * Rate limiting check
	 */
	checkRateLimit(identifier: string, action: string, limits: any): { allowed: boolean; remainingTime?: number; remainingRequests?: number } {
		const key = `${identifier}:${action}`;
		const now = Date.now();

		if (!this.rateLimitStore.has(key)) {
			this.rateLimitStore.set(key, []);
		}

		const timestamps = this.rateLimitStore.get(key)!;

		// Remove old timestamps outside the window
		const windowStart = now - limits.window;
		const validTimestamps = timestamps.filter((ts: number) => ts > windowStart);

		// Check if under limit
		if (validTimestamps.length >= limits.max) {
			return { allowed: false, remainingTime: limits.window - (now - validTimestamps[0]) };
		}

		// Add current timestamp
		validTimestamps.push(now);
		this.rateLimitStore.set(key, validTimestamps);

		return { allowed: true, remainingRequests: limits.max - validTimestamps.length };
	}

	/**
	 * Clean up old rate limit data
	 */
	cleanupRateLimits(): void {
		const now = Date.now();
		const maxAge = 24 * 60 * 60 * 1000; // 24 hours

		for (const [key, timestamps] of this.rateLimitStore.entries()) {
			const validTimestamps = timestamps.filter((ts: number) => now - ts < maxAge);
			if (validTimestamps.length === 0) {
				this.rateLimitStore.delete(key);
			} else {
				this.rateLimitStore.set(key, validTimestamps);
			}
		}
	}

	/**
	 * Validate file content for security
	 */
	validateFileContent(content: string, filename: string): ValidationResult {
		const errors: string[] = [];
		const warnings: string[] = [];

		// Check file size
		if (content.length > 10 * 1024 * 1024) { // 10MB limit
			errors.push('File too large');
		}

		// Check for executable content in non-executable files
		const ext = filename.split('.').pop()?.toLowerCase();
		if (['txt', 'md', 'json', 'xml', 'csv'].includes(ext || '')) {
			if (content.includes('#!/') || content.includes('exec(') || content.includes('eval(')) {
				warnings.push('Executable content detected in text file');
			}
		}

		// Check for malicious patterns in content
		const analysis = this._analyzeContent(content, 'file');
		errors.push(...analysis.errors);
		warnings.push(...analysis.warnings);

		return {
			isValid: errors.length === 0,
			errors,
			warnings,
			sanitized: content.substring(0, 10000), // Truncate large files
			riskLevel: this._assessRisk(content, { errors, warnings }, 'file')
		};
	}

	/**
	 * Get security statistics
	 */
	getSecurityStats(): any {
		return {
			rateLimitEntries: this.rateLimitStore.size,
			maliciousPatterns: this.maliciousPatterns.length,
			contentFilters: Object.keys(this.contentFilters).length,
			lastCleanup: new Date().toISOString()
		};
	}

	/**
	 * Configure validator settings
	 */
	configure(options: { strictMode?: boolean; maxInputLength?: number }): void {
		// Configuration options can be stored if needed
		console.log('InputValidator configured with:', options);
	}
}