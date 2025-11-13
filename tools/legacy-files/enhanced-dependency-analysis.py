#!/usr/bin/env python3

import os
import re
from collections import defaultdict, Counter
from pathlib import Path
import json

class DependencyAnalyzer:
    def __init__(self, base_dir):
        self.base_dir = Path(base_dir)
        self.components = {}
        self.dependencies = defaultdict(set)
        self.reverse_dependencies = defaultdict(set)
        self.external_deps = defaultdict(set)
        self.internal_deps = defaultdict(set)
        self.ui_libraries = defaultdict(set)
        
    def analyze_file(self, file_path):
        """Analyze a single TSX/JSX file for imports"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
                
            # Extract all import statements
            import_patterns = [
                r"import\s+(?:{[^}]*}|\*\s+as\s+\w+|\w+)(?:\s*,\s*{[^}]*})?\s+from\s+['\"]([^'\"]*)['\"]",
                r"import\s+['\"]([^'\"]*)['\"]",
                r"import\s*\(\s*['\"]([^'\"]*)['\"]"
            ]
            
            imports = []
            for pattern in import_patterns:
                matches = re.findall(pattern, content, re.MULTILINE)
                imports.extend(matches)
            
            relative_path = str(file_path.relative_to(self.base_dir))
            
            self.components[relative_path] = {
                'file': relative_path,
                'imports': imports,
                'is_component': self.is_react_component(content),
                'exports': self.extract_exports(content)
            }
            
            # Categorize dependencies
            for imp in imports:
                if imp.startswith('./') or imp.startswith('../'):
                    self.internal_deps[relative_path].add(imp)
                elif imp.startswith('@the-new-fuse'):
                    self.internal_deps[relative_path].add(imp)
                elif imp in ['react', 'react-dom']:
                    self.dependencies[relative_path].add(f'React: {imp}')
                elif imp.startswith('@radix-ui') or imp.startswith('@chakra-ui') or 'ui' in imp.lower():
                    self.ui_libraries[relative_path].add(imp)
                else:
                    self.external_deps[relative_path].add(imp)
                    
                self.dependencies[relative_path].add(imp)
                self.reverse_dependencies[imp].add(relative_path)
                
        except Exception as e:
            print(f"Error processing {file_path}: {e}")
            
    def is_react_component(self, content):
        """Check if file contains React components"""
        component_patterns = [
            r'function\s+[A-Z]\w*\s*\([^)]*\)\s*{',
            r'const\s+[A-Z]\w*\s*[:=]\s*\([^)]*\)\s*=>\s*{',
            r'export\s+(?:default\s+)?(?:function\s+)?[A-Z]\w*',
            r'React\.FC',
            r'FC<',
            r'Component<'
        ]
        
        return any(re.search(pattern, content) for pattern in component_patterns)
        
    def extract_exports(self, content):
        """Extract exported components/functions"""
        export_patterns = [
            r'export\s+(?:default\s+)?(?:function\s+)?(\w+)',
            r'export\s+{([^}]+)}',
            r'export\s+const\s+(\w+)',
        ]
        
        exports = []
        for pattern in export_patterns:
            matches = re.findall(pattern, content)
            for match in matches:
                if isinstance(match, tuple):
                    exports.extend([m.strip() for m in match if m.strip()])
                else:
                    exports.append(match)
                    
        return exports
        
    def find_circular_dependencies(self):
        """Find potential circular dependencies"""
        visited = set()
        rec_stack = set()
        cycles = []
        
        def has_cycle(node, path):
            if node in rec_stack:
                cycle_start = path.index(node)
                cycles.append(path[cycle_start:] + [node])
                return True
                
            if node in visited:
                return False
                
            visited.add(node)
            rec_stack.add(node)
            
            for dep in self.internal_deps.get(node, []):
                # Resolve relative imports to actual file paths
                if has_cycle(dep, path + [node]):
                    return True
                    
            rec_stack.remove(node)
            return False
            
        for component in self.components:
            if component not in visited:
                has_cycle(component, [])
                
        return cycles
        
    def generate_report(self, output_file):
        """Generate comprehensive dependency report"""
        with open(output_file, 'w') as f:
            f.write("=== ENHANCED DEPENDENCY TREE ANALYSIS ===\n")
            f.write(f"Generated on: {os.popen('date').read().strip()}\n")
            f.write("=" * 50 + "\n\n")
            
            # Summary statistics
            f.write("SUMMARY STATISTICS:\n")
            f.write(f"Total React components analyzed: {len(self.components)}\n")
            f.write(f"Components with React imports: {len([c for c in self.components if any('react' in imp for imp in self.components[c]['imports'])])}\n")
            f.write(f"Total unique dependencies: {len(set().union(*self.dependencies.values()))}\n")
            f.write(f"Most used external libraries: {Counter(dep for deps in self.external_deps.values() for dep in deps).most_common(10)}\n")
            f.write(f"Most used UI libraries: {Counter(dep for deps in self.ui_libraries.values() for dep in deps).most_common(10)}\n")
            f.write("\n" + "=" * 50 + "\n\n")
            
            # Detailed component analysis
            f.write("DETAILED COMPONENT ANALYSIS:\n")
            f.write("=" * 30 + "\n\n")
            
            for component_path, component_data in sorted(self.components.items()):
                f.write(f"File: {component_path}\n")
                f.write(f"Type: {'React Component' if component_data['is_component'] else 'Module/Utility'}\n")
                
                if component_data['exports']:
                    f.write(f"Exports: {', '.join(component_data['exports'])}\n")
                
                # Categorize imports
                react_imports = [imp for imp in component_data['imports'] if 'react' in imp.lower()]
                ui_imports = [imp for imp in component_data['imports'] if any(ui_lib in imp for ui_lib in ['@radix-ui', '@chakra-ui', 'class-variance-authority', '@headlessui'])]
                internal_imports = [imp for imp in component_data['imports'] if imp.startswith('./') or imp.startswith('../') or imp.startswith('@the-new-fuse')]
                external_imports = [imp for imp in component_data['imports'] if imp not in react_imports + ui_imports + internal_imports]
                
                if react_imports:
                    f.write(f"React imports: {react_imports}\n")
                if ui_imports:
                    f.write(f"UI library imports: {ui_imports}\n")
                if internal_imports:
                    f.write(f"Internal imports: {internal_imports}\n")
                if external_imports:
                    f.write(f"External imports: {external_imports}\n")
                
                f.write("Raw imports:\n")
                for imp in component_data['imports']:
                    f.write(f"  {component_path}: import ... from '{imp}'\n")
                    
                f.write("---\n\n")
                
            # Cross-package dependencies
            f.write("CROSS-PACKAGE DEPENDENCIES:\n")
            f.write("=" * 30 + "\n")
            
            package_deps = defaultdict(set)
            for component, deps in self.internal_deps.items():
                component_package = component.split('/')[0]
                for dep in deps:
                    if dep.startswith('@the-new-fuse'):
                        dep_package = dep.split('/')[1] if '/' in dep else 'unknown'
                        if dep_package != component_package:
                            package_deps[component_package].add(dep_package)
                            
            for package, deps in package_deps.items():
                f.write(f"{package} depends on: {', '.join(deps)}\n")
                
            f.write("\n")
            
            # Potential issues
            f.write("POTENTIAL ISSUES:\n")
            f.write("=" * 20 + "\n")
            
            # Find components with many dependencies
            heavy_components = [(comp, len(deps)) for comp, deps in self.dependencies.items() if len(deps) > 10]
            if heavy_components:
                f.write("Components with many dependencies (>10):\n")
                for comp, count in sorted(heavy_components, key=lambda x: x[1], reverse=True):
                    f.write(f"  {comp}: {count} dependencies\n")
                f.write("\n")
                
            # Find unused or rarely used imports
            dep_usage = Counter()
            for deps in self.dependencies.values():
                for dep in deps:
                    dep_usage[dep] += 1
                    
            rarely_used = [(dep, count) for dep, count in dep_usage.items() if count == 1]
            if rarely_used:
                f.write(f"Rarely used dependencies (used only once): {len(rarely_used)} total\n")
                for dep, count in rarely_used[:10]:  # Show first 10
                    f.write(f"  {dep}\n")
                f.write("\n")
                
def main():
    base_dir = Path.cwd()
    analyzer = DependencyAnalyzer(base_dir)
    
    # Find all TSX and JSX files
    tsx_files = list(base_dir.glob('packages/**/*.tsx')) + list(base_dir.glob('apps/**/*.tsx'))
    jsx_files = list(base_dir.glob('packages/**/*.jsx')) + list(base_dir.glob('apps/**/*.jsx'))
    
    all_files = tsx_files + jsx_files
    
    # Filter out node_modules
    all_files = [f for f in all_files if 'node_modules' not in str(f)]
    
    print(f"Analyzing {len(all_files)} React component files...")
    
    for file_path in all_files:
        analyzer.analyze_file(file_path)
        
    # Generate the report
    output_file = base_dir / 'ui-audit-results' / 'enhanced-dependency-tree.txt'
    analyzer.generate_report(output_file)
    
    print(f"Enhanced analysis complete. Results saved to {output_file}")
    
    # Also generate JSON for programmatic use
    json_output = {
        'components': analyzer.components,
        'summary': {
            'total_components': len(analyzer.components),
            'total_dependencies': len(set().union(*analyzer.dependencies.values())),
            'top_external_deps': dict(Counter(dep for deps in analyzer.external_deps.values() for dep in deps).most_common(20)),
            'top_ui_libs': dict(Counter(dep for deps in analyzer.ui_libraries.values() for dep in deps).most_common(20))
        }
    }
    
    json_file = base_dir / 'ui-audit-results' / 'dependency-analysis.json'
    with open(json_file, 'w') as f:
        json.dump(json_output, f, indent=2, default=str)
        
    print(f"JSON data saved to {json_file}")

if __name__ == "__main__":
    main()