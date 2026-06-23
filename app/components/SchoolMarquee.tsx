"use client";

const SCHOOLS = [
  { name: "University of Michigan", file: "Michigan.png" },
  { name: "Northwestern University", file: "Northwestern.png" },
  { name: "Indiana University", file: "indiana-university.png" },
  { name: "Ohio State University", file: "Ohio State.png" },
  { name: "University of Georgia", file: "GEORGIA-FS-FC.png" },
  { name: "University of Maryland", file: "Maryland.png" },
  { name: "Tulane University", file: "Tulane_logo.svg.png" },
  { name: "UNC Chapel Hill", file: "UNC.png" },
  { name: "University of Miami", file: "University-Of-Miami-Symbol.png" },
  { name: "University of Florida", file: "University-of-Florida-Logo.png" },
  { name: "Washington University", file: "WashU-RGB.png" },
  { name: "Columbia University", file: "columbia-university-logo-ivy-league-universities.png" },
  { name: "Syracuse University", file: "syracuse.png" },
  { name: "UCLA", file: "uclalogo.png" },
];

export default function SchoolMarquee() {
  const doubled = [...SCHOOLS, ...SCHOOLS];

  return (
    <section style={{ background: "#fff", padding: "52px 0", borderTop: "1px solid rgba(11,23,41,.06)", borderBottom: "1px solid rgba(11,23,41,.06)", overflow: "hidden" }}>
      <p style={{ textAlign: "center", fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 600, letterSpacing: ".1em", textTransform: "uppercase", color: "rgba(11,23,41,.35)", marginBottom: 28 }}>
        Students attending these schools are already getting the edge
      </p>
      <div className="marquee-track">
        <div className="marquee-inner">
          {doubled.map((school, i) => (
            <div key={i} className="marquee-logo">
              <img
                src={`/${school.file}`}
                alt={school.name}
                style={{ height: 52, width: "auto", maxWidth: 140, objectFit: "contain", opacity: 0.85, transition: "opacity .2s" }}
                onMouseEnter={e => { (e.target as HTMLImageElement).style.opacity = "1"; }}
                onMouseLeave={e => { (e.target as HTMLImageElement).style.opacity = "0.85"; }}
              />
            </div>
          ))}
        </div>
      </div>
      <style>{`
        .marquee-track { width: 100%; overflow: hidden; }
        .marquee-inner {
          display: flex; align-items: center; gap: 56px;
          width: max-content;
          animation: marquee-scroll 36s linear infinite;
        }
        .marquee-inner:hover { animation-play-state: paused; }
        .marquee-logo { display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        @keyframes marquee-scroll {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
      `}</style>
    </section>
  );
}
