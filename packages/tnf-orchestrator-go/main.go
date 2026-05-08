package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"sync"
	"sync/atomic"

	"gopkg.in/yaml.v3"
)

type AgentCard struct {
	AgentID      string   `json:"agentId"`
	Name         string   `json:"name"`
	Endpoint     string   `json:"endpoint"`
	Capabilities []string `json:"capabilities"`
}

type Message struct {
	SenderID   string          `json:"senderId"`
	ReceiverID string          `json:"receiverId"`
	Payload    json.RawMessage `json:"payload"`
}

type Orchestrator struct {
	agents      map[string]AgentCard
	mu          sync.RWMutex
	bus         chan Message
	droppedMsgs int64
}

const BusCapacity = 1000

func NewOrchestrator() *Orchestrator {
	return &Orchestrator{
		agents:      make(map[string]AgentCard),
		bus:         make(chan Message, BusCapacity),
		droppedMsgs: 0,
	}
}

func (o *Orchestrator) RegisterAgent(w http.ResponseWriter, r *http.Request) {
	var card AgentCard
	if err := json.NewDecoder(r.Body).Decode(&card); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	score := o.CalculateAARS(card)
	fmt.Printf("Agent Registered: %s (AARS: %.2f)\n", card.Name, score)

	o.mu.Lock()
	o.agents[card.AgentID] = card
	o.mu.Unlock()

	w.WriteHeader(http.StatusCreated)
}

func (o *Orchestrator) CalculateAARS(card AgentCard) float64 {
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

	select {
	case o.bus <- msg:
		w.WriteHeader(http.StatusAccepted)
	default:
		atomic.AddInt64(&o.droppedMsgs, 1)
		log.Printf("Bus full (%d capacity), dropping message from %s to %s (total dropped: %d)\n",
			BusCapacity, msg.SenderID, msg.ReceiverID, atomic.LoadInt64(&o.droppedMsgs))
		http.Error(w, "message bus at capacity, retry later", http.StatusServiceUnavailable)
	}
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
	Status    string `json:"status"`
}

func (o *Orchestrator) HandleNegotiate(w http.ResponseWriter, r *http.Request) {
	var req NegotiationRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	fmt.Printf("Negotiation Initiated: %s -> %s for task: %s\n", req.RequesterID, req.TargetID, req.TaskDetails)

	reqID := req.RequesterID
	tgtID := req.TargetID
	if len(reqID) > 4 {
		reqID = reqID[:4]
	}
	if len(tgtID) > 4 {
		tgtID = tgtID[:4]
	}
	resp := NegotiationResponse{
		SessionID: "sess-" + reqID + "-" + tgtID,
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

	go func(r MemoryHookRequest) {
		scriptPath := os.Getenv("TNF_WIKI_COMPILER_PATH")
		if scriptPath == "" {
			exe, err := os.Executable()
			if err != nil {
				log.Printf("[Memory-Hook] Failed to resolve executable path: %v\n", err)
				return
			}
			projectRoot := filepath.Dir(filepath.Dir(filepath.Dir(exe)))
			scriptPath = filepath.Join(projectRoot, "scripts", "wiki_compiler.py")
		}
		if _, err := os.Stat(scriptPath); err != nil {
			log.Printf("[Memory-Hook] Wiki compiler script not found at %s: %v\n", scriptPath, err)
			return
		}
		cmd := exec.Command("python3", scriptPath, r.EntryID)
		if err := cmd.Run(); err != nil {
			log.Printf("[Memory-Hook] Wiki compiler failed for %s: %v\n", r.EntryID, err)
		}
	}(req)

	w.WriteHeader(http.StatusAccepted)
}

type GooseRecipe struct {
	Version      string `yaml:"version"`
	Title        string `yaml:"title"`
	Description  string `yaml:"description"`
	Instructions string `yaml:"instructions"`
	Extensions   []struct {
		Type string   `yaml:"type"`
		Name string   `yaml:"name"`
		Args []string `yaml:"args"`
	} `yaml:"extensions"`
}

func (o *Orchestrator) IngestGooseRecipe(w http.ResponseWriter, r *http.Request) {
	var recipe GooseRecipe
	if err := yaml.NewDecoder(r.Body).Decode(&recipe); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	fmt.Printf("[Borg-Deconstruction] Assimilating Goose Recipe: %s\n", recipe.Title)

	go o.ExecuteAssimilatedGoose(recipe)

	w.WriteHeader(http.StatusAccepted)
}

func (o *Orchestrator) ExecuteAssimilatedGoose(recipe GooseRecipe) {
	fmt.Printf("[Native-Execution] Running '%s' at native speed...\n", recipe.Title)
	for _, ext := range recipe.Extensions {
		fmt.Printf(" -> Activating Extension: %s (%s)\n", ext.Name, ext.Type)
	}
}

func main() {
	orc := NewOrchestrator()
	go orc.StartRouter()

	http.HandleFunc("/register", orc.RegisterAgent)
	http.HandleFunc("/send", orc.HandleMessage)
	http.HandleFunc("/ans", orc.HandleANS)
	http.HandleFunc("/negotiate", orc.HandleNegotiate)
	http.HandleFunc("/memory", orc.HandleMemoryHook)
	http.HandleFunc("/ingest/goose", orc.IngestGooseRecipe)

	fmt.Println("TNF Go Orchestrator running on :3006")
	log.Fatal(http.ListenAndServe(":3006", nil))
}
