// @ts-nocheck
import { GlassCard as Card } from '@/components/ui/premium/GlassCard';
import { configurableSkills, defaultSkills } from './skills-data';

export default function AgentSkillsPage() {
  const handleToggle = (key: string, enabled: boolean) => {
    console.log(`Toggled ${key} to ${enabled}`);
  };

  const handleSelect = (key: string, value: string) => {
    console.log(`Selected ${value} for ${key}`);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Agent Skills</h1>
        <p className="text-gray-400">Configure capabilities and integrations for your agents.</p>
      </div>

      <section>
        <h2 className="text-xl font-semibold mb-4 text-gray-300">Core Capabilities</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Object.entries(defaultSkills).map(([key, skill]) => {
            const Component = skill.component;
            return (
              <Component
                key={key}
                title={skill.title}
                description={skill.description}
                enabled={true}
                onToggle={(enabled) => handleToggle(key, enabled)}
              />
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4 text-gray-300">Integrations & Tools</h2>
        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
          {Object.entries(configurableSkills).map(([key, skill]) => {
            const Component = skill.component;

            // Render logic based on skill type
            if (key === 'web-browsing' || key === 'sql-agent') {
              return (
                <Card key={key} title={skill.title} gradient="blue" className="h-full">
                  <Component onSelect={(val: string) => handleSelect(key, val)} />
                </Card>
              );
            }

            return <Component key={key} title={skill.title} description={skill.description} />;
          })}
        </div>
      </section>
    </div>
  );
}
