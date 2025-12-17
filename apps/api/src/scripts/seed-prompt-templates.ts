import { PrismaService } from '@the-new-fuse/database';

const defaultSnippets = [
  {
    name: 'System Role',
    content: 'You are a helpful AI assistant specialized in {{domain}}.',
    type: 'system',
    category: 'System',
    tags: ['role', 'system'],
    usageCount: 245,
    description: 'Basic system role with domain specialization',
    isStarred: true
  },
  {
    name: 'Context Block',
    content: '# Context\n{{context_description}}\n\n{{context_data}}',
    type: 'user',
    category: 'Context',
    tags: ['context', 'input'],
    usageCount: 189,
    description: 'Structured context injection block'
  },
  {
    name: 'Task Definition',
    content: '# Task\n{{task_description}}\n\n## Requirements\n{{requirements}}',
    type: 'user',
    category: 'Instructions',
    tags: ['task', 'requirements'],
    usageCount: 156,
    description: 'Structured task definition with requirements'
  },
  {
    name: 'Output Format',
    content: '# Output Format\nRespond in the following structure:\n{{format_template}}',
    type: 'user',
    category: 'Output',
    tags: ['format', 'structure'],
    usageCount: 134,
    description: 'Output format specification'
  },
  {
    name: 'Function Call',
    content: '{{function_name}}({{parameters}})',
    type: 'function',
    category: 'Functions',
    tags: ['function', 'call'],
    usageCount: 98,
    description: 'Function invocation template'
  },
  {
    name: 'Summary Section',
    content: '# Summary\n{{summary_content}}',
    type: 'summary',
    category: 'Content',
    tags: ['summary', 'content'],
    usageCount: 87,
    description: 'Content summary block'
  }
];

const defaultTemplateData = {
  name: 'General Assistant Template',
  description: 'A versatile template for general AI assistance tasks',
  category: 'General',
  tags: ['general', 'assistant', 'help'],
  isPublic: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const defaultVersionData = {
    version: 1,
    label: 'production',
    content: `You are a helpful AI assistant specialized in {{domain}}.

# Task
{{task_description}}

## Requirements
{{requirements}}

# Context
{{context_description}}

{{context_data}}

# Output Format
Respond in the following structure:
{{format_template}}`,
    variables: {
        domain: 'general assistance',
        task_description: 'Help the user with their request',
        requirements: '- Be helpful and accurate\n- Provide clear explanations\n- Ask for clarification if needed',
        context_description: 'User context and background information',
        context_data: '',
        format_template: 'Provide a clear, structured response'
    },
    isActive: true,
    changelog: 'Initial template version'
};

async function seed() {
  let prisma: PrismaService | undefined;
  try {
    console.log('Initializing Prisma Service...');
    // PrismaService constructor handles adapter setup automatically
    prisma = new PrismaService();

    console.log('Connecting to database...');
    // Ensure connection
    await prisma.$connect();

    console.log('Seeding Prompt Templates...');

    // Seed Snippets
    console.log('Seeding Snippets...');
    for (const snippet of defaultSnippets) {
        // Check if exists
        const existing = await prisma.promptSnippet.findFirst({
            where: { name: snippet.name }
        });

        if (!existing) {
             await prisma.promptSnippet.create({
                data: snippet
            });
            console.log(`Created snippet: ${snippet.name}`);
        } else {
            console.log(`Snippet already exists: ${snippet.name}`);
        }
    }

    // Seed Template
    console.log('Seeding Template...');
    const existingTemplate = await prisma.promptTemplate.findFirst({
        where: { name: defaultTemplateData.name }
    });

    if (!existingTemplate) {
        const template = await prisma.promptTemplate.create({
            data: {
                ...defaultTemplateData,
                versions: {
                    create: defaultVersionData
                }
            },
            include: { versions: true }
        });

        // Update current version ID
        if (template.versions.length > 0) {
            await prisma.promptTemplate.update({
                where: { id: template.id },
                data: { currentVersionId: template.versions[0].id }
            });
        }

        console.log(`Created template: ${template.name} (ID: ${template.id})`);
    } else {
        console.log(`Template already exists: ${defaultTemplateData.name}`);
    }

    console.log('Seeding complete!');
  } catch (error) {
    console.error('Seeding failed:', error);
  } finally {
    if (prisma) {
        await prisma.$disconnect();
    }
  }
}

seed();
