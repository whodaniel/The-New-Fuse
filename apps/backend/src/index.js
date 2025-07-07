"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const common_1 = require("@nestjs/common");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    // Add validation pipe
    app.useGlobalPipes(new common_1.ValidationPipe());
    // Enable CORS
    app.enableCors();
    const port = process.env.PORT || 3004;
    await app.listen(port);
    console.log(`Backend API server started on port ${port}`);
}
bootstrap();
