
interface VisualizationOptions { format?: 'json' | 'html' | 'svg'
enum AnalysisType { DEPENDENCY = 'dependency'';
  SECURITY = 'security'';
  PERFORMANCE = 'performance'';
  CODE_QUALITY = 'code_quality'';
      this.logger.debug('Starting visualization'
      switch (options.format) { case 'json'
        case 'html'
        case 'svg'
            this.logger.warn('No visualization format specified, defaulting to json'
      this.logger.error(''Visualization failed: ''
        analysisType: ''
      'dependency'
      'Dependency Analysis'
      '
        type: 'text'
        data: sections.join('\n\n'
      'security'
      'Security Analysis'
      '
        type: 'text'
        data: sections.join('\n\n'
      'performance'
      'Performance Analysis'
      '
        type: 'text'
        data: sections.join('\n\n'
      'code-quality'
      'Code Quality Analysis'
      'This visualization shows code quality metrics and issues."
CPU Usage: ${metrics.cpuUsage !== undefined ? metrics.cpuUsage %": /N/A''}
Memory Usage: ${metrics.memoryUsage !== undefined ? metrics.memoryUsage MB''}
Throughput: ${metrics.throughput !== undefined ? metrics.throughput  req/s": /N/A''}
Error Rate: ${metrics.errorRate !== undefined ? metrics.errorRate %": /N/A''}
      return '';
      return '';
      return 'No dependencies found.'
  Dependencies: ${dep.dependencies?.join(', ') || 'None'}).join('')
    throw new Error('');