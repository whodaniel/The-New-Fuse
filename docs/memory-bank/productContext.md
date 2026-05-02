# Product Context

*   **Problem Statement:** To enable effective coordination and communication between diverse AI agents, allowing them to collaborate on complex tasks, particularly within development environments like VS Code. To standardize this interaction for better integration and workflow automation.
*   **Target Audience:** Developers utilizing AI agents, AI agents participating in the system, potentially system integrators using the APIs.
*   **Core Functionality:**
    *   **Agent Discovery & Coordination:** Enables agents to find each other and coordinate actions.
    *   **VS Code Integration:** Provides a seamless experience within the IDE for managing agents, workflows, and communication (e.g., Master Command Center).
    *   **Workflow Automation:** Allows defining and executing multi-step, multi-agent workflows.
    *   **API Services:** Offers REST APIs for integrating external systems.
    *   **Standardized Communication (MCP):** Uses the Model Context Protocol for consistent data exchange.
    *   **Agent-to-Agent (A2A) Communication:** Facilitates direct interaction between agents.
*   **User Experience Goals:**
    *   Provide a unified and seamless interface within VS Code for developers to manage and leverage AI agent collaboration.
    *   Offer clear setup and configuration (e.g., Onboarding Wizard with tailored paths for user vs. agent developer).
    *   Ensure intuitive discovery and coordination tools for agents and workflows.
    *   Maintain a cohesive user journey from landing page through onboarding to core feature usage.
*   **Consolidated UX Pain Points & Considerations (from UX Evaluations - May 2025):**
    *   **Complexity Overwhelm & Discoverability:** The sheer number of features (indicated by file structure and FTUE) could be overwhelming if not introduced progressively. Advanced features/configurations might be hard to find without explicit guidance. (Both evaluations)
    *   **Consistency between Web UI and VS Code Extension:** Ensuring a seamless and consistent experience between any web application and the VS Code integrated UI is crucial. Discrepancies in functionality or design could lead to confusion. (File-structure UX Eval)
    *   **Performance of VS Code Extension:** A feature-rich VS Code extension could impact IDE performance if not carefully optimized. (Both evaluations)
    *   **Clarity of "Agent" vs. "User" Paths in Onboarding:** The clarity of tailored paths in the Onboarding Wizard (e.g., `UserTypeDetection.tsx`) is key for different user personas. (File-structure UX Eval, reinforced by FTUE's focus on onboarding)
    *   **Incomplete Core Functionality:** Many critical features (full RAG in onboarding, agent discovery/coordination, workflow execution) are not yet fully implemented, limiting the depth of the FTUE beyond initial setup. (FTUE Report)
    *   **Dependency on Further Enhancements:** Robustness of FTUE, especially for VS Code extension (WebSocket) and onboarding (backend integration), depends on planned enhancements. (FTUE Report)
*   **FTUE Report Summary & Key Recommendations (May 2025):**
    *   **Summary:** Foundational stage. Key entry points (Onboarding Wizard, VS Code extension with Chrome WebSocket communication) are in place, suggesting positive initial setup. Full realization of core functionalities is pending significant development.
    *   **Key Strengths (FTUE):** Structured Onboarding, Core VS Code Integration (WebSocket), Solid Architectural Foundation.
    *   **Major Areas for Improvement/Concern (FTUE):** Incomplete Core Functionality, Potential Complexity/Discoverability, Dependency on Further Enhancements.
    *   **Recommendations (FTUE):**
        1.  **Prioritize a Core End-to-End Feature Slice:** Implement a simple but complete workflow (agent discovery, coordination, task execution) manageable via VS Code.
        2.  **Accelerate Onboarding Enhancements:** Expedite real RAG and backend integration for the Onboarding Wizard.
        3.  **Embed UX Considerations into Development:** Proactively address identified UX pain points (complexity, discoverability, consistency, performance, onboarding clarity) during feature design and implementation, including user testing.
*   **Success Metrics:** [To be defined - potential metrics include adoption rate, number/complexity of automated workflows, developer productivity gains, user satisfaction scores, task completion rates in onboarding and core features]
