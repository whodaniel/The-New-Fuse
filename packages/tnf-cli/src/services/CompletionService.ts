const ZSH_COMPLETION = `#compdef tnf
###-begin-tnf-completions-###
#
# yargs command completion script
#
# Installation: tnf completion >> ~/.zshrc
# or tnf completion >> ~/.zprofile on OSX.
#

_tnf_yargs_completions()
{
  local reply
  local si=$IFS
  IFS=$'\\n' reply=($(COMP_CWORD="$((CURRENT-1))" COMP_LINE="$BUFFER" COMP_POINT="$CURSOR" tnf --get-yargs-completions "\${words[@]}"))
  IFS=$si
  if [[ \${#reply} -gt 0 ]]; then
    _describe 'values' reply
  else
    _default
  fi
}

if [[ '\${zsh_eval_context[-1]}' == "loadautofunc" ]]; then
  _tnf_yargs_completions "$@"
else
  compdef _tnf_yargs_completions tnf
fi
###-end-tnf-completions-###
`;

const BASH_COMPLETION = `###-begin-tnf-completions-###
#
# yargs command completion script
#
# Installation: tnf completion >> ~/.bashrc
# or tnf completion >> ~/.bash_profile on OSX.
#

_tnf_yargs_completions()
{
  local cur_word prev_word type

  cur_word="\${COMP_WORDS[COMP_CWORD]}"
  prev_word="\${COMP_WORDS[COMP_CWORD-1]}"
  type="\${COMP_WORDS[1]}"

  COMPREPLY=( $(compgen -W "\$(tnf --get-yargs-completions "\${COMP_WORDS[@]}")" -- "\${cur_word}") )
  return 0
}

complete -F _tnf_yargs_completions tnf
###-end-tnf-completions-###
`;

const FISH_COMPLETION = `###-begin-tnf-completions-###
#
# TNF CLI fish completion script
#
# Installation: tnf completion --shell fish > ~/.config/fish/completions/tnf.fish
#

complete -c tnf -f

# Top-level commands
complete -c tnf -n '__fish_use_subcommand' -a 'acp' -d 'Start ACP (Agent Client Protocol) server'
complete -c tnf -n '__fish_use_subcommand' -a 'agent' -d 'Manage agents'
complete -c tnf -n '__fish_use_subcommand' -a 'auth' -d 'Manage credentials'
complete -c tnf -n '__fish_use_subcommand' -a 'completion' -d 'Generate shell completion script'
complete -c tnf -n '__fish_use_subcommand' -a 'db' -d 'Database tools'
complete -c tnf -n '__fish_use_subcommand' -a 'debug' -d 'Debugging and troubleshooting tools'
complete -c tnf -n '__fish_use_subcommand' -a 'export' -d 'Export session data as JSON'
complete -c tnf -n '__fish_use_subcommand' -a 'import' -d 'Import session data from JSON file or URL'
complete -c tnf -n '__fish_use_subcommand' -a 'mcp' -d 'Manage MCP (Model Context Protocol) servers'
complete -c tnf -n '__fish_use_subcommand' -a 'models' -d 'List all available models'
complete -c tnf -n '__fish_use_subcommand' -a 'remote' -d 'Enable remote connection for real-time session relay'
complete -c tnf -n '__fish_use_subcommand' -a 'serve' -d 'Start a headless tnf server'
complete -c tnf -n '__fish_use_subcommand' -a 'session' -d 'Manage sessions'
complete -c tnf -n '__fish_use_subcommand' -a 'stats' -d 'Show token usage and cost statistics'
complete -c tnf -n '__fish_use_subcommand' -a 'upgrade' -d 'Upgrade tnf to the latest or a specific version'

# ... existing TNF commands
complete -c tnf -n '__fish_use_subcommand' -a 'boot' -d 'Master entry point to boot the entire TNF stack'
complete -c tnf -n '__fish_use_subcommand' -a 'chat' -d 'Start an interactive chat session'
complete -c tnf -n '__fish_use_subcommand' -a 'doctor' -d 'Run TNF diagnostics'
complete -c tnf -n '__fish_use_subcommand' -a 'list' -d 'List all registered agents'
complete -c tnf -n '__fish_use_subcommand' -a 'menu' -d 'Show an organized TNF command menu'
complete -c tnf -n '__fish_use_subcommand' -a 'onboard' -d 'Run TNF frontload onboarding'
complete -c tnf -n '__fish_use_subcommand' -a 'register' -d 'Register and listen as an agent'
complete -c tnf -n '__fish_use_subcommand' -a 'scripts' -d 'Discover and run repo scripts'
complete -c tnf -n '__fish_use_subcommand' -a 'send' -d 'Send a single message'
complete -c tnf -n '__fish_use_subcommand' -a 'splash' -d 'Render TNF branded splash only'
complete -c tnf -n '__fish_use_subcommand' -a 'voice' -d 'Voice Bridge commands'

###-end-tnf-completions-###
`;

export type ShellType = 'zsh' | 'bash' | 'fish';

export function generateCompletion(shell: ShellType = 'zsh'): string {
  switch (shell) {
    case 'bash':
      return BASH_COMPLETION;
    case 'fish':
      return FISH_COMPLETION;
    case 'zsh':
    default:
      return ZSH_COMPLETION;
  }
}

export function getInstallInstructions(shell: ShellType = 'zsh'): string {
  switch (shell) {
    case 'bash':
      return `# Add to ~/.bashrc or ~/.bash_profile:
tnf completion bash >> ~/.bashrc
# Then reload:
source ~/.bashrc
`;
    case 'fish':
      return `# Install to fish completions directory:
tnf completion fish > ~/.config/fish/completions/tnf.fish
# Then reload fish or restart terminal
`;
    case 'zsh':
    default:
      return `# Add to ~/.zshrc or ~/.zprofile (macOS):
tnf completion zsh >> ~/.zshrc
# Then reload:
source ~/.zshrc
`;
  }
}
