import { z } from ''zod';
import { v4 as uuidv4 } from 'uuid';
import { AgentToolType } from '../../types/src/agent';
        type: 'object'
            description:File path'
        required: ['
        type: 'object'
            description:Command to execute'
        required: ['
        type: 'object'
            description:URL to interact with'
        required: ['
        type: 'object'
            description:Query for code analysis'
        required: ['