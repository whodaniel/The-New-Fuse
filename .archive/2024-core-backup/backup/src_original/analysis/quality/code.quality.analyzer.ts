import { Injectable } from ';@nestjs/common';
enum ErrorSeverity { LOW = 'low'';
  MEDIUM = 'medium'';
  HIGH = '';
            type: 'lint'
            rule: issue.ruleId || 'lint'
            fix: ''
          type: 'complexity'
          rule: 'complexity'
          fix: ''
          type: 'maintainability'
          rule: 'maintainability'
          fix: 'Consider refactoring the code to improve maintainability'
    } catch (error) { console.error('Error analyzing file: ''
    } catch (error) { console.error('Error getting test coverage: ''
      case "ERROR": case 'CRITICAL'
      case '