{ pkgs, ... }: {
  # Which nixpkgs channel to use.
  channel = "stable-23.11"; # or "unstable"

  # Use https://search.nixos.org/packages to find packages
  packages = [
    pkgs.nodejs_20  # For Node.js
    pkgs.yarn         # For Yarn
    pkgs.corepack     # For Corepack
  ];

  # Sets environment variables in the workspace
  env = {
    # Add any environment variables your project needs here
    # EXAMPLE_ENV_VAR = "example_value";
  };

  # Search for the extensions you want on https://open-vsx.org/ and use "publisher.id"
  idx.extensions = [
    "thenewfuse.the-new-fuse" # Your project's VS Code extension
  ];

  # Enable previews and customize configuration (optional)
  # idx.previews = {
  #   enable = true;
  #   previews = {
  #     web = {
  #       command = [
  #         "yarn" # or "npm"
  #         "run"
  #         "start" # replace 'start' with your actual start script if different
  #         "--"
  #         "--port"
  #         "$PORT"
  #         "--host"
  #         "0.0.0.0"
  #         "--disable-host-check"
  #       ];
  #       manager = "web";
  #       # Optionally, specify a directory that contains your web app
  #       # cwd = "app/client"; # replace with your web app's directory if needed
  #     };
  #   };
  # };
}
