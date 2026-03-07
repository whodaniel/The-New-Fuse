
# Backend API for Simplified Interfaces

from flask import Flask, request, jsonify
from tools.generate import VisualizationGenerator
from tools.ag_ui_tool import AGUIVisualizationTool

app = Flask(__name__)

@app.route('/api/execute', methods=['POST'])
def execute_capability():
    data = request.json
    capability = data.get('capability')
    parameters = data.get('parameters', {})

    try:
        if capability == 'Generate Self-Contained Visualization':
            generator = VisualizationGenerator()
            result = generator.generate(parameters)
            return jsonify({
                'success': True,
                'filePath': result.get('filePath'),
                'message': 'Visualization generated successfully'
            })

        elif capability == 'Create AG-UI Analysis Agent':
            # Create agent based on parameters
            result = create_agent(parameters)
            return jsonify({
                'success': True,
                'agentId': result['id'],
                'message': 'Agent created successfully'
            })

        else:
            return jsonify({
                'success': False,
                'error': 'Unknown capability'
            }), 400

    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
