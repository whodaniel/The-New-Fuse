# Video Analysis Report

## Metadata
- **Video**: Andrej Karpathy's Math Proves Agent Skills Will Fail. Here's What to Build Instead.
- **Index**: #664
- **URL**: https://www.youtube.com/watch?v=I2K81s0OQto
- **Duration**: 19:26
- **Processed**: 2026-05-10T01:29:00.108Z

---

## Summary
The video discusses the challenge of achieving enterprise-grade reliability in AI agentic workflows, contrasting 'agent skills' (prompt-based instructions) with 'agent harnesses' (deterministic scaffolding). It uses compliance audit workflows as a motivating example, explains compounding failure rates in multi-step agents, and introduces Stripe's 'minions' as a case study for putting AI on deterministic rails. The video then outlines six harness design patterns and demonstrates a legal contract review application built with harness principles.

## 🦾 Visual Intelligence
- **0:12**: Complex workflow dashboard diagram showing compliance audit process with multiple phases, decision points, and document flows - WORKFLOW DASHBOARD with File Setup, Planning and Risk Assessment, Risk Response, and Conclusion sections. Contains nodes for Materiality, Risk identification, FSA (Financial Statement Assertions), Work Programs, Risk Report, and Management Letter. Shows 'CONSTELLATION' subsystem and ML letter points.
- **0:12**: Reliability mathematics table for 10-step workflows - Table showing: 90% per-step = 34.87% success (65.13% failure, ~6.5 interruptions/day); 99% = 90.44% success (9.56% failure, ~1/day); 99.9% = 99% success (1% failure, ~1/10 days); 99.99% = 99.90% success (0.10% failure, ~1/3.3 months). Labels progress from 'Prototype territory' to 'enterprise-grade software'
- **0:12**: Skill file markdown example showing MCP tool usage - Skill File for 'Onboard New Customer' with 4 steps: Step 1 create_customer (name, email, company), Step 2 setup_payment_method with verification wait, Step 3 create_subscription (plan_id, customer_id), Step 4 send_email with welcome_email_template
- **0:12**: Stripe engineering blog article on 'Minions' coding agents - Article titled 'Minions: Stripe's one-shot, end-to-end coding agents—Part 2'. Mentions 1300+ Stripe pull requests merged weekly are minion-produced, human-reviewed, no human-written code. Discusses devboxes for isolated agent environments.
- **0:12**: Agent Harness Designs taxonomy slide - Six harness types listed: General Purpose Harness, Specialized Harness, Autonomous Harness, Hierarchical Harness, Multi-Agent Harness, DAG Harness
- **0:12**: Legal application UI demo showing contract review workflow - MERCER & HARTWELL LAW FIRM interface with Chat/Docs/Skills tabs. Shows conversation history with 'Review Request' items. Main panel displays phased execution: Phase 4 Load Playbook (9 steps), Phase 5 Clause Extraction, Phase 6 Risk Analysis (34 clauses), Phase 7 Redline Generation with expandable clause items (1.1, 1.2, 2.3, 3.1, 3.2, 3.3, 4.2, 4.3, 5.1, 5.2). Right panel shows Plan with 6 completed phases.
