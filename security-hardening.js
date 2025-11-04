/**
 * Security Hardening Utilities
 * 
 * This file provides utilities for preventing SQL injection and other security vulnerabilities.
 * All database queries should use these utilities to ensure proper input sanitization.
 */

class SecurityUtils {
  /**
   * Validates and sanitizes string input to prevent injection attacks
   */
  static sanitizeString(input, maxLength = 1000) {
    if (typeof input !== 'string') {
      throw new Error('Input must be a string');
    }
    
    if (input.length > maxLength) {
      throw new Error(`Input exceeds maximum length of ${maxLength} characters`);
    }
    
    // Remove or escape dangerous characters
    const dangerousChars = /[<>'"&\\]/g;
    const sanitized = input.replace(dangerousChars, (match) => {
      const escapeMap = {
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '&': '&amp;',
        '\\': '\\\\'
      };
      return escapeMap[match] || match;
    });
    
    return sanitized;
  }
  
  /**
   * Validates SQL identifiers (table names, column names)
   */
  static validateSqlIdentifier(identifier) {
    if (typeof identifier !== 'string') {
      throw new Error('SQL identifier must be a string');
    }
    
    // Only allow alphanumeric and underscore, must start with letter or underscore
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(identifier)) {
      throw new Error('Invalid SQL identifier format');
    }
    
    return identifier;
  }
  
  /**
   * Creates a safe parameterized query string
   */
  static buildSafeQuery(baseQuery, params = {}) {
    let query = baseQuery;
    const paramValues = [];
    let paramIndex = 1;
    
    // Replace placeholders with parameterized values
    query = query.replace(/\?/g, () => {
      paramValues.push(params[`param${paramIndex}`] || null);
      return `$${paramIndex++}`;
    });
    
    return { query, params: paramValues };
  }
  
  /**
   * Validates user input for database queries
   */
  static validateDbInput(input, options = {}) {
    const {
      maxLength = 1000,
      allowEmpty = false,
      allowedPattern = null,
      forbiddenPatterns = [
        /['";]/,           // SQL injection characters
        /--/,              // SQL comments
        /\/\*/,            // SQL block comments
        /union\s+select/i, // UNION SELECT
        /drop\s+table/i,   // DROP TABLE
        /delete\s+from/i,  // DELETE FROM
        /update\s+set/i,   // UPDATE SET
        /insert\s+into/i,  // INSERT INTO
        /create\s+table/i, // CREATE TABLE
        /alter\s+table/i,  // ALTER TABLE
        /exec\s*\(/i,      // EXEC
        /xp_/,             // SQL Server extended procedures
        /sp_/,             // SQL Server stored procedures
      ]
    } = options;
    
    if (typeof input !== 'string') {
      throw new Error('Input must be a string');
    }
    
    if (!allowEmpty && (!input || input.trim() === '')) {
      throw new Error('Input cannot be empty');
    }
    
    if (input.length > maxLength) {
      throw new Error(`Input exceeds maximum length of ${maxLength} characters`);
    }
    
    // Check for forbidden patterns
    for (const pattern of forbiddenPatterns) {
      if (pattern.test(input)) {
        throw new Error(`Input contains forbidden pattern: ${pattern.source}`);
      }
    }
    
    // Check for allowed pattern if specified
    if (allowedPattern && !allowedPattern.test(input)) {
      throw new Error('Input does not match required pattern');
    }
    
    return input.trim();
  }
  
  /**
   * Validates and sanitizes code input to prevent code injection
   */
  static validateCodeInput(code, language = 'javascript', maxLength = 5000) {
    if (typeof code !== 'string') {
      throw new Error('Code must be a string');
    }
    
    if (code.length > maxLength) {
      throw new Error(`Code exceeds maximum length of ${maxLength} characters`);
    }
    
    // Check for dangerous patterns based on language
    const dangerousPatterns = {
      javascript: [
        /require\s*\(/,           // require()
        /import\s+/,              // import statements
        /eval\s*\(/,              // eval()
        /Function\s*\(/,          // Function constructor
        /process\./,              // process object
        /global\./,               // global object
        /window\./,               // window object
        /document\./,             // document object
        /XMLHttpRequest/,         // XHR
        /fetch\s*\(/,             // fetch API
        /setTimeout\s*\(/,        // setTimeout
        /setInterval\s*\(/,       // setInterval
        /constructor/,            // constructor
        /__proto__/,              // __proto__
        /prototype/,              // prototype
        /class\s+/,               // class declarations
        /fs\./,                   // File system
        /child_process/,          // Child process
        /exec\s*\(/,              // exec()
        /spawn\s*\(/,             // spawn()
      ]
    };
    
    const patterns = dangerousPatterns[language.toLowerCase()] || [];
    for (const pattern of patterns) {
      if (pattern.test(code)) {
        throw new Error(`Code contains potentially dangerous pattern: ${pattern.source}`);
      }
    }
    
    return code;
  }
  
  /**
   * Creates a safe database query with proper parameterization
   */
  static createSafeQuery(queryType, tableName, conditions = {}, options = {}) {
    // Validate query type
    const allowedTypes = ['SELECT', 'INSERT', 'UPDATE', 'DELETE'];
    if (!allowedTypes.includes(queryType.toUpperCase())) {
      throw new Error('Invalid query type');
    }
    
    // Validate table name
    const safeTableName = this.validateSqlIdentifier(tableName);
    
    // Build WHERE clause safely
    let whereClause = '';
    const params = [];
    let paramIndex = 1;
    
    if (Object.keys(conditions).length > 0) {
      const whereConditions = [];
      for (const [key, value] of Object.entries(conditions)) {
        const safeColumn = this.validateSqlIdentifier(key);
        whereConditions.push(`${safeColumn} = $${paramIndex}`);
        params.push(value);
        paramIndex++;
      }
      whereClause = 'WHERE ' + whereConditions.join(' AND ');
    }
    
    // Build the complete query
    let query = '';
    switch (queryType.toUpperCase()) {
      case 'SELECT':
        const selectFields = options.fields || '*';
        query = `SELECT ${selectFields} FROM ${safeTableName} ${whereClause}`;
        if (options.orderBy) {
          const orderField = this.validateSqlIdentifier(options.orderBy);
          query += ` ORDER BY ${orderField} ${options.orderDirection || 'ASC'}`;
        }
        if (options.limit) {
          query += ` LIMIT ${parseInt(options.limit)}`;
        }
        break;
        
      case 'INSERT':
        if (!options.data) {
          throw new Error('Insert operation requires data');
        }
        const columns = Object.keys(options.data).map(col => this.validateSqlIdentifier(col));
        const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
        const values = Object.values(options.data);
        query = `INSERT INTO ${safeTableName} (${columns.join(', ')}) VALUES (${placeholders})`;
        params.push(...values);
        break;
        
      case 'UPDATE':
        if (!options.data) {
          throw new Error('Update operation requires data');
        }
        const setColumns = Object.keys(options.data).map(col => {
          const safeCol = this.validateSqlIdentifier(col);
          return `${safeCol} = $${paramIndex++}`;
        }).join(', ');
        query = `UPDATE ${safeTableName} SET ${setColumns} ${whereClause}`;
        params.push(...Object.values(options.data));
        break;
        
      case 'DELETE':
        query = `DELETE FROM ${safeTableName} ${whereClause}`;
        break;
    }
    
    return { query, params };
  }
}

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SecurityUtils;
}

// For browser environment
if (typeof window !== 'undefined') {
  window.SecurityUtils = SecurityUtils;
}

export default SecurityUtils;