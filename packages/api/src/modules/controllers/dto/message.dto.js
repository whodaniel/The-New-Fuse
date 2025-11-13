/**
 * DTO class for Message model to be used with Swagger
 */
export class MessageDto {
    id = '';
    content = '';
    role = '';
    userId = '';
    fromAgentId;
    toAgentId;
    createdAt = new Date();
}
//# sourceMappingURL=message.dto.js.map