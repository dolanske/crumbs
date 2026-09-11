let O = {}, g = [], v = "", y = null, w = !1, L = 0;
function et() {
  return y;
}
function nt(t) {
  return w && k(), O = Object.freeze(t), g = Object.entries(t).map(([e, n]) => {
    const r = typeof n == "string" ? { html: n } : n;
    return {
      ...r,
      path: f(e),
      renderedHtml: null,
      query: {},
      hash: "",
      props: {},
      meta: r.meta ?? {}
    };
  }), {
    /**
     * Start the router. Resolves once the initial route has been rendered (or
     * failed to render, in which case `onRouteError` has been called).
     *
     * @param selector DOM selector
     */
    run: (e) => (w && k(), v = e, A(), w = !0, window.addEventListener("popstate", x), document.addEventListener("click", z), D(V(g), { replace: !0 }).catch(() => null)),
    /**
     * Stops the router. Navigation will no longer work.
     */
    stop: k
  };
}
function k() {
  w = !1, v = "", y = null, L++, window.removeEventListener("popstate", x), document.removeEventListener("click", z);
}
function x(t) {
  const e = t.state, n = (e == null ? void 0 : e.path) ?? T();
  D(n, { props: (e == null ? void 0 : e.props) ?? {}, isPopState: !0 }).catch(() => {
  });
}
function z(t) {
  var u;
  if (t.defaultPrevented || t.button !== 0 || t.metaKey || t.ctrlKey || t.shiftKey || t.altKey)
    return;
  const e = t.target, n = (u = e == null ? void 0 : e.closest) == null ? void 0 : u.call(e, "a[link]");
  if (!n)
    return;
  const r = n.getAttribute("href");
  if (!r)
    return;
  const o = n.getAttribute("target");
  if (o && o !== "_self")
    return;
  const a = new URL(r, location.href);
  a.origin === location.origin && H(g, a.pathname) && (t.preventDefault(), D(a.pathname + a.search + a.hash).catch(() => {
  }));
}
function T() {
  return location.pathname + location.search + location.hash;
}
function V(t) {
  if (H(t, location.pathname))
    return T();
  const e = t.find((r) => r.default || r.path === "/");
  if (e)
    return e.path;
  const n = t.filter((r) => !Q(r.path)).sort((r, o) => r.path.length - o.path.length)[0];
  if (n)
    return n.path;
  throw new Error("No default route found. Please define one by settings its path to `/` or adding the `default` property to the route definitions. Note, it is not possible to set dynamic routes as default routes.");
}
function M(t) {
  if (t instanceof Element)
    return t;
  const e = document.createElement("template");
  e.innerHTML = t;
  const n = e.content, r = Array.from(n.childNodes).filter((o) => o.nodeType === Node.ELEMENT_NODE ? !0 : o.nodeType === Node.TEXT_NODE && (o.textContent ?? "").trim().length > 0);
  return r.length === 1 && r[0].nodeType === Node.ELEMENT_NODE ? r[0] : n;
}
function A() {
  if (!v)
    throw new Error("No root selector found. Did you start the router?");
  const t = document.querySelector(v);
  if (!t)
    throw new Error("Invalid root node selector. Please select a valid HTML element.");
  return t;
}
function rt() {
  return O;
}
function B(t) {
  const [e, n] = Object.entries(t)[0];
  return g.find((r) => {
    var o;
    switch (e) {
      case "path":
        return r.path === f(n);
      case "html":
      case "title":
        return r[e] === n;
      case "startsWith":
        return r.path.startsWith(n);
      case "renderedHtml":
        return ((o = r.renderedHtml) == null ? void 0 : o.isEqualNode(n)) ?? !1;
      default:
        return !1;
    }
  });
}
function f(t) {
  return t.length > 1 && t.endsWith("/") ? t.slice(0, -1) : t;
}
function U(t) {
  return f(new URL(t, location.origin).pathname).split("/");
}
function Q(t) {
  return t.split("/").some((e) => e.startsWith(":"));
}
function K(t) {
  return t.split("/").filter((e) => e.startsWith(":")).length;
}
function X(t, e) {
  const n = U(t), r = U(e);
  return n.length !== r.length ? !1 : n.every((o, a) => o.startsWith(":") ? r[a].length > 0 : o === r[a]);
}
function H(t, e) {
  return t.filter((n) => X(n.path, e)).sort((n, r) => K(n.path) - K(r.path))[0];
}
function F(t, e) {
  const n = new URL(t, location.origin), r = n.hash.replace(/^#/, ""), o = Object.fromEntries(n.searchParams), a = f(n.pathname), u = H(e, a);
  if (!u)
    throw new Error(`No matching route found for the path "${a}"`);
  const R = u.path.split("/"), E = a.split("/"), s = {};
  for (let i = 0; i < R.length; i++) {
    const l = R[i];
    l.startsWith(":") && (s[l.substring(1)] = G(E[i]));
  }
  return {
    resolvedPath: a,
    sourcePath: u.path,
    params: s,
    hash: r,
    query: o
  };
}
function G(t) {
  try {
    return decodeURIComponent(t);
  } catch {
    return t;
  }
}
async function D(t, e = {}) {
  const {
    replace: n = !1,
    hash: r,
    query: o,
    props: a = {},
    isPopState: u = !1
  } = e, R = ++L, E = () => R === L;
  let s, i = "", l = {};
  try {
    if (!w)
      throw new Error("Router is not running. Call `defineRouter(...).run(selector)` first.");
    const h = F(t, g), { resolvedPath: j, sourcePath: q, params: I } = h;
    if (i = h.hash, l = h.query, r !== void 0 && (i = r === !1 ? "" : String(r).replace(/^#/, "")), o)
      for (const c of Object.keys(o))
        l[c] = String(o[c]);
    if (s = B({ path: q }), !s)
      throw new Error("Invalid path. Could not match route.");
    let b = M(s.html);
    if (await J({ ...s, renderedHtml: b, hash: i, query: l, props: a }) === !1 || !E())
      return null;
    let W = null;
    if (s.loader) {
      try {
        W = await s.loader(I);
      } catch (c) {
        if (!s.fallback)
          throw c;
        b = M(s.fallback);
      }
      if (!E())
        return null;
    }
    const _ = new URLSearchParams(l).toString(), S = j + (_ ? `?${_}` : "") + (i ? `#${i}` : ""), $ = A();
    if (y = Object.freeze({
      ...s,
      path: q,
      resolvedPath: j,
      renderedHtml: b,
      params: I,
      data: W,
      hash: i,
      query: l,
      props: a
    }), !u) {
      const c = { path: S, props: a };
      n || S === T() ? history.replaceState(c, "", S) : history.pushState(c, "", S);
    }
    if ($.replaceChildren(b), s.title && (document.title = s.title), i) {
      const c = document.getElementById(i);
      c && typeof c.scrollIntoView == "function" && c.scrollIntoView();
    }
    return Y(y), y;
  } catch (h) {
    throw Z(s ? { ...s, hash: i, query: l, props: a } : null, h), h;
  }
}
const d = {}, P = /* @__PURE__ */ new Set();
function ot(t, e) {
  if (typeof t == "string") {
    if (!e)
      return () => {
      };
    const n = f(t);
    return d[n] || (d[n] = /* @__PURE__ */ new Set()), d[n].add(e), () => {
      var r;
      return (r = d[n]) == null ? void 0 : r.delete(e);
    };
  }
  return P.add(t), () => P.delete(t);
}
async function J(t) {
  const e = [
    ...P,
    ...d[t.path] ?? []
  ];
  for (const n of e)
    if (await n(t) === !1)
      return !1;
  return !0;
}
const p = {}, N = /* @__PURE__ */ new Set();
function at(t, e) {
  if (typeof t == "string") {
    if (!e)
      return () => {
      };
    const n = f(t);
    return p[n] || (p[n] = /* @__PURE__ */ new Set()), p[n].add(e), () => {
      var r;
      return (r = p[n]) == null ? void 0 : r.delete(e);
    };
  }
  return N.add(t), () => N.delete(t);
}
function Y(t) {
  const e = [
    ...N,
    ...p[t.path] ?? []
  ];
  for (const n of e)
    n(t);
}
const m = {}, C = /* @__PURE__ */ new Set();
function st(t, e) {
  if (typeof t == "string") {
    if (!e)
      return () => {
      };
    const n = f(t);
    return m[n] || (m[n] = /* @__PURE__ */ new Set()), m[n].add(e), () => {
      var r;
      return (r = m[n]) == null ? void 0 : r.delete(e);
    };
  }
  return C.add(t), () => C.delete(t);
}
function Z(t, e) {
  const n = [
    ...C,
    ...t ? m[t.path] ?? [] : []
  ];
  for (const r of n)
    r(t, e);
}
function it() {
  k(), O = {}, g = [], P.clear(), N.clear(), C.clear();
  for (const t of [d, p, m])
    for (const e of Object.keys(t))
      delete t[e];
}
export {
  nt as defineRouter,
  B as findRoute,
  et as getRoute,
  rt as getRouterConfig,
  A as getRouterRoot,
  X as isMatching,
  H as matchRoute,
  D as navigate,
  ot as onNavigation,
  st as onRouteError,
  at as onRouteResolve,
  it as resetRouter,
  F as resolvePath
};
