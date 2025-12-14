# Workflow Builder - Quick Start Guide

Get started with The New Fuse Workflow Builder in 5 minutes!

## Quick Start

### 1. Access the Builder

Navigate to:

```
http://localhost:3000/workflows/builder
```

### 2. Create Your First Workflow (Code Review Example)

**Step 1**: Click "Add Node" button

**Step 2**: Add "Code Review Agent" node from Agents tab

**Step 3**: Add "Human Approval" node from Human tab

**Step 4**: Connect the nodes by dragging from bottom of first node to top of
second

**Step 5**: Click "Execute" to run the workflow

**Step 6**: Watch real-time progress in the execution log

### 3. Use a Template

**Step 1**: Click "Import Template" (coming soon) or manually add nodes

**Step 2**: Select "Code Review Workflow" template

**Step 3**: Customize agent assignments

**Step 4**: Save with a custom name

**Step 5**: Execute!

## Sample Workflows to Try

### 1. Simple Code Review (5 min)

```
Read Code → Review Code → Human Approval
```

**Time**: ~10 minutes **Difficulty**: Beginner

### 2. Parallel Research (15 min)

```
Parse Topic → [Research 1, Research 2, Research 3] → Combine → Report
```

**Time**: ~30 minutes **Difficulty**: Intermediate

### 3. Auto Deploy (30 min)

```
Analyze → Suggest → Approve → Implement → Test → Deploy/Rollback
```

**Time**: ~45 minutes **Difficulty**: Advanced

## Key Shortcuts

- **Ctrl/Cmd + S**: Save workflow
- **Delete**: Remove selected node
- **Ctrl/Cmd + Z**: Undo (canvas)
- **Space**: Fit view
- **Mouse Wheel**: Zoom in/out

## Tips

1. **Start Simple**: Build basic workflows first, add complexity later
2. **Name Everything**: Use descriptive names for nodes
3. **Test Often**: Execute workflows frequently to catch issues early
4. **Use Templates**: Start with pre-built templates and customize
5. **Monitor Logs**: Check execution logs for debugging

## Common Patterns

### Pattern 1: Linear Flow

```
Node 1 → Node 2 → Node 3
```

Use for: Sequential processing, pipelines

### Pattern 2: Conditional Branch

```
Node 1 → Condition → True: Node 2
                   → False: Node 3
```

Use for: Decision-making, error handling

### Pattern 3: Parallel Processing

```
Node 1 → Parallel → [Node 2, Node 3, Node 4] → Merge
```

Use for: Independent tasks, research, data processing

### Pattern 4: Approval Gate

```
Node 1 → Node 2 → Human Approval → Node 3
```

Use for: Critical operations, compliance, quality control

## Next Steps

1. **Read Full Guide**: `/docs/WORKFLOW_BUILDER_GUIDE.md`
2. **Explore Templates**: Check out 5 pre-built workflows
3. **Join Community**: Discord, GitHub Discussions
4. **Build Custom Workflows**: Create workflows for your use case

## Need Help?

- **Documentation**: `/docs/WORKFLOW_BUILDER_GUIDE.md`
- **Examples**: `/docs/WORKFLOW_BUILDER_ENHANCEMENTS.md`
- **Support**: support@thenewfuse.com
- **Discord**: [Join our community](https://discord.gg/thenewfuse)

---

**Happy Building!** 🚀
