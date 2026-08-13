package main

import (
	"bufio"
	"encoding/binary"
	"encoding/json"
	"fmt"
	"io"
	"os"
	"os/exec"
	"runtime"
	"sort"

	"github.com/shirou/gopsutil/v3/net"
	"github.com/shirou/gopsutil/v3/process"
)

// Message represents the JSON structure for Chrome Native Messaging
type Message struct {
	Command string `json:"command"`
	Port    int    `json:"port"`
	Cmd     string `json:"cmd"`
}

// Response represents the JSON structure for the host's reply
type Response struct {
	Success bool        `json:"success"`
	Ports   []PortInfo  `json:"ports,omitempty"`
	Error   string      `json:"error,omitempty"`
	Output  string      `json:"output,omitempty"`
}

// PortInfo represents details about an active port
type PortInfo struct {
	Port    uint32 `json:"port"`
	PID     int32  `json:"pid"`
	Name    string `json:"name"`
	Command string `json:"command"`
	Status  string `json:"status"`
}

func readMessage(r io.Reader) ([]byte, error) {
	var length uint32
	if err := binary.Read(r, binary.LittleEndian, &length); err != nil {
		return nil, err
	}
	msg := make([]byte, length)
	if _, err := io.ReadFull(r, msg); err != nil {
		return nil, err
	}
	return msg, nil
}

func sendMessage(w io.Writer, msg interface{}) error {
	data, err := json.Marshal(msg)
	if err != nil {
		return err
	}
	if err := binary.Write(w, binary.LittleEndian, uint32(len(data))); err != nil {
		return err
	}
	_, err = w.Write(data)
	return err
}

func listActivePorts() ([]PortInfo, error) {
	connections, err := net.Connections("inet")
	if err != nil {
		return nil, err
	}

	portMap := make(map[uint32]PortInfo)
	for _, conn := range connections {
		if conn.Status == "LISTEN" && (conn.Laddr.IP == "127.0.0.1" || conn.Laddr.IP == "0.0.0.0" || conn.Laddr.IP == "::1" || conn.Laddr.IP == "::") {
			p, err := process.NewProcess(conn.Pid)
			name := "unknown"
			cmdline := ""
			if err == nil {
				name, _ = p.Name()
				cmdline, _ = p.Cmdline()
			}
			
			portMap[conn.Laddr.Port] = PortInfo{
				Port:    conn.Laddr.Port,
				PID:     conn.Pid,
				Name:    name,
				Command: cmdline,
				Status:  "active",
			}
		}
	}

	var ports []PortInfo
	for _, info := range portMap {
		ports = append(ports, info)
	}

	sort.Slice(ports, func(i, j int) bool {
		return ports[i].Port < ports[j].Port
	})

	return ports, nil
}

func executeCommand(cmdStr string) (string, error) {
	var cmd *exec.Cmd
	if runtime.GOOS == "windows" {
		cmd = exec.Command("cmd", "/C", cmdStr)
	} else {
		cmd = exec.Command("sh", "-c", cmdStr)
	}
	out, err := cmd.CombinedOutput()
	return string(out), err
}

func main() {
	reader := bufio.NewReader(os.Stdin)
	for {
		msgData, err := readMessage(reader)
		if err != nil {
			if err == io.EOF {
				break
			}
			continue
		}

		var msg Message
		if err := json.Unmarshal(msgData, &msg); err != nil {
			continue
		}

		var resp Response
		switch msg.Command {
		case "list_ports":
			ports, err := listActivePorts()
			if err != nil {
				resp = Response{Success: false, Error: err.Error()}
			} else {
				resp = Response{Success: true, Ports: ports}
			}
		case "execute":
			output, err := executeCommand(msg.Cmd)
			if err != nil {
				resp = Response{Success: false, Error: err.Error(), Output: output}
			} else {
				resp = Response{Success: true, Output: output}
			}
		case "kill":
			// Safely kill a process by PID (passed via port in this simple version or add PID to Message)
			cmd := fmt.Sprintf("kill -9 %d", msg.Port) // msg.Port reused as PID for simplicity here
			if runtime.GOOS == "windows" {
				cmd = fmt.Sprintf("taskkill /F /PID %d", msg.Port)
			}
			output, err := executeCommand(cmd)
			if err != nil {
				resp = Response{Success: false, Error: err.Error(), Output: output}
			} else {
				resp = Response{Success: true, Output: output}
			}
		default:
			resp = Response{Success: false, Error: "Unknown command"}
		}

		sendMessage(os.Stdout, resp)
	}
}
