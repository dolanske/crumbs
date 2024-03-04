let __baseRouter = {};
let routes = [];
let rootSelector = "";
let currentRoute;
function getRoute() {
  return structuredClone(currentRoute);
}
function defineRouter(definitions) {
  __baseRouter = Object.freeze(definitions);
  const serializedRoutes = Object.entries(definitions).map(([path, route]) => {
    if (typeof route === "string") {
      return {
        html: route,
        renderedHtml: parseToHtml(route),
        path
      };
    }
    return {
      ...route,
      path,
      renderedHtml: parseToHtml(route.html)
    };
  });
  routes = serializedRoutes;
  function popstateHandler(event) {
    navigate(event.state.path);
  }
  return {
    /**
     * Start the router.
     *
     * @param selector DOM selector
     */
    run: (selector) => {
      rootSelector = selector;
      window.addEventListener("popstate", popstateHandler);
      registerLinks();
      navigate(getDefaultRoute(serializedRoutes));
    },
    /**
     * Stops the router. Navigation will no longer work.
     */
    stop() {
      window.removeEventListener("popstate", popstateHandler);
    }
  };
}
function getDefaultRoute(routes2) {
  let defaultRoute;
  if (routes2.find((route) => isMatching(route.path, location.pathname)))
    return location.pathname;
  defaultRoute = routes2.find((r) => r.default || r.path === "/");
  if (defaultRoute)
    return defaultRoute.path;
  defaultRoute = routes2.sort((a, b) => a.path.length - b.path.length)[0];
  if (defaultRoute)
    return defaultRoute.path;
  throw new Error("No default route found. Please define one by settings its path to `/` or adding the `default` property to the route definitions. Note, it is not possible to set dynamic routes as default routes.");
}
function parseToHtml(template) {
  if (template instanceof Element)
    return template;
  const parser = new DOMParser();
  const raw = parser.parseFromString(template, "text/html");
  return raw.body.firstElementChild;
}
function getRouterRoot() {
  if (!rootSelector)
    throw new Error("No root selector found. Did you start the router?");
  const root = document.querySelector(rootSelector);
  if (!root)
    throw new Error("Invalid root node selector. Please select a valid HTML element.");
  return root;
}
function getRouterConfig() {
  return __baseRouter;
}
function findRoute(option) {
  const [key, value] = Object.entries(option)[0];
  return routes.find((r) => {
    var _a;
    switch (key) {
      case "path":
      case "html":
      case "title": {
        return r[key] === value;
      }
      case "startsWith": {
        return r.path.startsWith(value);
      }
      case "renderedHtml": {
        return (_a = r.renderedHtml) == null ? void 0 : _a.isEqualNode(value);
      }
      default: {
        return null;
      }
    }
  });
}
function isMatching(sourcePath, pathWithValues) {
  if (sourcePath === pathWithValues)
    return true;
  const sourceSplit = sourcePath.split("/");
  const valuesSplit = pathWithValues.split("/");
  return sourceSplit.every((item, index) => {
    if (item.startsWith(":"))
      return true;
    return item === valuesSplit[index];
  });
}
function resolvePath(path, routes2) {
  const source = routes2.find((r) => isMatching(r.path, path));
  if (!source)
    throw new Error(`No matching route found for the path "${path}"`);
  const sourceSplit = source.path.split("/");
  const pathSplit = path.split("/");
  const params = {};
  for (let index = 0; index < sourceSplit.length; index++) {
    const sourceSegment = sourceSplit[index];
    if (!sourceSegment || !sourceSegment.startsWith(":"))
      continue;
    const key = sourceSegment.substring(1);
    const value = pathSplit[index];
    params[key] = value;
  }
  return {
    resolvedPath: path,
    sourcePath: source.path,
    params
  };
}
function registerLinks() {
  var _a;
  const root = getRouterRoot();
  const links = root.querySelectorAll("a[link]");
  for (const link of links) {
    const href = (_a = link.getAttributeNode("href")) == null ? void 0 : _a.value;
    if (!href)
      continue;
    link.addEventListener("click", (event) => {
      event.preventDefault();
      const isMatch = routes.some((r) => isMatching(r.path, href));
      if (isMatch)
        navigate(href, true);
    });
  }
}
async function navigate(path, replace) {
  const navigationHandler = new Promise(async (resolve, reject) => {
    const {
      resolvedPath,
      sourcePath,
      params
    } = resolvePath(path, routes);
    const route = findRoute({ path: sourcePath });
    if (!route)
      return reject(new Error("Invalid path. Could not match route."));
    let renderedHtml = parseToHtml(route.html);
    const result = runOnNavigationCallbacks({ ...route, path, renderedHtml });
    if (result === false)
      resolve(null);
    let data;
    if (route.loader) {
      data = await route.loader(params).then((res) => res).catch((e) => {
        if (!route.fallback)
          return reject(new Error(e));
        renderedHtml = parseToHtml(route.fallback);
        return null;
      });
    }
    currentRoute = {
      ...route,
      path: sourcePath,
      resolvedPath,
      renderedHtml,
      params,
      data
    };
    if (replace)
      history.replaceState({ path }, "", resolvedPath);
    else
      history.pushState({ path }, "", resolvedPath);
    const root = getRouterRoot();
    root.replaceChildren(currentRoute.renderedHtml);
    registerLinks();
    if (route.title)
      document.title = route.title;
    runOnRouteResolveCallbacks(currentRoute);
    resolve(currentRoute);
  });
  navigationHandler.catch((error) => {
    const route = findRoute({ path });
    if (route) {
      const { sourcePath } = resolvePath(path, routes);
      runOnRouteErrorCallbacks({ ...route, path: sourcePath, renderedHtml: null }, error);
    } else {
      runOnRouteErrorCallbacks(null, error);
    }
  });
  return navigationHandler;
}
const onPathNavigationCbs = {};
const onNavigationCbs = /* @__PURE__ */ new Set();
function onNavigation(path, cb) {
  if (typeof path === "string") {
    if (!cb)
      return;
    if (!onPathNavigationCbs[path])
      onPathNavigationCbs[path] = /* @__PURE__ */ new Set();
    onPathNavigationCbs[path].add(cb);
  } else if (path) {
    onNavigationCbs.add(path);
  }
  return () => {
    if (typeof path === "string") {
      if (cb)
        onPathNavigationCbs[path].delete(cb);
    } else {
      onNavigationCbs.delete(path);
    }
  };
}
function runOnNavigationCallbacks(route) {
  for (const cb of onNavigationCbs)
    cb(route);
  const routeUpdates = onPathNavigationCbs[route.path];
  if (routeUpdates) {
    for (const cb of routeUpdates)
      cb(route);
  }
}
const onPathRouteResolveCbs = {};
const onRouteResolveCbs = /* @__PURE__ */ new Set();
function onRouteResolve(path, cb) {
  if (typeof path === "string") {
    if (cb) {
      if (!onPathRouteResolveCbs[path])
        onPathRouteResolveCbs[path] = /* @__PURE__ */ new Set();
      onPathRouteResolveCbs[path].add(cb);
    }
  } else {
    onRouteResolveCbs.add(path);
  }
  return () => {
    if (typeof path === "string") {
      if (cb)
        onPathRouteResolveCbs[path].delete(cb);
    } else {
      onRouteResolveCbs.delete(path);
    }
  };
}
function runOnRouteResolveCallbacks(route) {
  for (const cb of onRouteResolveCbs)
    cb(route);
  const routeUpdates = onPathRouteResolveCbs[route.path];
  if (routeUpdates) {
    for (const cb of routeUpdates)
      cb(route);
  }
}
const onRoutePathErrorCbs = {};
const onRouteErrorcbs = /* @__PURE__ */ new Set();
function onRouteError(path, cb) {
  if (typeof path === "string") {
    if (cb) {
      if (!onRoutePathErrorCbs[path])
        onRoutePathErrorCbs[path] = /* @__PURE__ */ new Set();
      onRoutePathErrorCbs[path].add(cb);
    }
  } else {
    onRouteErrorcbs.add(path);
  }
  return () => {
    if (typeof path === "string") {
      if (cb)
        onRoutePathErrorCbs[path].delete(cb);
    } else {
      onRouteErrorcbs.delete(path);
    }
  };
}
function runOnRouteErrorCallbacks(route, error) {
  for (const cb of onRouteErrorcbs)
    cb(route, error);
  if (route) {
    const routeUpdates = onRoutePathErrorCbs[route.path];
    if (routeUpdates) {
      for (const cb of routeUpdates)
        cb(route, error);
    }
  }
}
export {
  defineRouter,
  getRoute,
  getRouterConfig,
  getRouterRoot,
  isMatching,
  navigate,
  onNavigation,
  onRouteError,
  onRouteResolve,
  resolvePath
};
