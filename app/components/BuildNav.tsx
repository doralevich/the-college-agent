import Image from "next/image";
import Link from "next/link";

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
        <Link href="/">
          <Image
            src="/logo-college-agent.svg"
            alt="The College [Agent]"
            width={310}
            height={30}
            priority
            style={{ width: "min(240px, calc(100vw - 96px))", height: "auto", display: "block" }}
          />
        </Link>
      </div>
    </nav>
  );
}
