export declare function defineRouter(definitions: Router): {
    /**
     * Start the router.
     *
     * @param selector DOM selector
     */
    run: (selector: string) => void;
    /**
     * Stops the router. Navigation will no longer work.
     */
    stop(): void;
};

export declare function getRoute(): Readonly<ResolvedRoute> | null;

export declare function getRouterConfig(): ShallowReadonly<Router>;

export declare function getRouterRoot(): Element;

/**
 * Checks wether two paths are matching. A path is matching, if it's dynamic
 * parameter definitions are that of a path, which has them replaced with actual
 * values.
 *
 * For example `/main/users/:id` should match with `/main/users/10` and so on...
 *
 * @param sourcePath The originally defined path. Containing dynamic parameters as `/:param`
 * @param pathWithValues The actual path used when navigating
 * @returns boolean
 *
 */
export declare function isMatching(sourcePath: string, pathWithValues: string): boolean;

/**
 * Navigate to the provided path.
 *
 * @param path Path to navigate to
 * @param options {NavigateOptions} Navigation options
 * @returns Promise, which resolves when route has been successfully loaded
 */
export declare function navigate(path: string, options?: NavigateOptions): Promise<ResolvedRoute | null>;

export declare interface NavigateOptions {
    hash?: string | boolean | number;
    query?: Record<string, string | number | boolean>;
    props?: Record<string, any>;
    replace?: boolean;
    isPopState?: boolean;
}

declare type NavigationErrorCb = (route: SerializedRoute | null, error: any) => void;

export declare function onNavigation(path: OnNavigationCbFn): Stopper;

export declare function onNavigation(path: string, cb: OnNavigationCbFn): Stopper;

declare type OnNavigationCbFn = (route: SerializedRoute) => void | boolean;

/**
 * Runs whenever a route has been resolved. That means the route exists and its loader has successfully fetched data.
 *
 * @param path Route path
 * @param cb Callback
 */
declare type OnResolveRouteCb = (route: ResolvedRoute) => void;

export declare function onRouteError(path: NavigationErrorCb): Stopper;

export declare function onRouteError(path: string, cb: NavigationErrorCb): Stopper;

export declare function onRouteResolve(path: OnResolveRouteCb): Stopper;

export declare function onRouteResolve(path: string, cb: OnResolveRouteCb): Stopper;

declare interface ResolvedPathOptions {
    resolvedPath: string;
    sourcePath: string;
    params: object;
    query: Record<string, string>;
    hash: string;
}

export declare interface ResolvedRoute extends Route {
    path: string;
    renderedHtml: Element;
    resolvedPath: string;
    params?: object;
    data: any;
    hash: string;
    query: Record<string, string>;
    props: object;
}

export declare function resolvePath(_path: string, routes: SerializedRoute[]): ResolvedPathOptions;

export declare interface Route {
    title?: string;
    html: string | Element;
    fallback?: string | Element;
    loader?: (params: any) => Promise<any>;
    default?: boolean;
    lazy?: boolean;
}

export declare type Router = Record<string, Route | string>;

export declare interface SerializedRoute extends Route {
    path: string;
    renderedHtml: Element | null;
    hash: string;
    query: Record<string, string>;
    props: object;
}

declare type ShallowReadonly<T> = {
    readonly [key in keyof T]: T[key];
};

declare type Stopper = () => void;

export { }
