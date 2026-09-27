# The family doorway

`npx wonder-wagon-ui` is the family's front door. The mark is the Reference Case
riding a pull wagon: a Bench Green enamel lid, a worn brass latch and handle, a
blackened-iron chassis and two brass wheels. Beside it are the wordmark, the
version, `WW-047`, and the family line: **One family. Different tools.**

Under the identity comes the roster. Each sibling's two-cell glyph and name use
its own signal colour, taken from its generated identity: Pathfinder's blaze
trail, Lorekeeper's gold star, Forge's bronze struck F and Lama's mint ears.
Then come the serial, how to start, and the approved tagline. Lama is marked
`draft` and has no start command until its identity is approved.

Wonder Wagon owns the grammar, and the doorway uses it the way the products do.
`renderCliIdentity` with `layout: "responsive"` does capability detection,
spacing, metadata placement and the narrow stack. `NO_COLOR` removes every
escape byte. `WW_ASCII=1` selects the ASCII wagon and glyphs but keeps colour.

## Contracts

| Invocation | Output |
|---|---|
| TTY, no args or `--help` | Identity, roster, sign-off |
| Piped, no args or `--help` | Plain roster, no escapes, even under `FORCE_COLOR` |
| `--version`, `-v` | The version only |
| Anything else | Usage on stderr, exit 2, no identity |

The package has no install scripts, so the doorway never runs unless someone
asks for it. `scripts/verify-pack.mjs` fails if an install hook appears. The
root and `/cli` entry points stay React-free and dependency-free, and the bin is
not part of the export map.

## Evidence

`python3 terminal/capture.py` packs the package, runs the tarball through
`npx --yes --package <tarball> -- wonder-wagon-ui` in real pseudo-terminals, and
writes the files in `specimens/`. `.ansi` files hold the exact bytes; `.txt`
files strip SGR only. `manifest.json` records width, environment, arguments and
exit status. Captures cover wide truecolor, 256-colour, ANSI-16, 40 columns,
`NO_COLOR`, `WW_ASCII`, `TERM=dumb`, `--help`, and the piped, `--version` and
unknown-argument contracts.
