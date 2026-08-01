// Indian-student-focused channels to boost in ranking. Results are NOT
// restricted to these — every search result is ranked, but videos from these
// channels get a multiplier so trusted educators float to the top.
// `match` strings are checked (case-insensitive) against the channel title.

export const BOOSTED_CHANNELS = [
  { name: 'CampusX', match: ['campusx'], boost: 0.45 },
  { name: '100xDevs / Harkirat', match: ['100xdevs', 'harkirat'], boost: 0.45 },
  { name: 'CodeWithHarry', match: ['codewithharry', 'code with harry'], boost: 0.4 },
  { name: 'Apna College', match: ['apna college'], boost: 0.4 },
  { name: 'take U forward (Striver)', match: ['take u forward', 'takeuforward', 'striver'], boost: 0.4 },
  { name: 'Telusko', match: ['telusko'], boost: 0.35 },
  { name: 'Krish Naik', match: ['krish naik'], boost: 0.35 },
  { name: 'codebasics', match: ['codebasics'], boost: 0.35 },
  { name: 'Love Babbar', match: ['love babbar', 'babbar'], boost: 0.3 },
  { name: 'Kunal Kushwaha', match: ['kunal kushwaha'], boost: 0.3 },
]

// Returns { boost, name } for a channel title, or { boost: 0 } if not boosted.
export function channelBoost(channelTitle = '') {
  const t = channelTitle.toLowerCase()
  for (const c of BOOSTED_CHANNELS) {
    if (c.match.some((m) => t.includes(m))) {
      return { boost: c.boost, name: c.name }
    }
  }
  return { boost: 0, name: null }
}
