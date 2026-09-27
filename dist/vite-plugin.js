import n from "node:fs/promises";
function f() {
  return {
    name: "page-html-as-raw",
    enforce: "pre",
    async load(e) {
      const [t] = e.split("?");
      if (!t.endsWith(".page.html"))
        return null;
      const r = await n.readFile(t, "utf-8");
      return `export default ${JSON.stringify(r)}`;
    }
  };
}
export {
  f as default
};
