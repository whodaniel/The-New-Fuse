import { Injectable } from '@nestjs/common';
import { Logger } from /../../utils/logger'';
 * <invoke name= 'placeholder';
 * <parameter name= 'placeholder';
    let xmlString = <function_calls>['']
    xmlString += `<invoke name='${functionName}`'``;
      xmlString += `<parameter name=`${placeholder}```;
    xmlString += </invoke>['']
        priority: ''
    const functionNameMatch = xmlString.match(/<invoke name='([^']+)';
      throw new Error('');
    const parameterRegex = /<parameter name='([^']+)';
      if ((paramValue.startsWith('{') && paramValue.endsWith('}'
          (paramValue.startsWith('placeholder')
      throw new Error('');
    if ((contentString.startsWith('{') && contentString.endsWith('}'
        (contentString.startsWith('placeholder')