export {}
import resource_manager_1 from './resource_manager.js';
import resource_1 from './types/resource.js';
async function main(): any {
    const manager = new resource_manager_1.ResourceManager(resource_1.ModelType.CLAUDE_3_OPUS);
    
    );
    const prompt = 'What is the meaning of life?';
    const metrics = manager.estimateCost(prompt);

    }`);

    );
    const longText = 'This is a sample text. '.repeat(1000);
    const [fits, tokens] = manager.checkContextFit(longText);

    if (!fits) {
        const truncated = manager.truncateToFit(longText);
        
        const truncatedTokens = manager.checkContextFit(truncated)[1];
        
    }

    );
    const startTime = Date.now();
    await new Promise(resolve => setTimeout(resolve, 100));
    const firstTokenTime = Date.now();
    await new Promise(resolve => setTimeout(resolve, 400));
    const endTime = Date.now();
    const latency = manager.measureLatency({
        startTime,
        firstTokenTime,
        endTime,
        totalTokens: 100
    });
    
    }ms`);
    }`);
    }ms`);

    );
    manager.updateUsage(100);
    const usage = manager.getUsage();

    }`);
    
}
main().catch(console.error);
export {};
//# sourceMappingURL=resource_examples.js.map