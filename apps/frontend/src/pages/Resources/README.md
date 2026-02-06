# Resources Dashboard

A comprehensive, beautiful frontend dashboard for browsing and using Claude
skills, n8n workflows, and agent templates.

## Overview

The Resources Dashboard is a marketplace-style interface that allows users to
discover, preview, and use various resources including:

- **Claude Skills**: MCP tools, prompts, workflows, and integrations
- **n8n Workflows**: Pre-built automation workflows
- **Agent Templates**: Pre-configured agent templates for different use cases

## Features

### Main Dashboard (`ResourcesDashboard.tsx`)

- **Stats Overview**: Display total resources, skills, workflows, and downloads
- **Tabbed Interface**: Easy navigation between different resource types
- **Animated Transitions**: Smooth animations using Framer Motion
- **Dark Mode Support**: Full support for light and dark themes
- **Responsive Design**: Works on all screen sizes

### Skills Browser (`SkillsBrowser.tsx`)

- **Search & Filters**: Search by name, description, tags
- **Category Filtering**: Filter by development, productivity, communication,
  etc.
- **Sorting Options**: Sort by popularity, recent updates, or rating
- **Skill Details Modal**: View full skill information including:
  - Capabilities
  - Model compatibility
  - Examples with input/output
  - Documentation links
- **Actions**:
  - Install skill directly
  - Add to favorites
  - Share with link
  - View detailed documentation

### Workflow Browser (`WorkflowBrowser.tsx`)

- **Advanced Filtering**: Filter by complexity (simple, medium, complex)
- **Integration Preview**: See which services are integrated
- **Node Count Display**: Shows workflow complexity
- **Trigger & Action Info**: Preview workflow triggers and actions
- **Actions**:
  - Import to n8n
  - Add to favorites
  - Share workflow
  - View full details

### Agent Templates Browser (`AgentTemplatesBrowser.tsx`)

- **Template Types**: Chat, Task, Analysis, Automation agents
- **Model Information**: See which Claude model is used
- **Capability Preview**: View agent capabilities
- **Skill Requirements**: See required and optional skills
- **System Prompt Preview**: Preview the agent's system prompt
- **Actions**:
  - Create agent from template
  - Customize configuration
  - Add to favorites
  - Share template

### Unified Search (`ResourceSearch.tsx`)

- **Cross-Resource Search**: Search across all resource types
- **Advanced Filters**:
  - Resource type (skills, workflows, templates)
  - Category filtering
  - Featured resources
  - Multiple sort options
- **View Modes**:
  - Grid view for visual browsing
  - List view for detailed information
- **Smart Filtering**: Real-time filtering with immediate results

## API Integration

The dashboard integrates with the backend through `resources.service.ts`:

```typescript
// Fetch resources
resourcesService.getSkills();
resourcesService.getWorkflows();
resourcesService.getTemplates();
resourcesService.getAllResources();

// Search
resourcesService.searchResources(filter);

// Actions
resourcesService.executeSkill(skillId);
resourcesService.importWorkflow(workflowId);
resourcesService.createAgentFromTemplate(templateId);
resourcesService.toggleFavorite(resourceId, userId);
resourcesService.shareResource(share);
```

### Mock Data

The service includes comprehensive mock data for development and testing:

- 4 Claude Skills with full metadata
- 3 n8n Workflows with integration details
- 3 Agent Templates with configurations

## Types

All types are defined in `/types/resources.ts`:

```typescript
- Resource (base type)
- ClaudeSkill
- N8NWorkflow
- AgentTemplate
- ResourceFilter
- ResourceStats
- FavoriteResource
- ResourceShare
```

## Routing

The dashboard is accessible at `/resources` with the route defined in
`ComprehensiveRouter.tsx`:

```tsx
<Route path="/resources" element={<ResourcesDashboard />} />
```

## Navigation

The Resources link is available in the main navigation (`SmartNavigation.tsx`):

- Public navigation: "Resources" link
- Authenticated navigation: "📦 Resources" button with gradient styling

## Styling

The dashboard uses:

- **Tailwind CSS**: For utility-first styling
- **Framer Motion**: For smooth animations and transitions
- **Lucide React (react-icons/fi)**: For consistent iconography
- **Custom Gradients**: Beautiful gradient backgrounds and buttons
- **Responsive Grid**: Adapts from 1 to 3 columns based on screen size

## Component Structure

```
Resources/
├── ResourcesDashboard.tsx    # Main dashboard with tabs
├── SkillsBrowser.tsx        # Browse Claude skills
├── WorkflowBrowser.tsx      # Browse n8n workflows
├── AgentTemplatesBrowser.tsx # Browse agent templates
├── ResourceSearch.tsx       # Unified search
├── index.tsx               # Exports
└── README.md               # This file
```

## Usage

### Basic Usage

```tsx
import { ResourcesDashboard } from './pages/Resources';

// In your routing
<Route path="/resources" element={<ResourcesDashboard />} />;
```

### With React Query

The components use `@tanstack/react-query` for data fetching:

```tsx
const { data: skills = [], isLoading } = useQuery({
  queryKey: ['skills'],
  queryFn: () => resourcesService.getSkills(),
});
```

## Customization

### Adding New Resource Types

1. Add the type to `types/resources.ts`
2. Create a new browser component (e.g., `ToolsBrowser.tsx`)
3. Add API methods to `resources.service.ts`
4. Add tab to `ResourcesDashboard.tsx`
5. Update `ResourceSearch.tsx` filters

### Styling

All components use Tailwind CSS classes. To customize:

- Colors: Update gradient classes (e.g., `from-blue-600 to-purple-600`)
- Spacing: Adjust padding and margin classes
- Animations: Modify Framer Motion props

## Performance

- **Lazy Loading**: Components are lazy loaded in the router
- **React Query Caching**: Automatic caching and refetching
- **Optimized Renders**: useMemo for filtered results
- **Animated Lists**: AnimatePresence for smooth list transitions

## Future Enhancements

- [ ] Favorites management page
- [ ] Resource ratings and reviews
- [ ] Upload custom resources
- [ ] Resource versioning
- [ ] Collaboration features
- [ ] Resource analytics
- [ ] WebSocket real-time updates
- [ ] Resource dependencies visualization
- [ ] Bulk actions (install multiple, export collection)
- [ ] Resource collections/bundles

## Testing

To test the Resources Dashboard:

1. Navigate to `/resources`
2. Explore different tabs
3. Search and filter resources
4. Click on resources to view details
5. Try actions (install, import, create)

## Troubleshooting

### Resources not loading

- Check API connection in `resources.service.ts`
- Verify mock data is being returned
- Check browser console for errors

### Styling issues

- Ensure Tailwind CSS is configured
- Check that all utility classes are available
- Verify dark mode classes are working

### Animation issues

- Ensure Framer Motion is installed: `pnpm add framer-motion`
- Check for conflicting CSS

## Contributing

When adding new features:

1. Follow the existing component patterns
2. Update types in `resources.ts`
3. Add API methods to `resources.service.ts`
4. Update this README
5. Add mock data for testing
6. Test on mobile devices

## License

Part of The New Fuse project.
