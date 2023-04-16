let tempDir;
export async function info(specifier, options) {
  const cmd = [
    Deno.execPath(),
    "info",
    "--json"
  ];
  if (options.importMap !== void 0) {
    cmd.push("--import-map", options.importMap);
  }
  cmd.push(specifier.href);
  if (!tempDir) {
    tempDir = Deno.makeTempDirSync();
  }
  let proc;
  try {
    proc = Deno.run({
      cmd,
      stdout: "piped",
      cwd: tempDir
    });
    const raw = await proc.output();
    const status = await proc.status();
    if (!status.success) {
      throw new Error(`Failed to call 'deno info' on '${specifier.href}'`);
    }
    const txt = new TextDecoder().decode(raw);
    return JSON.parse(txt);
  } finally {
    try {
      proc?.stdout.close();
    } catch (err) {
      if (err instanceof Deno.errors.BadResource) {
      } else {
        throw err;
      }
    }
    proc?.close();
  }
}
