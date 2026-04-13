import os
import ctypes
import time
from tnf_forge import ForgeCompiler

class OmniGatewayAccelerator:
    """Uses LLVM-forged C++ to calculate agent scores for the Omni-TNF Gateway."""
    
    def __init__(self):
        self.forge = ForgeCompiler()
        self.lib = None
        self.lib_path = None

    def forge_gateway(self):
        """Compiles the C++ gateway engine."""
        cpp_path = os.path.join("forge", "phase2-omni-gateway", "omni_gateway.cpp")
        with open(cpp_path, "r") as f:
            cpp_code = f.read()
        
        self.lib_path = self.forge.compile_cpp(cpp_code, "omni_gateway", shared=True)
        self.lib = ctypes.CDLL(self.lib_path)
        
        # Define Argument and Result types for ctypes
        class AgentModel(ctypes.Structure):
            _fields_ = [
                ("costPerTask", ctypes.c_float),
                ("intelligenceLevel", ctypes.c_int),
                ("successRate", ctypes.c_float),
                ("averageExecutionTime", ctypes.c_float),
                ("maxConcurrency", ctypes.c_int)
            ]
        
        self.AgentModel = AgentModel
        self.lib.calculate_score.argtypes = [AgentModel, ctypes.c_int, ctypes.c_float]
        self.lib.calculate_score.restype = ctypes.c_float
        
        self.lib.batch_score.argtypes = [
            ctypes.POINTER(AgentModel), 
            ctypes.c_int, 
            ctypes.c_int, 
            ctypes.c_float, 
            ctypes.POINTER(ctypes.c_float)
        ]
        self.lib.batch_score.restype = None

    def score_agent(self, agent_data, req_intel, budget):
        if not self.lib:
            self.forge_gateway()
        
        model = self.AgentModel(
            agent_data['costPerTask'],
            agent_data['intelligenceLevel'],
            agent_data['successRate'],
            agent_data['averageExecutionTime'],
            agent_data['maxConcurrency']
        )
        return self.lib.calculate_score(model, req_intel, budget)

    def batch_score_agents(self, agents_list, req_intel, budget):
        if not self.lib:
            self.forge_gateway()
            
        count = len(agents_list)
        AgentsArray = self.AgentModel * count
        native_agents = AgentsArray()
        
        for i, agent in enumerate(agents_list):
            native_agents[i] = self.AgentModel(
                agent['costPerTask'],
                agent['intelligenceLevel'],
                agent['successRate'],
                agent['averageExecutionTime'],
                agent['maxConcurrency']
            )
            
        ResultsArray = ctypes.c_float * count
        results = ResultsArray()
        
        self.lib.batch_score(native_agents, count, req_intel, budget, results)
        return list(results)

if __name__ == "__main__":
    gateway = OmniGatewayAccelerator()
    print("Forging Omni-TNF Gateway (Native C++)...")
    gateway.forge_gateway()
    
    # Mock data for testing
    agents = [
        {'costPerTask': 0.01, 'intelligenceLevel': 2, 'successRate': 0.95, 'averageExecutionTime': 500, 'maxConcurrency': 10},
        {'costPerTask': 0.45, 'intelligenceLevel': 4, 'successRate': 0.96, 'averageExecutionTime': 4000, 'maxConcurrency': 5},
        {'costPerTask': 1.80, 'intelligenceLevel': 5, 'successRate': 0.98, 'averageExecutionTime': 9000, 'maxConcurrency': 3}
    ]
    
    print("\nTesting Native Scoring:")
    for i, agent in enumerate(agents):
        score = gateway.score_agent(agent, 3, 1.0)
        print(f"Agent {i} Score: {score:.4f}")
        
    print("\nTesting Batch Scoring:")
    batch_results = gateway.batch_score_agents(agents, 3, 1.0)
    print(f"Batch Results: {batch_results}")
    
    print("\nSUCCESS: Omni-TNF Gateway Native Scaffolding is active.")
