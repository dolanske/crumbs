import a from "node:fs/promises";
const l = "?crumbs-page";
function s() {
  return {
    name: "page-html-as-raw",
    enforce: "pre",
    async resolveId(e, t, r) {
      if (e.includes("?") || !e.endsWith(".page.html") || r != null && r.scan)
        return null;
      const n = await this.resolve(e, t, { ...r, skipSelf: !0 });
      return !n || n.external ? null : n.id + l;
    },
    async load(e) {
      if (!e.endsWith(l))
        return null;
      const t = e.slice(0, -l.length);
      this.addWatchFile(t);
      const r = await a.readFile(t, "utf-8");
      return `export default ${JSON.stringify(r)}`;
    }
  };
}
export {
  s as default
};
