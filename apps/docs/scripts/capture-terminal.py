#!/usr/bin/env python3
"""Capture the four released terminal identities from their PUBLIC npm packages.

    python3 apps/docs/scripts/capture-terminal.py           # rewrite captures + manifest
    python3 apps/docs/scripts/capture-terminal.py --check   # recapture, compare, write nothing

Each package is installed at its pinned public version from registry.npmjs.org into a
throwaway prefix with a throwaway npm cache (install scripts off), then its own bin runs
in a real pseudo-terminal at a fixed width. Bytes are stored as the terminal received
them; the only normalisation is the PTY's CRLF -> LF. Piped cases run with no PTY.

The catalog build reads these files and never touches the network.
"""

import hashlib, json, os, pty, select, shutil, struct, subprocess, sys, fcntl, termios, tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(os.path.dirname(HERE), "src", "evidence", "terminal")
REGISTRY = "https://registry.npmjs.org/"

# The public releases this catalog describes. Changing a version here is the only way
# the captures change.
PRODUCTS = [
    {"id": "wonder-wagon", "package": "wonder-wagon-ui", "version": "0.3.0", "bin": "wonder-wagon-ui",
     "args": [], "cwd": "empty", "why": "the family doorway: npx wonder-wagon-ui"},
    {"id": "pathfinder", "package": "create-pathfinder", "version": "4.5.0", "bin": "create-pathfinder",
     "args": ["--dry-run", "--yes"], "cwd": "git",
     "why": "a dry run in an empty Git repository; nothing is written"},
    {"id": "lorekeeper", "package": "create-lorekeeper", "version": "0.3.0", "bin": "lore",
     "args": ["--help"], "cwd": "empty", "why": "the CLI's help, where its identity block is shown"},
    {"id": "forge", "package": "forge-local-ai-kit", "version": "0.2.0", "bin": "forge",
     "args": ["--help"], "cwd": "empty", "why": "the CLI's help, where its identity block is shown"},
]

TRUE = {"COLORTERM": "truecolor", "TERM": "xterm-256color"}
TIERS = [
    # name, columns, env, tty
    ("wide", 100, TRUE, True),
    ("narrow", 40, TRUE, True),
    ("ansi256", 100, {"TERM": "xterm-256color"}, True),
    ("no-color", 100, {**TRUE, "NO_COLOR": "1"}, True),
    ("ascii", 100, {**TRUE, "WW_ASCII": "1"}, True),
    ("dumb", 100, {"TERM": "dumb"}, True),
    ("piped", None, TRUE, False),
]


def base_env(work, home):
    # A PATH holding only node and git, so a product that notes which agent tools are
    # installed reports this capture's machine as having none, not the maintainer's.
    tools = os.path.join(work, "bin")
    os.makedirs(tools)
    for name in ("node", "git"):
        os.symlink(shutil.which(name), os.path.join(tools, name))
    return {"PATH": os.pathsep.join([tools, "/usr/bin", "/bin"]),
            "HOME": home, "LANG": "en_US.UTF-8", "LC_ALL": "en_US.UTF-8"}


def run_pty(argv, env, columns, cwd):
    pid, fd = pty.fork()
    if pid == 0:
        os.chdir(cwd)
        os.execvpe(argv[0], argv, env)
    fcntl.ioctl(fd, termios.TIOCSWINSZ, struct.pack("HHHH", 40, columns, 0, 0))
    chunks = []
    while True:
        try:
            ready, _, _ = select.select([fd], [], [], 60)
            if not ready:
                break
            data = os.read(fd, 65536)
        except OSError:
            break
        if not data:
            break
        chunks.append(data)
    _, status = os.waitpid(pid, 0)
    return b"".join(chunks).replace(b"\r\n", b"\n"), os.waitstatus_to_exitcode(status)


