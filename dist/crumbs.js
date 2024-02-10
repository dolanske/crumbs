let H = {}, p = [], w = "", f;
function U() {
  return structuredClone(f);
}
function W(t) {
  H = Object.freeze(t);
  const e = Object.entries(t).map(([o, r]) => typeof r == "string" ? {
    html: r,
    renderedHtml: g(r),
    path: o
  } : {
    ...r,
    path: o,
    renderedHtml: g(r.html)
  });
  p = e;
  function n(o) {
    v(o.state.path);
  }
  return {
    /**
     * Start the router.
     *
     * @param selector DOM selector
     */
    run: (o) => {
      w = o, window.addEventListener("popstate", n), O(), v(L(e));
    },
    /**
     * Stops the router. Navigation will no longer work.
     */
    stop() {
      window.removeEventListener("popstate", n);
    }
  };
}
function L(t) {
  let e;
  if (t.find((n) => S(n.path, location.pathname)))
    return location.pathname;
  if (e = t.find((n) => n.default || n.path === "/"), e || (e = t.sort((n, o) => n.path.length - o.path.length)[0], e))
    return e.path;
  throw new Error("No default route found. Please define one by settings its path to `/` or adding the `default` property to the route definitions. Note, it is not possible to set dynamic routes as default routes.");
}
function g(t) {
  return t instanceof Element ? t : new DOMParser().parseFromString(t, "text/html").body.firstElementChild;
}
function N() {
  if (!w)
    throw new Error("No root selector found. Did you start the router?");
  const t = document.querySelector(w);
  if (!t)
    throw new Error("Invalid root node selector. Please select a valid HTML element.");
  return t;
}
function j() {
  return H;
}
function C(t) {
  const [e, n] = Object.entries(t)[0];
  return p.find((o) => {
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
function S(t, e) {
  if (t === e)
    return !0;
  const n = t.split("/"), o = e.split("/");
  return n.every((r, s) => r.startsWith(":") ? !0 : r === o[s]);
}
function k(t, e) {
  const n = e.find((l) => S(l.path, t));
  if (!n)
    throw new Error(`No matching route found for the path "${t}"`);
  const o = n.path.split("/"), r = t.split("/"), s = {};
  for (let l = 0; l < o.length; l++) {
    const u = o[l];
    if (!u || !u.startsWith(":"))
      continue;
    const i = u.substring(1), a = r[l];
    s[i] = a;
  }
  return {
    resolvedPath: t,
    sourcePath: n.path,
    params: s
  };
}
function O() {
  var n;
  const e = N().querySelectorAll("a[link]");
  for (const o of e) {
    const r = (n = o.getAttributeNode("href")) == null ? void 0 : n.value;
    r && o.addEventListener("click", (s) => {
      s.preventDefault(), p.some((u) => S(u.path, r)) && v(r, !0);
    });
  }
}
async function v(t, e) {
  const n = new Promise(async (o, r) => {
    const {
      resolvedPath: s,
      sourcePath: l,
      params: u
    } = k(t, p), i = C({ path: l });
    if (!i)
      return r(new Error("Invalid path. Could not match route."));
    let a = g(i.html);
    M({ ...i, path: t, renderedHtml: a }) === !1 && o(null);
    let E;
    i.loader && (E = await i.loader(u).then((m) => m).catch((m) => i.fallback ? (a = g(i.fallback), null) : r(new Error(m)))), f = {
      ...i,
      path: l,
      resolvedPath: s,
      renderedHtml: a,
      params: u,
      data: E
    }, e ? history.replaceState({ path: t }, "", s) : history.pushState({ path: t }, "", s), N().replaceChildren(f.renderedHtml), O(), i.title && (document.title = i.title), D(f), o(f);
  });
  return n.catch((o) => {
    const r = C({ path: t });
    if (r) {
      const { sourcePath: s } = k(t, p);
      P({ ...r, path: s, renderedHtml: null }, o);
    } else
      P(null, o);
  }), n;
}
const c = {}, R = /* @__PURE__ */ new Set();
function z(t, e) {
  if (typeof t == "string") {
    if (!e)
      return;
    c[t] || (c[t] = /* @__PURE__ */ new Set()), c[t].add(e);
  } else
    t && R.add(t);
  return () => {
    typeof t == "string" ? e && c[t].delete(e) : R.delete(t);
  };
}
function M(t) {
  for (const n of R)
    n(t);
  const e = c[t.path];
  if (e)
    for (const n of e)
      n(t);
}
const d = {}, y = /* @__PURE__ */ new Set();
function A(t, e) {
  return typeof t == "string" ? e && (d[t] || (d[t] = /* @__PURE__ */ new Set()), d[t].add(e)) : y.add(t), () => {
    typeof t == "string" ? e && d[t].delete(e) : y.delete(t);
  };
}
function D(t) {
  for (const n of y)
    n(t);
  const e = d[t.path];
  if (e)
    for (const n of e)
      n(t);
}
const h = {}, b = /* @__PURE__ */ new Set();
function I(t, e) {
  return typeof t == "string" ? e && (h[t] || (h[t] = /* @__PURE__ */ new Set()), h[t].add(e)) : b.add(t), () => {
    typeof t == "string" ? e && h[t].delete(e) : b.delete(t);
  };
}
function P(t, e) {
  for (const n of b)
    n(t, e);
  if (t) {
    const n = h[t.path];
    if (n)
      for (const o of n)
        o(t, e);
  }
}
export {
  W as defineRouter,
  U as getRoute,
  j as getRouterConfig,
  N as getRouterRoot,
  S as isMatching,
  v as navigate,
  z as onNavigation,
  I as onRouteError,
  A as onRouteResolve,
  k as resolvePath
};
