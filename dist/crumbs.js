let x = {}, v = [], k = "", m;
function W() {
  return structuredClone(m);
}
function B(t) {
  x = Object.freeze(t);
  const e = Object.entries(t).map(([o, r]) => typeof r == "string" ? {
    html: r,
    renderedHtml: E(r),
    path: o,
    query: {},
    hash: "",
    props: {}
  } : {
    ...r,
    path: o,
    renderedHtml: E(r.html),
    query: {},
    hash: "",
    props: {}
  });
  v = e;
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
      k = o, window.addEventListener("popstate", n), A(), C(T(e));
    },
    /**
     * Stops the router. Navigation will no longer work.
     */
    stop() {
      window.removeEventListener("popstate", n);
    }
  };
}
function T(t) {
  let e;
  if (t.find((n) => L(n.path, location.pathname)))
    return location.pathname + location.search + location.hash;
  if (e = t.find((n) => n.default || n.path === "/"), e || (e = t.sort((n, o) => n.path.length - o.path.length)[0], e))
    return e.path;
  throw new Error("No default route found. Please define one by settings its path to `/` or adding the `default` property to the route definitions. Note, it is not possible to set dynamic routes as default routes.");
}
function E(t) {
  return t instanceof Element ? t : new DOMParser().parseFromString(t, "text/html").body.firstElementChild;
}
function z() {
  if (!k)
    throw new Error("No root selector found. Did you start the router?");
  const t = document.querySelector(k);
  if (!t)
    throw new Error("Invalid root node selector. Please select a valid HTML element.");
  return t;
}
function G() {
  return x;
}
function M(t) {
  const [e, n] = Object.entries(t)[0];
  return v.find((o) => {
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
function L(t, e) {
  if (t === e)
    return !0;
  t = new URL(t, location.origin).pathname, e = new URL(e, location.origin).pathname;
  const n = t.split("/"), o = e.split("/");
  return n.every((r, s) => r.startsWith(":") ? !0 : r === o[s]);
}
function j(t, e) {
  const n = new URL(t, location.origin), o = n.hash, r = Object.fromEntries(n.searchParams), s = n.pathname, d = e.find((i) => L(i.path, s));
  if (!d)
    throw new Error(`No matching route found for the path "${s}"`);
  const u = d.path.split("/"), f = s.split("/"), l = {};
  for (let i = 0; i < u.length; i++) {
    const c = u[i];
    if (!c || !c.startsWith(":"))
      continue;
    const h = c.substring(1), p = f[i];
    l[h] = p;
  }
  return {
    resolvedPath: s,
    sourcePath: d.path,
    params: l,
    hash: o,
    query: r
  };
}
function A() {
  var n;
  const e = z().querySelectorAll("a[link]");
  for (const o of e) {
    const r = (n = o.getAttributeNode("href")) == null ? void 0 : n.value;
    r && o.addEventListener("click", (s) => {
      s.preventDefault(), v.some((u) => L(u.path, r)) && C(r);
    });
  }
}
async function C(t, e = {}) {
  const {
    replace: n = !1,
    hash: o,
    query: r,
    props: s = {},
    isPopState: d = !1
  } = e, u = new Promise(async (f, l) => {
    let {
      resolvedPath: i,
      sourcePath: c,
      params: h,
      hash: p,
      query: S
    } = j(t, v);
    if (o && (p = o), r)
      for (const g of Object.keys(r))
        S[g] = String(r[g]);
    const a = M({ path: c });
    if (!a)
      return l(new Error("Invalid path. Could not match route."));
    let P = E(a.html);
    _({ ...a, path: t, renderedHtml: P, hash: p, query: S, props: s }) === !1 && f(null);
    let O;
    a.loader && (O = await a.loader(h).then((g) => g).catch((g) => a.fallback ? (P = E(a.fallback), null) : l(new Error(g)))), m = {
      ...a,
      path: c,
      resolvedPath: i,
      renderedHtml: P,
      params: h,
      data: O,
      hash: p,
      query: S,
      props: s
    };
    const U = new URLSearchParams(S), I = U.size > 0 ? `?${U.toString()}` : "", b = i + I + p;
    d || (n ? history.replaceState({ path: b, props: s }, "", b) : history.pushState({ path: b, props: s }, "", b)), z().replaceChildren(m.renderedHtml), A(), a.title && (document.title = a.title), $(m), f(m);
  });
  return u.catch((f) => {
    const l = M({ path: t });
    if (l) {
      const { sourcePath: i, hash: c, query: h } = j(t, v);
      D({
        ...l,
        path: i,
        renderedHtml: null,
        hash: c,
        query: h,
        props: s
      }, f);
    } else
      D(null, f);
  }), u;
}
const y = {}, H = /* @__PURE__ */ new Set();
function J(t, e) {
  if (typeof t == "string") {
    if (!e)
      return;
    y[t] || (y[t] = /* @__PURE__ */ new Set()), y[t].add(e);
  } else
    t && H.add(t);
  return () => {
    typeof t == "string" ? e && y[t].delete(e) : H.delete(t);
  };
}
function _(t) {
  for (const n of H)
    n(t);
  const e = y[t.path];
  if (e)
    for (const n of e)
      n(t);
}
const w = {}, q = /* @__PURE__ */ new Set();
function K(t, e) {
  return typeof t == "string" ? e && (w[t] || (w[t] = /* @__PURE__ */ new Set()), w[t].add(e)) : q.add(t), () => {
    typeof t == "string" ? e && w[t].delete(e) : q.delete(t);
  };
}
function $(t) {
  for (const n of q)
    n(t);
  const e = w[t.path];
  if (e)
    for (const n of e)
      n(t);
}
const R = {}, N = /* @__PURE__ */ new Set();
function X(t, e) {
  return typeof t == "string" ? e && (R[t] || (R[t] = /* @__PURE__ */ new Set()), R[t].add(e)) : N.add(t), () => {
    typeof t == "string" ? e && R[t].delete(e) : N.delete(t);
  };
}
function D(t, e) {
  for (const n of N)
    n(t, e);
  if (t) {
    const n = R[t.path];
    if (n)
      for (const o of n)
        o(t, e);
  }
}
export {
  B as defineRouter,
  W as getRoute,
  G as getRouterConfig,
  z as getRouterRoot,
  L as isMatching,
  C as navigate,
  J as onNavigation,
  X as onRouteError,
  K as onRouteResolve,
  j as resolvePath
};
