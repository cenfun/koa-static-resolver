const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const defaultOptions = {

    dirs: ['./static/'],
    include: [],
    exclude: [],
    defaultIndex: 'index.html',

    // ====================================
    beforeHandler: async (ctx, options) => {},

    // ====================================
    replace: null,
    replaceHandler: (ctx, options, item) => {
        if (!options.replace) {
            return;
        }
        let p = item.path;
        Object.keys(options.replace).forEach(function(k) {
            const v = options.replace[k];
            p = p.replace(new RegExp(k, 'g'), v);
        });
        item.path = p;
    },

    // ====================================
    headers: null,
    headersHandler: (ctx, options, item) => {
        if (options.headers) {
            ctx.set(options.headers);
        }
    },

    // ====================================
    // max-age=<seconds>
    maxAge: null,
    maxAgeHandler: (ctx, options, item) => {
        if (options.maxAge === null) {
            return;
        }
        if (!ctx.response.get('Cache-Control')) {
            ctx.set('Cache-Control', `max-age=${options.maxAge}`);
        }
    },

    // ====================================
    cache: null,
    cacheMaxLength: 10 * 1024 * 1024,
    getCacheHandler: (ctx, options, item) => {
        if (!options.cache) {
            return;
        }

        const cacheItem = options.cache[item.filePath];
        if (!cacheItem) {
            return;
        }

        // remove from cache if file time was changed
        if (item.stats.mtime.getTime() !== cacheItem.stats.mtime.getTime()) {
            delete options.cache[item.filePath];
            // console.log("remove cache for file time changed");
            // console.log(item.stats.mtime, cacheItem.stats.mtime);
            return;
        }

        item.stats = cacheItem.stats;
        item.body = cacheItem.body;
        item.contentEncoding = cacheItem.contentEncoding;
        item.contentLength = cacheItem.contentLength;
    },
    setCacheHandler: (ctx, options, item) => {
        if (!options.cache) {
            return;
        }
        if (item.contentLength > options.cacheMaxLength) {
            return;
        }
        options.cache[item.filePath] = item;
    },

    // ====================================
    fileBodyHandler: (ctx, options, item) => {
        item.body = fs.readFileSync(item.filePath);
    },

    // ====================================
    livereload: '',
    /* eslint-disable complexity*/
    livereloadHandler: (ctx, options, item) => {
        if (!options.livereload || !item.body) {
            return;
        }

        const fileType = path.extname(item.filePath);
        if (fileType !== '.html') {
            return;
        }

        if (Buffer.isBuffer(item.body)) {
            item.body = item.body.toString('utf8');
        }

        if (typeof (item.body) !== 'string') {
            return;
        }

        const script = `${options.livereload}`;

        const lastIndex = item.body.lastIndexOf('</body>');
        if (lastIndex === -1) {
            item.body += script;
        } else {
            item.body = item.body.substring(0, lastIndex) + script + item.body.substr(lastIndex);
        }

        item.contentLength = item.stats.size + Buffer.byteLength(script);

    },
    /* eslint-enable complexity*/

    // ====================================
    gzip: true,
    gzipMinLength: 1024,
    gzipTypes: ['.html', '.css', '.js', '.svg', '.xml'],
    /* eslint-disable complexity*/
    gzipHandler: (ctx, options, item) => {
        if (!options.gzip || !options.cache || !item.body) {
            return;
        }

        const fileSize = item.stats.size;
        const fileType = path.extname(item.filePath);
        const isAllowType = options.gzipTypes.includes(fileType);
        if (fileSize <= options.gzipMinLength || !isAllowType) {
            return;
        }

        const encoding = ctx.acceptsEncodings('gzip');
        if (!encoding) {
            return;
        }

        if (typeof (item.body) === 'string') {
            item.body = Buffer.from(item.body);
        }

        if (!Buffer.isBuffer(item.body)) {
            return;
        }

        item.body = zlib.gzipSync(item.body);
        item.contentEncoding = encoding;
        item.contentLength = item.body.length;

    },
    /* eslint-enable complexity*/

    fileHeadHandler: (ctx, options, item) => {

        if (!item.contentLength) {
            item.contentLength = item.stats.size;
        }
        ctx.response.length = item.contentLength;

        if (!ctx.response.lastModified) {
            ctx.response.lastModified = item.stats.mtime.toUTCString();
        }

        // may from cache
        if (item.contentEncoding) {
            ctx.response.set('Content-Encoding', item.contentEncoding);
        }
    },

    // ====================================
    afterHandler: async (ctx, options, item) => {}

};