def install(product, work):
    prefix = os.path.join(work, "install", product["id"])
    os.makedirs(prefix)
    spec = f'{product["package"]}@{product["version"]}'
    subprocess.run(["npm", "install", "--prefix", prefix, "--ignore-scripts", "--no-audit",
                    "--no-fund", "--registry", REGISTRY, "--cache", os.path.join(work, "npm-cache"), spec],
                   check=True, capture_output=True)
    meta = json.load(open(os.path.join(prefix, "node_modules", product["package"], "package.json")))
    assert meta["version"] == product["version"], (spec, meta["version"])
    lock = json.load(open(os.path.join(prefix, "package-lock.json")))
    key = next(k for k in lock["packages"] if k.endswith(f'node_modules/{product["package"]}'))
    integrity = lock["packages"][key]["integrity"]
    return os.path.join(prefix, "node_modules", ".bin", product["bin"]), integrity


def main():
    check = "--check" in sys.argv
    work = os.path.realpath(tempfile.mkdtemp(prefix="ww-catalog-capture-"))
    home = os.path.join(work, "home")
    os.makedirs(home)
    env0 = base_env(work, home)
    captures, products, results = [], [], {}
    try:
        for product in PRODUCTS:
            binary, integrity = install(product, work)
            products.append({k: product[k] for k in ("id", "package", "version", "bin", "why")}
                            | {"integrity": integrity, "args": product["args"]})
            for name, columns, extra, tty in TIERS:
                cwd = os.path.join(work, "demo-project")
                shutil.rmtree(cwd, ignore_errors=True)
                os.makedirs(cwd)
                if product["cwd"] == "git":
                    subprocess.run(["git", "init", "-q", cwd], check=True)
                env = {**env0, **extra}
                argv = [binary, *product["args"]]
                if tty:
                    data, code = run_pty(argv, env, columns, cwd)
                else:
                    done = subprocess.run(argv, env=env, cwd=cwd, capture_output=True)
                    data, code = done.stdout + done.stderr, done.returncode
                data = data.replace(work.encode(), b"/tmp/ww-catalog").replace(
                    os.path.realpath(work).encode(), b"/tmp/ww-catalog")
                rel = f'{product["id"]}/{name}.ansi'
                results[rel] = data
                captures.append({"product": product["id"], "tier": name, "file": rel, "tty": tty,
                                 "columns": columns, "env": extra,
                                 "command": " ".join(["npx", f'{product["package"]}@{product["version"]}',
                                                      *product["args"]]),
                                 "exit": code, "bytes": len(data),
                                 "sha256": hashlib.sha256(data).hexdigest()})
    finally:
        shutil.rmtree(work, ignore_errors=True)

    manifest = {
        "about": "Real PTY captures of the public npm packages. Bytes as received; CRLF -> LF only. "
                 "The temporary working directory is written as /tmp/ww-catalog.",
        "registry": REGISTRY,
        "products": products,
        "tiers": [{"name": n, "columns": c, "env": e, "tty": t} for n, c, e, t in TIERS],
        "captures": captures,
    }
    if check:
        stale = [rel for rel, data in results.items()
                 if not os.path.exists(os.path.join(OUT, rel)) or open(os.path.join(OUT, rel), "rb").read() != data]
        old = json.load(open(os.path.join(OUT, "manifest.json")))
        if stale or old != manifest:
            print("capture-terminal: stale: " + (", ".join(stale) or "manifest.json"))
            sys.exit(1)
        print(f"capture-terminal: {len(results)} captures match the public packages")
        return
    for rel, data in results.items():
        os.makedirs(os.path.dirname(os.path.join(OUT, rel)), exist_ok=True)
        open(os.path.join(OUT, rel), "wb").write(data)
    with open(os.path.join(OUT, "manifest.json"), "w") as handle:
        json.dump(manifest, handle, indent=2)
        handle.write("\n")
    print(f"capture-terminal: wrote {len(results)} captures")


if __name__ == "__main__":
    main()
