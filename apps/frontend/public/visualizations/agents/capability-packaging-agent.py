"""
Capability Packaging Agent

PURPOSE:
Takes complex functionalities from the codebase and packages them into
user-friendly automated sequences - buttons, forms, wizards, and workflows.

MISSION:
Transform technical complexity into simple user interactions.
"""

import json
import ast
import inspect
from pathlib import Path
from typing import Dict, List, Any, Optional
from dataclasses import dataclass
from enum import Enum


class UIComponentType(Enum):
    """Types of UI components we can generate"""
    BUTTON = "button"
    FORM = "form"
    DROPDOWN = "dropdown"
    WIZARD = "wizard"
    SLIDER = "slider"
    TOGGLE = "toggle"
    FILE_UPLOAD = "file_upload"
    TEXT_INPUT = "text_input"
    CHECKBOX = "checkbox"
    RADIO_GROUP = "radio_group"


@dataclass
class CapabilityParameter:
    """Represents a parameter for a capability"""
    name: str
    type: str
    description: str
    required: bool = True
    default: Any = None
    options: Optional[List[Any]] = None  # For dropdowns/radio
    min_value: Optional[float] = None    # For sliders/numbers
    max_value: Optional[float] = None
    ui_component: UIComponentType = UIComponentType.TEXT_INPUT


@dataclass
class Capability:
    """Represents a discovered capability in the codebase"""
    name: str
    description: str
    category: str
    function_path: str
    parameters: List[CapabilityParameter]
    complexity_level: str  # "simple", "moderate", "complex"
    estimated_time: str    # "seconds", "minutes", "hours"
    example_use_case: str
    dependencies: List[str]


@dataclass
class SimplifiedInterface:
    """A simplified interface for a capability"""
    capability_name: str
    interface_type: str  # "one_click", "simple_form", "wizard"
    ui_components: List[Dict[str, Any]]
    workflow_steps: List[str]
    validation_rules: Dict[str, Any]
    success_message: str
    error_handling: Dict[str, str]


