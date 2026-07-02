# Real MRT coordinates back distance calculations, not just the map

**Status:** accepted

PRD Section 5 always called for the Inventory API to "calculate distances between sites" for donor ranking, but never specified how — it was a hand-wave. Separately, the dashboard needed a map view for the demo. Rather than building two disconnected things (an arbitrary distance-tier lookup for ranking, plus cosmetic map pins), each store is pinned to a real Eastern Singapore MRT station's lat/long (PRD Section 3), and the Inventory API computes real haversine distance between those coordinates. The same numbers drive donor-candidate ranking, courier ETA narration, and the map view.

**Considered:** cosmetic-only map pins with a manually assigned distance tier per site pair for ranking. Rejected — maintaining two sources of truth for "how far apart are these sites" invites them drifting inconsistent, and real coordinates cost almost nothing extra (a static lookup table of ~13 known MRT stations).
