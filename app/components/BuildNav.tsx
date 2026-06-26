export default function BuildNav() {
  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
      background: "#fff", borderBottom: "1px solid rgba(11,23,41,.08)",
      boxShadow: "0 1px 4px rgba(11,23,41,.06)",
    }}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        height: 72, maxWidth: 1400, margin: "0 auto", padding: "0 48px",
      }}>
        <a href="/">
          <img
            src="/logo-college-agent.svg"
            alt="The College [Agent]"
            style={{ height: 72, width: "auto", display: "block" }}
          />
        </a>
      </div>
    </nav>
  );
}
