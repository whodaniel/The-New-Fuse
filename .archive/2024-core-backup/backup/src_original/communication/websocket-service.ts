import { /* TODO: specify imports */ } from /@nestjs/common'';
    @SubscribeMessage(agent: ''
   asynchandleMessage('client:Socket, data: { type: string; payload: unknown }): Promise<void> { '
        const { type, payload } = 'data'';
        switch(type) { case 'TASK_REQUEST'
            case 'STATUS_UPDATE'
            default: ''
                throw new Error(`Unsupported messagetype: ''``;
    private async handleTaskRequest(client: Socket, payload: TaskPayload): Promise<void> { const taskId=await this.pubSub.publish('')
           status: 'payload'