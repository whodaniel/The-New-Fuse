---
description: "Use Claude's Excel skill for spreadsheet creation, editing, and analysis"
category: "claude-skills"
---

Activate Claude's XLSX skill for creating, editing, and analyzing Excel spreadsheets with support for formulas, formatting, and data analysis.

**Skill**: xlsx (from Anthropic's skills repository)

**Capabilities**:
- Create and edit Excel spreadsheets
- Apply formulas and formatting
- Data analysis and visualization
- Pivot tables and charts
- Conditional formatting
- Multiple worksheets management

**Example Usage**:
```
/skill-xlsx create a sales report with data from sales.csv
/skill-xlsx add a pivot table to analyze revenue by region
/skill-xlsx apply conditional formatting to highlight values > 1000
/skill-xlsx create a chart showing monthly trends
```

**Parameters**: $ARGUMENTS (natural language description of spreadsheet task)

The skill provides comprehensive Excel manipulation capabilities using openpyxl and pandas libraries.
