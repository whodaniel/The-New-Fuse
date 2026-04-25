package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"sync"
)

// AgentCard represents the A2A Agent Card
type AgentCard struct {
	AgentID     string   `json:"agentId"`
	Name        string   `json:"name"`
	Endpoint    string   `json:"endpoint"`
	Capabilities []string `json:"capabilities"`
}

// Message represents an A2A message payload
type Message struct {
	SenderID   string          `json:"senderId"`
	ReceiverID string          `json:"receiverId"`
	Payload    json.RawMessage `json:"payload"`
}

// Orchestrator manages agent routing
type Orchestrator struct {
	agents map[string]AgentCard
	mu     sync.RWMutex
	bus    chan Message
}

func NewOrchestrator() *Orchestrator {
	return &Orchestrator{
		agents: make(map[string]AgentCard),
		bus:    make(chan Message, 1000),
	}
}

func (o *Orchestrator) RegisterAgent(w http.ResponseWriter, r *http.Request) {
	var card AgentCard
	if err := json.NewDecoder(r.Body).Decode(&card); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// Governance: Calculate AARS Score
	score := o.CalculateAARS(card)
	fmt.Printf("Agent Registered: %s (AARS: %.2f)\n", card.Name, score)

	o.mu.Lock()
	o.agents[card.AgentID] = card
	o.mu.Unlock()

	w.WriteHeader(http.StatusCreated)
}

func (o *Orchestrator) CalculateAARS(card AgentCard) float64 {
	// Simple multiplier logic based on capabilities
	score := 1.0
	for _, cap := range card.Capabilities {
		if cap == "filesystem-access" {
			score *= 1.5
		}
		if cap == "network-outbound" {
			score *= 1.2
		}
	}
	return score
}

func (o *Orchestrator) HandleMessage(w http.ResponseWriter, r *http.Request) {
	var msg Message
	if err := json.NewDecoder(r.Body).Decode(&msg); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// Dispatch message to bus for concurrent processing
	o.bus <- msg
	w.WriteHeader(http.StatusAccepted)
}

func (o *Orchestrator) StartRouter() {
	for msg := range o.bus {
		go func(m Message) {
			o.mu.RLock()
			agent, ok := o.agents[m.ReceiverID]
			o.mu.RUnlock()

			if !ok {
				log.Printf("Routing failed: Receiver %s not found\n", m.ReceiverID)
				return
			}

			// In a real implementation, we would forward the message to agent.Endpoint
			log.Printf("Routing message from %s to %s at %s\n", m.SenderID, agent.Name, agent.Endpoint)
		}(msg)
	}
}

func (o *Orchestrator) HandleANS(w http.ResponseWriter, r *http.Request) {
	capability := r.URL.Query().Get("capability")
	if capability == "" {
		http.Error(w, "missing capability query parameter", http.StatusBadRequest)
		return
	}

	o.mu.RLock()
	defer o.mu.RUnlock()

	var matches []AgentCard
	for _, agent := range o.agents {
		for _, cap := range agent.Capabilities {
			if cap == capability {
				matches = append(matches, agent)
				break
			}
		}
	}

	json.NewEncoder(w).Encode(matches)
}

type NegotiationRequest struct {
	RequesterID string `json:"requesterId"`
	TargetID    string `json:"targetId"`
	TaskDetails string `json:"taskDetails"`
}

type NegotiationResponse struct {
	SessionID string `json:"sessionId"`
	Status    string `json:"status"` // "accepted", "rejected", "negotiating"
}

func (o *Orchestrator) HandleNegotiate(w http.ResponseWriter, r *http.Request) {
	var req NegotiationRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	fmt.Printf("Negotiation Initiated: %s -> %s for task: %s\n", req.RequesterID, req.TargetID, req.TaskDetails)
	
	// Mock response for now
	resp := NegotiationResponse{
		SessionID: "sess-" + req.RequesterID[:4] + "-" + req.TargetID[:4],
		Status:    "accepted",
	}
	json.NewEncoder(w).Encode(resp)
}

type MemoryHookRequest struct {
	EntryID  string `json:"entryId"`
	Title    string `json:"title"`
	Category string `json:"category"`
	Content  string `json:"content"`
	AgentID  string `json:"agentId"`
}

func (o *Orchestrator) HandleMemoryHook(w http.ResponseWriter, r *http.Request) {
	var req MemoryHookRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	fmt.Printf("[Memory-Hook] Compounding decision from %s: %s\n", req.AgentID, req.Title)

	// Call the Python Wiki Compiler (Bridge to Mojo Kernel)
	go func(r MemoryHookRequest) {
		cmd := fmt.Sprintf("python3 /Users/<owner>/Desktop/A1-Inter-LLM-Com/The-New-Fuse/scripts/wiki_compiler.py '%s'", r.EntryID)
		// Note: Real implementation would pass the full JSON payload
		_ = cmd
	}(req)

	w.WriteHeader(http.StatusAccepted)
}

func main() {
	orc := NewOrchestrator()
	go orc.StartRouter()

	http.HandleFunc("/register", orc.RegisterAgent)
	http.HandleFunc("/send", orc.HandleMessage)
	http.HandleFunc("/ans", orc.HandleANS)
	http.HandleFunc("/negotiate", orc.HandleNegotiate)
	http.HandleFunc("/memory", orc.HandleMemoryHook)

	fmt.Println("TNF Go Orchestrator running on :3006")
	log.Fatal(http.ListenAndServe(":3006", nil))
}