class CapabilityPackagingAgent:
    """
    Agent that discovers complex functionalities and packages them
    into simple, user-friendly interfaces
    """

    def __init__(self, codebase_path: str):
        self.codebase_path = Path(codebase_path)
        self.discovered_capabilities: List[Capability] = []
        self.packaged_interfaces: List[SimplifiedInterface] = []

    def discover_capabilities(self) -> List[Capability]:
        """
        Scan codebase to discover all available capabilities
        """
        print("🔍 Discovering capabilities in codebase...")

        capabilities = []

        # Example: Discover our visualization generation capability
        viz_capability = Capability(
            name="Generate Self-Contained Visualization",
            description="Create an interactive HTML visualization from hierarchical data",
            category="Data Visualization",
            function_path="tools.generate.VisualizationGenerator.generate",
            parameters=[
                CapabilityParameter(
                    name="data",
                    type="dict",
                    description="Hierarchical data structure",
                    required=True,
                    ui_component=UIComponentType.FILE_UPLOAD
                ),
                CapabilityParameter(
                    name="title",
                    type="str",
                    description="Visualization title",
                    default="Data Visualization",
                    ui_component=UIComponentType.TEXT_INPUT
                ),
                CapabilityParameter(
                    name="primaryColor",
                    type="str",
                    description="Primary color scheme",
                    default="#667eea",
                    options=["#667eea", "#f59e0b", "#10b981", "#3b82f6", "#ec4899"],
                    ui_component=UIComponentType.DROPDOWN
                ),
                CapabilityParameter(
                    name="colorScheme",
                    type="str",
                    description="D3 color scheme",
                    default="schemeSet3",
                    options=["schemeSet3", "schemeCategory10", "schemePastel1"],
                    ui_component=UIComponentType.DROPDOWN
                ),
            ],
            complexity_level="moderate",
            estimated_time="seconds",
            example_use_case="Analyze bundle sizes and create shareable report",
            dependencies=["Node.js", "D3.js (embedded)"]
        )
        capabilities.append(viz_capability)

        # AG-UI Agent Creation capability
        agent_capability = Capability(
            name="Create AG-UI Analysis Agent",
            description="Generate an AI agent that analyzes data and creates visualizations",
            category="AI Agents",
            function_path="examples.ag_ui_examples.microsoft_agent_example",
            parameters=[
                CapabilityParameter(
                    name="agent_type",
                    type="str",
                    description="Type of analysis agent",
                    options=["Bundle Analyzer", "Data Explorer", "Report Generator"],
                    ui_component=UIComponentType.RADIO_GROUP
                ),
                CapabilityParameter(
                    name="data_source",
                    type="str",
                    description="Where to get data",
                    ui_component=UIComponentType.TEXT_INPUT
                ),
                CapabilityParameter(
                    name="auto_generate_insights",
                    type="bool",
                    description="Automatically generate AI insights",
                    default=True,
                    ui_component=UIComponentType.TOGGLE
                ),
            ],
            complexity_level="complex",
            estimated_time="minutes",
            example_use_case="Create agent that monitors CI/CD and generates reports",
            dependencies=["Microsoft Agent Framework", "AG-UI Protocol"]
        )
        capabilities.append(agent_capability)

        self.discovered_capabilities = capabilities
        return capabilities

    def package_as_one_click(self, capability: Capability) -> SimplifiedInterface:
        """
        Package a capability as a one-click button with smart defaults
        """
        return SimplifiedInterface(
            capability_name=capability.name,
            interface_type="one_click",
            ui_components=[
                {
                    "type": "button",
                    "label": f"🚀 {capability.name}",
                    "action": "execute_with_defaults",
                    "style": "primary",
                    "size": "large"
                }
            ],
            workflow_steps=[
                "Apply smart defaults",
                f"Execute {capability.function_path}",
                "Display results"
            ],
            validation_rules={},
            success_message=f"✅ {capability.name} completed successfully!",
            error_handling={
                "network_error": "Check internet connection and try again",
                "invalid_data": "Data format not recognized",
                "timeout": "Operation took too long, please try with smaller dataset"
            }
        )

    def package_as_simple_form(self, capability: Capability) -> SimplifiedInterface:
        """
        Package as a simple form with minimal required fields
        """
        # Extract only required parameters
        required_params = [p for p in capability.parameters if p.required]

        ui_components = []

        # Create form title
        ui_components.append({
            "type": "heading",
            "text": capability.name,
            "level": 2
        })

        ui_components.append({
            "type": "description",
            "text": capability.description
        })

        # Create form fields
        for param in required_params:
            ui_components.append({
                "type": param.ui_component.value,
                "name": param.name,
                "label": param.description,
                "required": param.required,
                "default": param.default,
                "options": param.options,
                "placeholder": f"Enter {param.name}..."
            })

        # Add submit button
        ui_components.append({
            "type": "button",
            "label": f"Generate {capability.name}",
            "action": "submit_form",
            "style": "primary"
        })

        return SimplifiedInterface(
            capability_name=capability.name,
            interface_type="simple_form",
            ui_components=ui_components,
            workflow_steps=[
                "Validate user input",
                "Apply defaults for optional fields",
                "Execute capability",
                "Show success/error message"
            ],
            validation_rules={
                param.name: {
                    "required": param.required,
                    "type": param.type
                } for param in required_params
            },
            success_message=f"✅ Successfully created {capability.name}!",
            error_handling={
                "validation_error": "Please check your inputs and try again",
                "execution_error": "Something went wrong. Please contact support."
            }
        )

    def package_as_wizard(self, capability: Capability) -> SimplifiedInterface:
        """
        Package as a multi-step wizard for complex workflows
        """
        # Group parameters into logical steps
        steps = self._group_parameters_into_steps(capability.parameters)

        ui_components = []

        # Create wizard structure
        for step_index, (step_name, params) in enumerate(steps.items(), 1):
            step_component = {
                "type": "wizard_step",
                "step_number": step_index,
                "step_title": step_name,
                "fields": []
            }

            for param in params:
                step_component["fields"].append({
                    "type": param.ui_component.value,
                    "name": param.name,
                    "label": param.description,
                    "required": param.required,
                    "default": param.default,
                    "options": param.options,
                    "help_text": f"Used to {param.description.lower()}"
                })

            # Add navigation buttons
            step_component["navigation"] = {
                "show_back": step_index > 1,
                "show_next": step_index < len(steps),
                "show_finish": step_index == len(steps)
            }

            ui_components.append(step_component)

        return SimplifiedInterface(
            capability_name=capability.name,
            interface_type="wizard",
            ui_components=ui_components,
            workflow_steps=[
                f"Step {i}: {name}" for i, name in enumerate(steps.keys(), 1)
            ] + ["Execute capability", "Show results"],
            validation_rules={
                "step_validation": True,
                "allow_skip": False
            },
            success_message=f"🎉 Wizard completed! {capability.name} is ready.",
            error_handling={
                "step_error": "Please complete this step before continuing",
                "final_error": "Review your inputs and try again"
            }
        )

    def _group_parameters_into_steps(self, parameters: List[CapabilityParameter]) -> Dict[str, List[CapabilityParameter]]:
        """
        Intelligently group parameters into wizard steps
        """
        steps = {
            "Basic Configuration": [],
            "Advanced Options": [],
            "Styling & Appearance": []
        }

        for param in parameters:
            if param.required:
                steps["Basic Configuration"].append(param)
            elif "color" in param.name.lower() or "style" in param.name.lower():
                steps["Styling & Appearance"].append(param)
            else:
                steps["Advanced Options"].append(param)

        # Remove empty steps
        return {k: v for k, v in steps.items() if v}

    def generate_html_interface(self, interface: SimplifiedInterface) -> str:
        """
        Generate actual HTML for the simplified interface
        """
        if interface.interface_type == "one_click":
            return self._generate_one_click_html(interface)
        elif interface.interface_type == "simple_form":
            return self._generate_form_html(interface)
        elif interface.interface_type == "wizard":
            return self._generate_wizard_html(interface)

    def _generate_one_click_html(self, interface: SimplifiedInterface) -> str:
        """Generate HTML for one-click button interface"""
        button = interface.ui_components[0]

        return f"""
<!DOCTYPE html>
<html>
<head>
    <title>{interface.capability_name}</title>
    <style>
        body {{
            font-family: -apple-system, system-ui, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }}
        .container {{
            background: white;
            padding: 60px;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            text-align: center;
        }}
        h1 {{
            margin-bottom: 30px;
            color: #2d3748;
        }}
        button {{
            font-size: 18px;
            padding: 20px 40px;
            background: #667eea;
            color: white;
            border: none;
            border-radius: 10px;
            cursor: pointer;
            transition: transform 0.2s, box-shadow 0.2s;
        }}
        button:hover {{
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(102, 126, 234, 0.4);
        }}
        button:active {{
            transform: translateY(0);
        }}
        #status {{
            margin-top: 30px;
            font-size: 16px;
            color: #4a5568;
        }}
    </style>
</head>
<body>
    <div class="container">
        <h1>{interface.capability_name}</h1>
        <button onclick="executeCapability()">{button['label']}</button>
        <div id="status"></div>
    </div>

    <script>
        async function executeCapability() {{
            const status = document.getElementById('status');
            status.textContent = '⏳ Processing...';

            try {{
                // Call backend API
                const response = await fetch('/api/execute', {{
                    method: 'POST',
                    headers: {{ 'Content-Type': 'application/json' }},
                    body: JSON.stringify({{
                        capability: '{interface.capability_name}',
                        parameters: {{}}  // Use defaults
                    }})
                }});

                const result = await response.json();

                if (result.success) {{
                    status.textContent = '{interface.success_message}';
                    status.style.color = '#10b981';

                    // Show result
                    if (result.filePath) {{
                        status.innerHTML += `<br><a href="${{result.filePath}}" target="_blank">View Result</a>`;
                    }}
                }} else {{
                    throw new Error(result.error);
                }}
            }} catch (error) {{
                status.textContent = '❌ ' + error.message;
                status.style.color = '#ef4444';
            }}
        }}
    </script>
</body>
</html>
"""

    def _generate_form_html(self, interface: SimplifiedInterface) -> str:
        """Generate HTML for simple form interface"""
        # Extract components
        fields_html = []

        for component in interface.ui_components:
            if component['type'] == 'heading':
                continue
            elif component['type'] == 'description':
                continue
            elif component['type'] == UIComponentType.TEXT_INPUT.value:
                fields_html.append(f"""
                <div class="field">
                    <label>{component['label']}</label>
                    <input
                        type="text"
                        name="{component['name']}"
                        placeholder="{component.get('placeholder', '')}"
                        {'required' if component.get('required') else ''}
                    />
                </div>
                """)
            elif component['type'] == UIComponentType.DROPDOWN.value:
                options = '\n'.join([
                    f'<option value="{opt}">{opt}</option>'
                    for opt in component.get('options', [])
                ])
                fields_html.append(f"""
                <div class="field">
                    <label>{component['label']}</label>
                    <select name="{component['name']}" {'required' if component.get('required') else ''}>
                        {options}
                    </select>
                </div>
                """)
            elif component['type'] == UIComponentType.FILE_UPLOAD.value:
                fields_html.append(f"""
                <div class="field">
                    <label>{component['label']}</label>
                    <input
                        type="file"
                        name="{component['name']}"
                        accept=".json"
                        {'required' if component.get('required') else ''}
                    />
                </div>
                """)

        return f"""
<!DOCTYPE html>
<html>
<head>
    <title>{interface.capability_name}</title>
    <style>
        body {{
            font-family: -apple-system, system-ui, sans-serif;
            background: #f7fafc;
            padding: 40px;
        }}
        .container {{
            max-width: 600px;
            margin: 0 auto;
            background: white;
            padding: 40px;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }}
        h1 {{
            color: #2d3748;
            margin-bottom: 30px;
        }}
        .field {{
            margin-bottom: 20px;
        }}
        label {{
            display: block;
            margin-bottom: 8px;
            font-weight: 600;
            color: #4a5568;
        }}
        input, select {{
            width: 100%;
            padding: 12px;
            border: 2px solid #e2e8f0;
            border-radius: 6px;
            font-size: 14px;
        }}
        input:focus, select:focus {{
            outline: none;
            border-color: #667eea;
        }}
        button {{
            width: 100%;
            padding: 14px;
            background: #667eea;
            color: white;
            border: none;
            border-radius: 6px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            margin-top: 20px;
        }}
        button:hover {{
            background: #5a67d8;
        }}
        #result {{
            margin-top: 20px;
            padding: 12px;
            border-radius: 6px;
            display: none;
        }}
        .success {{ background: #d1fae5; color: #065f46; }}
        .error {{ background: #fee2e2; color: #991b1b; }}
    </style>
</head>
<body>
    <div class="container">
        <h1>{interface.capability_name}</h1>
        <form id="capabilityForm" onsubmit="handleSubmit(event)">
            {''.join(fields_html)}
            <button type="submit">Generate</button>
        </form>
        <div id="result"></div>
    </div>

    <script>
        async function handleSubmit(event) {{
            event.preventDefault();
            const form = event.target;
            const formData = new FormData(form);
            const data = Object.fromEntries(formData);

            const result = document.getElementById('result');
            result.style.display = 'block';
            result.className = '';
            result.textContent = '⏳ Processing...';

            try {{
                const response = await fetch('/api/execute', {{
                    method: 'POST',
                    headers: {{ 'Content-Type': 'application/json' }},
                    body: JSON.stringify({{
                        capability: '{interface.capability_name}',
                        parameters: data
                    }})
                }});

                const responseData = await response.json();

                if (responseData.success) {{
                    result.className = 'success';
                    result.innerHTML = '{interface.success_message}<br><br>' +
                        `<a href="${{responseData.filePath}}" target="_blank">View Result →</a>`;
                }} else {{
                    throw new Error(responseData.error);
                }}
            }} catch (error) {{
                result.className = 'error';
                result.textContent = '❌ ' + error.message;
            }}
        }}
    </script>
</body>
</html>
"""

    def _generate_wizard_html(self, interface: SimplifiedInterface) -> str:
        """Generate HTML for wizard interface"""
        # This would be more complex - skeleton for now
        return f"""
<!DOCTYPE html>
<html>
<head>
    <title>{interface.capability_name} - Setup Wizard</title>
    <style>
        /* Wizard styles */
        body {{
            font-family: -apple-system, system-ui, sans-serif;
            background: #f7fafc;
        }}
        .wizard-container {{
            max-width: 800px;
            margin: 40px auto;
            background: white;
            border-radius: 12px;
            padding: 40px;
        }}
        .steps {{
            display: flex;
            justify-content: space-between;
            margin-bottom: 40px;
        }}
        .step {{
            flex: 1;
            text-align: center;
            padding: 10px;
            border-bottom: 3px solid #e2e8f0;
        }}
        .step.active {{
            border-color: #667eea;
            color: #667eea;
        }}
        .step.completed {{
            border-color: #10b981;
            color: #10b981;
        }}
        .wizard-content {{
            min-height: 300px;
        }}
        .wizard-step {{
            display: none;
        }}
        .wizard-step.active {{
            display: block;
        }}
    </style>
</head>
<body>
    <div class="wizard-container">
        <h1>{interface.capability_name}</h1>
        <div class="steps">
            <!-- Step indicators generated dynamically -->
        </div>
        <div class="wizard-content">
            <!-- Step content -->
        </div>
        <div class="wizard-navigation">
            <button onclick="previousStep()">← Back</button>
            <button onclick="nextStep()">Next →</button>
            <button onclick="finish()" style="display:none">Finish</button>
        </div>
    </div>

    <script>
        // Wizard navigation logic
        let currentStep = 1;
        const totalSteps = {len(interface.workflow_steps)};

        function nextStep() {{
            if (currentStep < totalSteps) {{
                currentStep++;
                updateWizard();
            }}
        }}

        function previousStep() {{
            if (currentStep > 1) {{
                currentStep--;
                updateWizard();
            }}
        }}

        function updateWizard() {{
            // Update UI based on current step
        }}

        function finish() {{
            // Execute capability with all collected data
        }}
    </script>
</body>
</html>
"""

    def create_api_backend(self, interfaces: List[SimplifiedInterface]) -> str:
        """
        Generate Express/Flask backend to handle form submissions
        """
        return f"""
# Backend API for Simplified Interfaces

from flask import Flask, request, jsonify
from tools.generate import VisualizationGenerator
from tools.ag_ui_tool import AGUIVisualizationTool

app = Flask(__name__)

@app.route('/api/execute', methods=['POST'])
def execute_capability():
    data = request.json
    capability = data.get('capability')
    parameters = data.get('parameters', {{}})

    try:
        if capability == 'Generate Self-Contained Visualization':
            generator = VisualizationGenerator()
            result = generator.generate(parameters)
            return jsonify({{
                'success': True,
                'filePath': result.get('filePath'),
                'message': 'Visualization generated successfully'
            }})

        elif capability == 'Create AG-UI Analysis Agent':
            # Create agent based on parameters
            result = create_agent(parameters)
            return jsonify({{
                'success': True,
                'agentId': result['id'],
                'message': 'Agent created successfully'
            }})

        else:
            return jsonify({{
                'success': False,
                'error': 'Unknown capability'
            }}), 400

    except Exception as e:
        return jsonify({{
            'success': False,
            'error': str(e)
        }}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
"""

    def generate_complete_package(self, output_dir: str):
        """
        Generate complete package with UI, backend, and documentation
        """
        output_path = Path(output_dir)
        output_path.mkdir(parents=True, exist_ok=True)

        print("📦 Generating capability package...")

        # Discover all capabilities
        capabilities = self.discover_capabilities()

        # Package each capability
        for capability in capabilities:
            print(f"\n🔨 Packaging: {capability.name}")

            # Generate interfaces
            one_click = self.package_as_one_click(capability)
            simple_form = self.package_as_simple_form(capability)
            wizard = self.package_as_wizard(capability)

            # Generate HTML files
            (output_path / "one-click").mkdir(exist_ok=True)
            (output_path / "forms").mkdir(exist_ok=True)
            (output_path / "wizards").mkdir(exist_ok=True)

            # Save HTML files
            with open(output_path / "one-click" / f"{capability.name.lower().replace(' ', '-')}.html", 'w') as f:
                f.write(self.generate_html_interface(one_click))

            with open(output_path / "forms" / f"{capability.name.lower().replace(' ', '-')}.html", 'w') as f:
                f.write(self.generate_html_interface(simple_form))

            with open(output_path / "wizards" / f"{capability.name.lower().replace(' ', '-')}.html", 'w') as f:
                f.write(self.generate_html_interface(wizard))

            print(f"  ✓ Generated 3 interface types")

        # Generate backend API
        with open(output_path / "api.py", 'w') as f:
            f.write(self.create_api_backend(self.packaged_interfaces))

        # Generate documentation
        self._generate_documentation(output_path, capabilities)

        print(f"\n✅ Package complete! Output: {output_path}")
        return output_path

    def _generate_documentation(self, output_path: Path, capabilities: List[Capability]):
        """Generate documentation for all packaged capabilities"""
        doc = f"""# Packaged Capabilities

## Available Interfaces

This package provides **{len(capabilities)}** capabilities packaged into user-friendly interfaces.

"""

        for capability in capabilities:
            doc += f"""
### {capability.name}

**Category:** {capability.category}
**Complexity:** {capability.complexity_level}
**Estimated Time:** {capability.estimated_time}

{capability.description}

**Example Use Case:**
{capability.example_use_case}

**Available Interfaces:**
- 🔘 One-Click: `one-click/{capability.name.lower().replace(' ', '-')}.html`
- 📝 Simple Form: `forms/{capability.name.lower().replace(' ', '-')}.html`
- 🧙 Wizard: `wizards/{capability.name.lower().replace(' ', '-')}.html`

**Dependencies:**
{chr(10).join(f'- {dep}' for dep in capability.dependencies)}

---
"""

        with open(output_path / "README.md", 'w') as f:
            f.write(doc)


# Example usage
if __name__ == "__main__":
    agent = CapabilityPackagingAgent(
        codebase_path="/path/to/self-contained-visualizations"
    )

    # Generate complete package
    agent.generate_complete_package(
        output_dir="/path/to/self-contained-visualizations/ui-package"
    )
