import a from "node:fs/promises";
const l = "?crumbs-page";
function i() {
  return {
    name: "page-html-as-raw",
    enforce: "pre",
    async resolveId(e, t, n) {
      if (e.includes("?") || !e.endsWith(".page.html"))
        return null;
      const r = await this.resolve(e, t, { ...n, skipSelf: !0 });
      return !r || r.external ? null : r.id + l;
    },
    async load(e) {
      if (!e.endsWith(l))
        return null;
      const t = e.slice(0, -l.length);
      this.addWatchFile(t);
      const n = await a.readFile(t, "utf-8");
      return `export default ${JSON.stringify(n)}`;
    }
  };
}
export {
  i as default
};
