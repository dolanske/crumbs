let R = {}, h = [], g = "", a;
function L() {
  return structuredClone(a);
}
function M(t) {
  R = Object.freeze(t);
  const e = Object.entries(t).map(([r, o]) => typeof o == "string" ? {
    html: o,
    renderedHtml: d(o),
    path: r
  } : {
    ...o,
    path: r,
    renderedHtml: d(o.html)
  });
  h = e;
  function n(r) {
    m(r.state.path);
  }
  return {
    /**
     * Start the router.
     *
     * @param selector DOM selector
     */
    run: (r) => {
      g = r, window.addEventListener("popstate", n), E(), m(k(e));
    },
    /**
     * Stops the router. Navigation will no longer work.
     */
    stop() {
      window.removeEventListener("popstate", n);
    }
  };
}
function k(t) {
  let e;
  if (e = t.find((n) => n.default || n.path === "/"), e || (e = t.sort((n, r) => n.path.length - r.path.length)[0], e))
    return e.path;
  throw new Error("No default route found. Please define one by settings its path to `/` or adding the `default` property to the route definitions. Note, it is not possible to set dynamic routes as default routes.");
}
function d(t) {
  return t instanceof Element ? t : new DOMParser().parseFromString(t, "text/html").body.firstElementChild;
}
function b() {
  if (!g)
    throw new Error("No root selector found. Did you start the router?");
  const t = document.querySelector(g);
  if (!t)
    throw new Error("Invalid root node selector. Please select a valid HTML element.");
  return t;
}
function D() {
  return R;
}
function C(t) {
  const [e, n] = Object.entries(t)[0];
  return h.find((r) => {
    var o;
    switch (e) {
      case "path":
      case "html":
      case "title":
        return r[e] === n;
      case "startsWith":
        return r.path.startsWith(n);
      case "renderedHtml":
        return (o = r.renderedHtml) == null ? void 0 : o.isEqualNode(n);
      default:
        return null;
    }
  });
}
function S(t, e) {
  if (t === e)
    return !0;
  const n = t.split("/"), r = e.split("/");
  return n.every((o, l) => o.startsWith(":") ? !0 : o === r[l]);
}
function N(t, e) {
  const n = e.find((i) => S(i.path, t));
  if (!n)
    throw new Error(`No matching route found for the path "${t}"`);
  const r = n.path.split("/"), o = t.split("/"), l = {};
  for (let i = 0; i < r.length; i++) {
    const s = r[i];
    if (!s || !s.startsWith(":"))
      continue;
    const u = s.substring(1), w = o[i];
    l[u] = w;
  }
  return {
    resolvedPath: t,
    sourcePath: n.path,
    params: l
  };
}
function E() {
  var n;
  const e = b().querySelectorAll("a[link]");
  for (const r of e) {
    const o = (n = r.getAttributeNode("href")) == null ? void 0 : n.value;
    o && r.addEventListener("click", (l) => {
      l.preventDefault(), h.some((s) => S(s.path, o)) && m(o, !0);
    });
  }
}
async function m(t, e) {
  return new Promise(async (n, r) => {
    const {
      resolvedPath: o,
      sourcePath: l,
      params: i
    } = N(t, h), s = C({ path: l });
    if (!s)
      return r(new Error("Invalid path. Could not match route."));
    let u = d(s.html);
    H({ ...s, path: t, renderedHtml: u }) === !1 && n(null);
    let y;
    s.loader && (y = await s.loader(i).then((p) => p).catch((p) => s.fallback ? (u = d(s.fallback), null) : r(new Error(p)))), a = {
      ...s,
      path: l,
      resolvedPath: o,
      renderedHtml: u,
      params: i,
      data: y
    }, e ? history.replaceState({ path: t }, "", o) : history.pushState({ path: t }, "", o), b().replaceChildren(a.renderedHtml), E(), s.title && (document.title = s.title), P(a), n(a);
  });
}
const c = {}, v = /* @__PURE__ */ new Set();
function q(t, e) {
  if (typeof t == "string") {
    if (!e)
      return;
    c[t] || (c[t] = /* @__PURE__ */ new Set()), c[t].add(e);
  } else
    t && v.add(t);
  return () => {
    typeof t == "string" ? e && c[t].delete(e) : v.delete(t);
  };
}
function H(t) {
  for (const n of v)
    n(t);
  const e = c[t.path];
  if (e)
    for (const n of e)
      n(t);
}
const f = {};
function x(t, e) {
  return f[t] || (f[t] = /* @__PURE__ */ new Set()), f[t].add(e), () => f[t].delete(e);
}
function P(t) {
  const e = f[t.path];
  if (e)
    for (const n of e)
      n(t);
}
export {
  M as defineRouter,
  L as getRoute,
  D as getRouterConfig,
  b as getRouterRoot,
  S as isMatching,
  m as navigate,
  q as onNavigation,
  x as onRouteResolve,
  N as resolvePath
};
