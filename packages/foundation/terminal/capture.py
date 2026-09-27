#!/usr/bin/env python3
"""Capture `npx wonder-wagon-ui` from the packed tarball in real pseudo-terminals.

    npm run build && python3 terminal/capture.py

Each case writes <name>.ansi (the exact bytes, PTY carriage returns removed)
and <name>.txt (SGR removed, for reading); manifest.json records the command,
width, environment, and exit status. Piped cases run without a PTY.
"""

import json, os, pty, re, select, struct, fcntl, termios, subprocess, sys, tempfile, shutil

HERE = os.path.dirname(os.path.abspath(__file__))
PACKAGE = os.path.dirname(HERE)
OUT = os.path.join(HERE, "specimens")
BASE = {"PATH": os.environ["PATH"], "HOME": os.environ.get("HOME", "/tmp"), "LANG": "en_US.UTF-8",
        "npm_config_update_notifier": "false", "npm_config_fund": "false", "npm_config_audit": "false",
        "npm_config_progress": "false", "npm_config_loglevel": "silent"}
CASES = [
    ("wide", 100, {"COLORTERM": "truecolor", "TERM": "xterm-256color"}, []),
    ("ansi256", 100, {"TERM": "xterm-256color"}, []),
    ("ansi16", 100, {"TERM": "xterm"}, []),
    ("narrow", 40, {"COLORTERM": "truecolor", "TERM": "xterm-256color"}, []),
    ("no-color", 100, {"NO_COLOR": "1", "TERM": "xterm-256color"}, []),
    ("ascii", 100, {"WW_ASCII": "1", "COLORTERM": "truecolor", "TERM": "xterm-256color"}, []),
    ("dumb", 100, {"TERM": "dumb"}, []),
    ("help", 100, {"COLORTERM": "truecolor", "TERM": "xterm-256color"}, ["--help"]),
]
PIPED = [
    ("piped", {"FORCE_COLOR": "3"}, []),
    ("version", {"FORCE_COLOR": "3"}, ["--version"]),
    ("unknown", {"FORCE_COLOR": "3"}, ["--json"]),
]
SGR = re.compile(r"\x1b\[[0-9;]*m")


def run_pty(argv, env, columns):
    pid, fd = pty.fork()
    if pid == 0:
        os.execvpe(argv[0], argv, env)
    fcntl.ioctl(fd, termios.TIOCSWINSZ, struct.pack("HHHH", 50, columns, 0, 0))
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


def main():
    os.makedirs(OUT, exist_ok=True)
    work = tempfile.mkdtemp(prefix="ww-doorway-")
    try:
        packed = subprocess.run(["npm", "pack", "--json", "--pack-destination", work], cwd=PACKAGE,
                                check=True, capture_output=True, text=True).stdout
        tarball = os.path.join(work, json.loads(packed[packed.index("["):])[0]["filename"])
        argv = ["npx", "--yes", "--package", tarball, "--", "wonder-wagon-ui"]
        manifest = []
        for name, columns, extra, args in CASES:
            env = {**BASE, **extra}
            # The PTY window size is authoritative; npx must not see an inherited COLUMNS.
            data, code = run_pty(argv + args, env, columns)
            write(name, data)
            manifest.append({"name": name, "tty": True, "columns": columns, "env": extra,
                             "args": ["npx", "wonder-wagon-ui", *args], "exit": code})
        for name, extra, args in PIPED:
            result = subprocess.run(argv + args, env={**BASE, **extra}, capture_output=True, cwd=work)
            write(name, result.stdout + result.stderr)
            manifest.append({"name": name, "tty": False, "env": extra, "args": ["npx", "wonder-wagon-ui", *args],
                             "exit": result.returncode, "stdout_bytes": len(result.stdout),
                             "stderr_bytes": len(result.stderr)})
        with open(os.path.join(OUT, "manifest.json"), "w") as handle:
            json.dump(manifest, handle, indent=2)
            handle.write("\n")
        print(f"wonder-wagon-ui doorway: {len(manifest)} captures")
    finally:
        shutil.rmtree(work, ignore_errors=True)


def write(name, data):
    with open(os.path.join(OUT, f"{name}.ansi"), "wb") as handle:
        handle.write(data)
    with open(os.path.join(OUT, f"{name}.txt"), "w") as handle:
        handle.write(SGR.sub("", data.decode("utf-8")))


if __name__ == "__main__":
    sys.exit(main())
