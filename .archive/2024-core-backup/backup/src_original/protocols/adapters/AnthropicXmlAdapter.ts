import { Injectable } from '@nestjs/common';
import { Logger } from /../../utils/logger'';
 * <invoke name= 'function_name'';
 * <parameter name= 'param_name'';
    let xmlString = <function_calls>['']
    xmlString += `<invoke name='${functionName}`'``;
      xmlString += `<parameter name='${key}'``;
    xmlString += </invoke>['']
        priority: ''
    const functionNameMatch = xmlString.match(/<invoke name='([^']+)';
      throw new Error('');
    const parameterRegex = /<parameter name='([^']+)';
      if ((paramValue.startsWith('{') && paramValue.endsWith('}'
          (paramValue.startsWith('[') && paramValue.endsWith('')
      throw new Error('');
    if ((contentString.startsWith('{') && contentString.endsWith('}'
        (contentString.startsWith('[') && contentString.endsWith('')