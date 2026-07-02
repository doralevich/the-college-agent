// Primary brand colors for well-known US schools, matched by substring against the
// free-text school name a student gave during intake. Used as the accent behind the
// chat pane (a faded wash, never a solid fill). Unknown schools fall back to the
// College Agent green so the page always has a deliberate accent.
//
// Order matters: more specific names come before their prefixes ("michigan state"
// before "michigan", "texas a&m" before "texas").

export const DEFAULT_ACCENT = "#2D7A3A";

const SCHOOL_COLORS: Array<[pattern: string, hex: string]> = [
  ["michigan state", "#18453B"],
  ["ohio state", "#BB0000"],
  ["penn state", "#041E42"],
  ["arizona state", "#8C1D40"],
  ["georgia tech", "#B3A369"],
  ["texas a&m", "#500000"],
  ["notre dame", "#0C2340"],
  ["boston university", "#CC0000"],
  ["boston college", "#98002E"],
  ["michigan", "#00274C"],
  ["georgia", "#BA0C2F"],
  ["maryland", "#E21833"],
  ["northwestern", "#4E2A84"],
  ["tulane", "#006747"],
  ["north carolina", "#4B9CD3"],
  ["unc", "#4B9CD3"],
  ["miami", "#F47321"],
  ["florida", "#0021A5"],
  ["columbia", "#003DA5"],
  ["ucla", "#2774AE"],
  ["duke", "#012169"],
  ["texas", "#BF5700"],
  ["alabama", "#9E1B32"],
  ["auburn", "#0C2340"],
  ["lsu", "#461D7C"],
  ["louisiana state", "#461D7C"],
  ["clemson", "#F56600"],
  ["tennessee", "#FF8200"],
  ["wisconsin", "#C5050C"],
  ["indiana", "#990000"],
  ["illinois", "#E84A27"],
  ["usc", "#990000"],
  ["southern california", "#990000"],
  ["stanford", "#8C1515"],
  ["berkeley", "#003262"],
  ["harvard", "#A51C30"],
  ["yale", "#00356B"],
  ["princeton", "#E77500"],
  ["cornell", "#B31B1B"],
  ["brown", "#4E3629"],
  ["dartmouth", "#00693E"],
  ["penn", "#011F5B"],
  ["nyu", "#57068C"],
  ["new york university", "#57068C"],
  ["syracuse", "#D44500"],
  ["villanova", "#00205B"],
  ["georgetown", "#041E42"],
  ["purdue", "#9D7A2C"],
  ["oregon", "#154733"],
  ["washington", "#4B2E83"],
  ["virginia", "#232D4B"],
  ["rutgers", "#CC0033"],
  ["pittsburgh", "#003594"],
  ["vanderbilt", "#866D4B"],
  ["rice", "#00205B"],
  ["baylor", "#154734"],
  ["oklahoma", "#841617"],
  ["nebraska", "#E41C38"],
  ["iowa", "#FFCD00"],
  ["minnesota", "#7A0019"],
  ["missouri", "#F1B82D"],
  ["kentucky", "#0033A0"],
  ["arkansas", "#9D2235"],
  ["colorado", "#CFB87C"],
  ["utah", "#CC0000"],
];

export function schoolAccentColor(school: string | null | undefined): string {
  if (!school) return DEFAULT_ACCENT;
  const norm = school.toLowerCase();
  for (const [pattern, hex] of SCHOOL_COLORS) {
    if (norm.includes(pattern)) return hex;
  }
  return DEFAULT_ACCENT;
}
