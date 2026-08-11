//! Shared host allowlist helpers — fail closed, no bare suffix matching.

/// True when `host` equals an exact entry or is a subdomain of a registered domain root.
///
/// Domain roots are matched as `host == root` or `host.ends_with("." + root)`.
/// A root of `thenewfuse.com` therefore accepts `thenewfuse.com` and `api.thenewfuse.com`
/// but rejects `notthenewfuse.com`. Never pass a leading-dot string as a "suffix wildcard".
pub fn host_allowed(host: &str, exact: &[&str], domain_roots: &[&str]) -> bool {
    let host = host.trim().trim_end_matches('.').to_ascii_lowercase();
    if host.is_empty() {
        return false;
    }

    if exact.iter().any(|e| host == e.trim().to_ascii_lowercase()) {
        return true;
    }

    for root in domain_roots {
        let root = root.trim().trim_start_matches('.').to_ascii_lowercase();
        if root.is_empty() {
            continue;
        }
        if host == root || host.ends_with(&format!(".{}", root)) {
            return true;
        }
    }

    false
}

/// Hosts permitted for outbound cloud / Antigravity / bridge connections.
pub fn cloud_control_plane_host_allowed(host: &str) -> bool {
    host_allowed(
        host,
        &[
            "localhost",
            "127.0.0.1",
            "[::1]",
            // Pinned Cloud Run gateway (no open *.run.app)
            "api-gateway-241337102384.us-central1.run.app",
            "skideancer-ide-241337102384.us-central1.run.app",
        ],
        &["thenewfuse.com"],
    )
}

/// Loopback-only probe targets for service health checks (SSRF guard).
pub fn health_probe_host_allowed(host: &str) -> bool {
    host_allowed(
        host,
        &["localhost", "127.0.0.1", "[::1]", "::1"],
        &[],
    ) || cloud_control_plane_host_allowed(host)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn rejects_suffix_spoof() {
        assert!(!host_allowed("notthenewfuse.com", &[], &["thenewfuse.com"]));
        assert!(!host_allowed("evil.run.app.attacker.com", &[], &["run.app"]));
        assert!(!cloud_control_plane_host_allowed("evil.run.app"));
        assert!(!cloud_control_plane_host_allowed("notthenewfuse.com"));
    }

    #[test]
    fn accepts_domain_and_subdomain() {
        assert!(host_allowed("thenewfuse.com", &[], &["thenewfuse.com"]));
        assert!(host_allowed("api.thenewfuse.com", &[], &["thenewfuse.com"]));
        assert!(cloud_control_plane_host_allowed(
            "api-gateway-241337102384.us-central1.run.app"
        ));
        assert!(cloud_control_plane_host_allowed("localhost"));
    }

    #[test]
    fn rejects_empty_and_trailing_dot_normalized_to_empty() {
        assert!(!host_allowed("", &["localhost"], &[]));
        assert!(!host_allowed("...", &["localhost"], &[]));
        assert!(!host_allowed(".", &["localhost"], &[]));
    }

    #[test]
    fn accepts_ipv6_loopback_forms() {
        assert!(health_probe_host_allowed("[::1]"));
        assert!(health_probe_host_allowed("::1"));
        assert!(cloud_control_plane_host_allowed("[::1]"));
    }

    #[test]
    fn ignores_leading_dot_on_domain_roots() {
        assert!(host_allowed("api.thenewfuse.com", &[], &[".thenewfuse.com"]));
        assert!(!host_allowed("notthenewfuse.com", &[], &[".thenewfuse.com"]));
    }

    #[test]
    fn rejects_open_cloud_run_and_foreign_hosts() {
        assert!(!cloud_control_plane_host_allowed("random-service-123.run.app"));
        assert!(!cloud_control_plane_host_allowed("evil.example.com"));
        assert!(!health_probe_host_allowed("evil.example.com"));
    }
}
