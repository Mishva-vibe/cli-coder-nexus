import { platform } from "node:os";

const isWindows = platform() === "win32";

/* Quote a single argument so the user shell treats it as one literal word.
   Prevents shell injection via custom-agent args (Issue #3). */
export function shellEscape(arg: string): string {
  if (isWindows) {
    // cmd.exe: wrap in double quotes; double any internal quotes; escape % for env expansion
    if (!/[\s"&|<>^%()!;,]/.test(arg)) return arg;
    return '"' + arg.replace(/%/g, "%%").replace(/"/g, '""') + '"';
  }
  // POSIX: single-quote, escape embedded single quotes
  if (!/[^A-Za-z0-9_\/.,:=+@-]/.test(arg)) return arg;
  return "'" + arg.replace(/'/g, "'\\''") + "'";
}

export function buildCommand(binary: string, args: string[]): string {
  return [binary, ...args].map(shellEscape).join(" ");
}
