export declare function defineRouter(definitions: Router, provide?: Provide): {
    /**
     * Start the router. Resolves once the initial route has been rendered (or
     * failed to render, in which case `onRouteError` has been called).
     *
     * @param selector DOM selector
     */
    run: (selector: string) => Promise<ResolvedRoute | null>;
    /**
     * Stops the router. Navigation will no longer work.
     */
    stop: typeof stop_2;
};

/**
 * Find a route based on some of its properties.
 */
export declare function findRoute(routes: SerializedRoute[], option: FindRouteOptions): SerializedRoute | undefined;

declare type FindRouteOptions = Record<'path', string> | Record<'title', string> | Record<'startsWith', string> | Record<'html', string> | Record<'renderedHtml', Element>;

export declare function getRoute(): Readonly<ResolvedRoute> | null;

export declare function getRouterConfig(): ShallowReadonly<Router>;

export declare function getRouterRoot(): Element;

/**
 * Checks whether two paths are matching. A path is matching, if its dynamic
 * parameter definitions are that of a path, which has them replaced with actual
 * values.
 *
 * For example `/main/users/:id` should match with `/main/users/10` and so on.
 * Both paths must have the same amount of segments and dynamic segments must
 * be filled with a non-empty value.
 *
 */
export declare function isMatching(sourcePath: string, pathWithValues: string): boolean;

export declare function matchRoute(routes: SerializedRoute[], pathname: string): SerializedRoute | undefined;

/**
 * Navigate to the provided path.
 *
 * @param path Path to navigate to
 * @param options {NavigateOptions} Navigation options
 * @returns Promise, which resolves with the route once it has been rendered,
 * with `null` when the navigation was cancelled or superseded by a newer one,
 * and rejects when the navigation failed.
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

declare type OnNavigationCb<T = SerializedRoute> = (route: T) => void | boolean | Promise<void | boolean>;

declare type OnNavigationCbFn = OnNavigationCb;

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

declare interface PageContext {
    path: string;
    data: any;
    props: Record<string, any>;
    params: Record<string, string>;
    query: Record<string, string>;
    navigate: (path: string, options?: NavigateOptions) => Promise<ResolvedRoute | null>;
    provide: Provide;
}

declare interface PageModule {
    /**
     * Runs when page is unmounted
     */
    unmount?: () => void;
    /**
     * Runs before navigating out. Can cancel navigation if `false` is returned
     */
    beforeLeave?: () => boolean | Promise<boolean>;
}

export declare type PageMount = (root: HTMLElement, context: PageContext) => PageModule;

declare type Provide = Record<string, Function>;

declare type RenderedHtml = Element | DocumentFragment;

export declare function resetRouter(): void;

declare interface ResolvedPathOptions {
    resolvedPath: string;
    sourcePath: string;
    params: Record<string, string>;
    query: Record<string, string>;
    hash: string;
}

export declare interface ResolvedRoute extends Route {
    path: string;
    renderedHtml: RenderedHtml;
    resolvedPath: string;
    params: Record<string, string>;
    data: any;
    hash: string;
    query: Record<string, string>;
    props: Record<string, any>;
}

export declare function resolvePath(_path: string, routes: SerializedRoute[]): ResolvedPathOptions;

export declare interface Route {
    title?: string;
    html: string | Element;
    fallback?: string | Element;
    loader?(params: Record<string, string>): Promise<any>;
    default?: boolean;
    meta?: Record<string, any>;
}

export declare type Router = Record<string, Route | string>;

export declare interface SerializedRoute extends Route {
    path: string;
    renderedHtml: RenderedHtml | null;
    module: Promise<any> | null;
    hash: string;
    query: Record<string, string>;
    props: Record<string, any>;
}

declare type ShallowReadonly<T> = {
    readonly [key in keyof T]: T[key];
};

declare function stop_2(): void;

declare type Stopper = () => void;

export { }
