declare namespace KSR {

    type KoaContext = any;
    type KoaNext = () => Promise<any>;

    type KSRItem = any;

    export type ItemHandler = (ctx: KoaContext, options: KSROptions, item: KSRItem) => Promise<void>;

    export interface KSROptions {
        dirs?: string[];
        include?: string[];
        exclude?: string[];
        defaultIndex?: string;

        beforeHandler?: (ctx: KoaContext, options: KSROptions) => Promise<void>;

        replace?: {
            [key: string]: string
        };
        replaceHandler?: ItemHandler;

        headers?: {
            [key: string]: string
        };
        headersHandler?: ItemHandler;

        maxAge?: number;
        maxAgeHandler?: ItemHandler;

        cache?: object;
        cacheMaxLength?: number;
        getCacheHandler?: ItemHandler;
        setCacheHandler?: ItemHandler;

        fileBodyHandler?: ItemHandler;

        livereload?: string;
        livereloadHandler?: ItemHandler;

        gzip?: boolean;
        gzipMinLength?: number;
        gzipTypes?: string[];
        gzipHandler?: ItemHandler;

        fileHeadHandler?: ItemHandler;

        afterHandler?: ItemHandler;

    }

    export type Middleware = (ctx: KoaContext, next: KoaNext) => Promise<void>;
}

declare function KSR(options: KSR.KSROptions): KSR.Middleware;

export = KSR;