let D = {}, R = [], P = "", g;
const $ = [];
function B() {
  return g;
}
function G(t) {
  D = Object.freeze(t);
  const e = Object.entries(t).map(([o, r]) => typeof r == "string" ? {
    html: r,
    renderedHtml: E(r),
    path: o,
    query: {},
    hash: "",
    props: {},
    meta: {}
  } : {
    ...r,
    path: o,
    renderedHtml: E(r.html),
    query: {},
    hash: "",
    props: {},
    meta: r.meta ?? {}
  });
  R = e;
  function n(o) {
    const { path: r, props: s } = o.state;
    C(r, { props: s, isPopState: !0 });
  }
  return {
    /**
     * Start the router.
     *
     * @param selector DOM selector
     */
    run: (o) => {
      P = o, window.addEventListener("popstate", n), A(), C(T(e));
    },
    /**
     * Stops the router. Navigation will no longer work.
     */
    stop() {
      window.removeEventListener("popstate", n), $.map((o) => o());
    }
  };
}
function T(t) {
  let e;
  if (t.find((n) => N(n.path, location.pathname)))
    return location.pathname + location.search + location.hash;
  if (e = t.find((n) => n.default || n.path === "/"), e || (e = t.sort((n, o) => n.path.length - o.path.length)[0], e))
    return e.path;
  throw new Error("No default route found. Please define one by settings its path to `/` or adding the `default` property to the route definitions. Note, it is not possible to set dynamic routes as default routes.");
}
function E(t) {
  return t instanceof Element ? t : new DOMParser().parseFromString(t, "text/html").body.firstElementChild;
}
function x() {
  if (!P)
    throw new Error("No root selector found. Did you start the router?");
  const t = document.querySelector(P);
  if (!t)
    throw new Error("Invalid root node selector. Please select a valid HTML element.");
  return t;
}
function J() {
  return D;
}
function j(t) {
  const [e, n] = Object.entries(t)[0];
  return R.find((o) => {
    var r;
    switch (e) {
      case "path":
      case "html":
      case "title":
        return o[e] === n;
      case "startsWith":
        return o.path.startsWith(n);
      case "renderedHtml":
        return (r = o.renderedHtml) == null ? void 0 : r.isEqualNode(n);
      default:
        return null;
    }
  });
}
function N(t, e) {
  if (t === e)
    return !0;
  t = new URL(t, location.origin).pathname, e = new URL(e, location.origin).pathname;
  const n = t.split("/"), o = e.split("/");
  return n.every((r, s) => r.startsWith(":") ? !0 : r === o[s]);
}
function M(t, e) {
  const n = new URL(t, location.origin), o = n.hash, r = Object.fromEntries(n.searchParams), s = n.pathname, c = e.find((i) => N(i.path, s));
  if (!c)
    throw new Error(`No matching route found for the path "${s}"`);
  const h = c.path.split("/"), f = s.split("/"), a = {};
  for (let i = 0; i < h.length; i++) {
    const u = h[i];
    if (!u || !u.startsWith(":"))
      continue;
    const p = u.substring(1), d = f[i];
    a[p] = d;
  }
  return {
    resolvedPath: s,
    sourcePath: c.path,
    params: a,
    hash: o,
    query: r
  };
}
function A() {
  var n;
  const e = x().querySelectorAll("a[link]");
  for (const o of e) {
    const r = (n = o.getAttributeNode("href")) == null ? void 0 : n.value;
    if (!r)
      continue;
    const s = (c) => (h) => {
      h.preventDefault(), R.some((a) => N(a.path, c)) && C(c);
    };
    o.addEventListener("click", s(r)), $.push(() => o.removeEventListener("click", s(r)));
  }
}
async function C(t, e = {}) {
  const {
    replace: n = !1,
    hash: o,
    query: r,
    props: s = {},
    isPopState: c = !1
  } = e, h = new Promise(async (f, a) => {
    let {
      resolvedPath: i,
      sourcePath: u,
      params: p,
      hash: d,
      query: S
    } = M(t, R);
    if (o && (d = String(o)), r)
      for (const m of Object.keys(r))
        S[m] = String(r[m]);
    const l = j({ path: u });
    if (!l)
      return a(new Error("Invalid path. Could not match route."));
    let k = E(l.html);
    await W({ ...l, path: t, renderedHtml: k, hash: d, query: S, props: s }) === !1 && f(null);
    let O;
    l.loader && (O = await l.loader(p).then((m) => m).catch((m) => l.fallback ? (k = E(l.fallback), null) : a(new Error(m)))), g = Object.freeze({
      ...l,
      path: u,
      resolvedPath: i,
      renderedHtml: k,
      params: p,
      data: O,
      hash: d,
      query: S,
      props: s
    });
    const U = new URLSearchParams(S), I = U.size > 0 ? `?${U.toString()}` : "", b = i + I + (d ? `${d.startsWith("#") ? "" : "#"}${d}` : "");
    c || (n ? history.replaceState({ path: b, props: s }, "", b) : history.pushState({ path: b, props: s }, "", b)), x().replaceChildren(g.renderedHtml), A(), l.title && (document.title = l.title), _(g), f(g);
  });
  return h.catch((f) => {
    const a = j({ path: t });
    if (a) {
      const { sourcePath: i, hash: u, query: p } = M(t, R);
      z({
        ...a,
        path: i,
        renderedHtml: null,
        hash: u,
        query: p,
        props: s
      }, f);
    } else
      z(null, f);
  }), h;
}
const w = {}, H = /* @__PURE__ */ new Set();
function K(t, e) {
  if (typeof t == "string") {
    if (!e)
      return;
    w[t] || (w[t] = /* @__PURE__ */ new Set()), w[t].add(e);
  } else
    t && H.add(t);
  return () => {
    typeof t == "string" ? e && w[t].delete(e) : H.delete(t);
  };
}
function W(t) {
  for (const n of H)
    n(t);
  const e = w[t.path];
  if (e)
    for (const n of e)
      n(t);
}
const y = {}, L = /* @__PURE__ */ new Set();
function X(t, e) {
  return typeof t == "string" ? e && (y[t] || (y[t] = /* @__PURE__ */ new Set()), y[t].add(e)) : L.add(t), () => {
    typeof t == "string" ? e && y[t].delete(e) : L.delete(t);
  };
}
function _(t) {
  for (const n of L)
    n(t);
  const e = y[t.path];
  if (e)
    for (const n of e)
      n(t);
}
const v = {}, q = /* @__PURE__ */ new Set();
function Y(t, e) {
  return typeof t == "string" ? e && (v[t] || (v[t] = /* @__PURE__ */ new Set()), v[t].add(e)) : q.add(t), () => {
    typeof t == "string" ? e && v[t].delete(e) : q.delete(t);
  };
}
function z(t, e) {
  for (const n of q)
    n(t, e);
  if (t) {
    const n = v[t.path];
    if (n)
      for (const o of n)
        o(t, e);
  }
}
export {
  G as defineRouter,
  B as getRoute,
  J as getRouterConfig,
  x as getRouterRoot,
  N as isMatching,
  C as navigate,
  K as onNavigation,
  Y as onRouteError,
  X as onRouteResolve,
  M as resolvePath
};