// ===================================================================================

const getPathStats = (p) => {
    return new Promise((resolve) => {
        fs.stat(p, (err, stats) => {
            if (err) {
                resolve(null);
                return;
            }
            resolve(stats);
        });
    });
};

// \ to /
const formatPath = function(str) {
    if (str) {
        str = str.replace(/\\/g, '/');
    }
    return str;
};

// ===================================================================================

const createFileItem = async (options, item) => {
    // is file
    if (item.stats.isFile()) {
        item.filePath = item.localPath;
        return true;
    }
    // is dir
    if (!item.stats.isDirectory()) {
        return false;
    }
    // check if has default index file
    const filePath = path.resolve(item.localPath, options.defaultIndex);
    if (!fs.existsSync(filePath)) {
        return false;
    }
    // new stats for index file
    const stats = await getPathStats(filePath);
    if (!stats) {
        return false;
    }
    item.filePath = filePath;
    item.stats = stats;
    return true;

};

const isIncludePath = (options, localPath) => {
    const include = options.include;
    if (!include || !include.length) {
        return true;
    }
    for (const item of include) {
        if (localPath.match(item)) {
            return true;
        }
    }
    return false;
};

const isExcludePath = (options, localPath) => {
    const exclude = options.exclude;
    if (!exclude || !exclude.length) {
        return false;
    }
    for (const item of exclude) {
        if (localPath.match(item)) {
            return true;
        }
    }
    return false;
};

const findFileItem = async (options, item) => {
    for (const dir of options.dirs) {
        // item.path always start with "/"", so just use normalize
        let localPath = path.normalize(dir + item.path);
        if (!fs.existsSync(localPath)) {
            continue;
        }
        localPath = formatPath(localPath);
        if (!isIncludePath(options, localPath) || isExcludePath(options, localPath)) {
            continue;
        }
        const stats = await getPathStats(localPath);
        if (!stats) {
            continue;
        }
        item.localPath = localPath;
        item.stats = stats;
        if (await createFileItem(options, item)) {
            return true;
        }
    }
};

// ===================================================================================

const handleFile = async (ctx, options, item) => {

    if (!ctx.type) {
        ctx.type = path.extname(item.filePath);
    }

    // common headers
    await options.headersHandler(ctx, options, item);
    await options.maxAgeHandler(ctx, options, item);

    // cache handler
    await options.getCacheHandler(ctx, options, item);

    // body handler
    if (!item.body) {

        await options.fileBodyHandler(ctx, options, item);
        await options.livereloadHandler(ctx, options, item);
        await options.gzipHandler(ctx, options, item);

    }
    ctx.body = item.body;

    // final file head handler, file body may changed
    await options.fileHeadHandler(ctx, options, item);

    await options.setCacheHandler(ctx, options, item);

    return item;
};

const handleItem = async (ctx, options) => {

    // init item path, handle 中文
    const item = {
        path: path.normalize(decodeURIComponent(ctx.path))
    };

    // replace item path
    await options.replaceHandler(ctx, options, item);

    if (!await findFileItem(options, item)) {
        return;
    }
    return handleFile(ctx, options, item);
};

module.exports = (options) => {
    options = Object.assign(defaultOptions, options);

    // init option
    if (options.cache && typeof (options.cache) !== 'object') {
        options.cache = {};
    }

    return async (ctx, next) => {
        await next();
        // only handler head and get method
        if (ctx.method !== 'HEAD' && ctx.method !== 'GET') {
            return;
        }
        // response is already handled
        if (ctx.body) {
            return;
        }
        await options.beforeHandler(ctx, options);
        const item = await handleItem(ctx, options);
        await options.afterHandler(ctx, options, item);
    };
};
