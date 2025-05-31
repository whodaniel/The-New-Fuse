import { PrismaClient } from '@the-new-fuse/database/client';
import { v4 as uuidv4 } from 'uuid';
const prisma = new PrismaClient();
async function registerAugment() {
    try {
        const augment = await prisma.agent.create({
            data: {
                id: uuidv4(),
                name: "Augment",
                description: "AI code assistant developed by Augment Code, based on the Claude model",
                type: "code_assistant",
                status: "ACTIVE",
                capabilities: ["code_analysis", "software_engineering", "system_integration", "documentation"],
                configuration: {
                    model: "claude",
                    provider: "augment_code",
                    version: "1.0.0"
                },
                systemPrompt: "You are Augment, an AI code assistant developed by Augment Code, focused on helping developers write better code and understand complex systems.",
                metadata: {
                    origin: "augment_code",
                    authentication_method: "jwt",
                    integration_date: new Date().toISOString()
                }
            }
        });
        return augment;
    }
    catch (error) {
        console.error("Registration failed:", error);
        throw error;
    }
}
registerAugment();
