const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const defaultOption = {

    dirs: ["./static/"],
    include: [],
    exclude: [],
    defaultIndex: "index.html",

    //====================================
    beforeHandler: async (ctx, option) => {},

    //====================================
    replace: null,
    replaceHandler: (ctx, option, item) => {
        if (!option.replace) {
            return;
        }
        let p = path.normalize(decodeURIComponent(ctx.path));
        Object.keys(option.replace).forEach(function(k) {
            const v = option.replace[k];
            p = p.replace(new RegExp(k, "g"), v);
        });
        item.path = p;
    },

    //====================================
    headers: null,
    headersHandler: (ctx, option, item) => {
        if (option.headers) {
            ctx.set(option.headers);
        }
    },

    //====================================
    //max-age=<seconds>
    maxAge: null,
    maxAgeHandler: (ctx, option, item) => {
        if (option.maxAge === null) {
            return;
        }
        if (!ctx.response.get("Cache-Control")) {
            ctx.set("Cache-Control", `max-age=${option.maxAge}`);
        }
    },

    //====================================
    cache: null,
    cacheMaxLength: 10 * 1024 * 1024,
    getCacheHandler: (ctx, option, item) => {
        if (!option.cache) {
            return;
        }

        const cacheItem = option.cache[item.filePath];
        if (!cacheItem) {
            return;
        }

        //remove from cache if file time was changed
        if (item.stats.mtime.getTime() !== cacheItem.stats.mtime.getTime()) {
            delete option.cache[item.filePath];
            //console.log("remove cache for file time changed");
            //console.log(item.stats.mtime, cacheItem.stats.mtime);
            return;
        }

        item.stats = cacheItem.stats;
        item.body = cacheItem.body;
        item.contentEncoding = cacheItem.contentEncoding;
        item.contentLength = cacheItem.contentLength;
    },
    setCacheHandler: (ctx, option, item) => {
        if (!option.cache) {
            return;
        }
        if (item.contentLength > option.cacheMaxLength) {
            return;
        }
        option.cache[item.filePath] = item;
    },

    //====================================
    fileBodyHandler: (ctx, option, item) => {
        item.body = fs.readFileSync(item.filePath);
    },

    //====================================
    livereload: "",
    /*eslint-disable complexity*/
    livereloadHandler: (ctx, option, item) => {
        if (!option.livereload || !item.body) {
            return;
        }

        const fileType = path.extname(item.filePath);
        if (fileType !== ".html") {
            return;
        }

        if (Buffer.isBuffer(item.body)) {
            item.body = item.body.toString("utf8");
        }

        if (typeof(item.body) !== "string") {
            return;
        }

        const script = `${option.livereload}`;

        const lastIndex = item.body.lastIndexOf("</body>");
        if (lastIndex === -1) {
            item.body += script;
        } else {
            item.body = item.body.substring(0, lastIndex) + script + item.body.substr(lastIndex);
        }

        item.contentLength = item.stats.size + Buffer.byteLength(script);

    },
    /*eslint-enable complexity*/

    //====================================
    gzip: true,
    gzipMinLength: 1024,
    gzipTypes: [".html", ".css", ".js", ".svg", ".xml"],
    /*eslint-disable complexity*/
    gzipHandler: (ctx, option, item) => {
        if (!option.gzip || !option.cache || !item.body) {
            return;
        }

        const fileSize = item.stats.size;
        const fileType = path.extname(item.filePath);
        const isAllowType = option.gzipTypes.includes(fileType);
        if (fileSize <= option.gzipMinLength || !isAllowType) {
            return;
        }

        const encoding = ctx.acceptsEncodings("gzip");
        if (!encoding) {
            return;
        }

        if (typeof(item.body) === "string") {
            item.body = Buffer.from(item.body);
        }

        if (!Buffer.isBuffer(item.body)) {
            return;
        }

        item.body = zlib.gzipSync(item.body);
        item.contentEncoding = encoding;
        item.contentLength = item.body.length;

    },
    /*eslint-enable complexity*/

    fileHeadHandler: (ctx, option, item) => {

        if (!item.contentLength) {
            item.contentLength = item.stats.size;
        }
        ctx.response.length = item.contentLength;

        if (!ctx.response.lastModified) {
            ctx.response.lastModified = item.stats.mtime.toUTCString();
        }

        //may from cache
        if (item.contentEncoding) {
            ctx.response.set("Content-Encoding", item.contentEncoding);
        }
    },

    //====================================
    afterHandler: (ctx, option, item) => {}

};

//===================================================================================

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
        str = str.replace(/\\/g, "/");
    }
    return str;
};

//===================================================================================

const createFileItem = async (option, item) => {
    //is file
    if (item.stats.isFile()) {
        item.filePath = item.localPath;
        return true;
    }
    //is dir
    if (!item.stats.isDirectory()) {
        return false;
    }
    //check if has default index file
    const filePath = path.resolve(item.localPath, option.defaultIndex);
    if (!fs.existsSync(filePath)) {
        return false;
    }
    //new stats for index file
    const stats = await getPathStats(filePath);
    if (!stats) {
        return false;
    }
    item.filePath = filePath;
    item.stats = stats;
    return true;

};

const isIncludePath = (option, localPath) => {
    const include = option.include;
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

const isExcludePath = (option, localPath) => {
    const exclude = option.exclude;
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

const findFileItem = async (option, item) => {
    for (const dir of option.dirs) {
        //item.path always start with "/"", so just use normalize  
        let localPath = path.normalize(dir + item.path);
        if (!fs.existsSync(localPath)) {
            continue;
        }
        localPath = formatPath(localPath);
        if (!isIncludePath(option, localPath) || isExcludePath(option, localPath)) {
            continue;
        }
        const stats = await getPathStats(localPath);
        if (!stats) {
            continue;
        }
        item.localPath = localPath;
        item.stats = stats;
        if (await createFileItem(option, item)) {
            return true;
        }
    }
};

//===================================================================================

const handleFile = async (ctx, option, item) => {

    if (!ctx.type) {
        ctx.type = path.extname(item.filePath);
    }

    //common headers
    await option.headersHandler(ctx, option, item);
    await option.maxAgeHandler(ctx, option, item);

    //cache handler
    await option.getCacheHandler(ctx, option, item);

    //body handler
    if (!item.body) {

        await option.fileBodyHandler(ctx, option, item);
        await option.livereloadHandler(ctx, option, item);
        await option.gzipHandler(ctx, option, item);

    }
    ctx.body = item.body;

    //final file head handler, file body may changed
    await option.fileHeadHandler(ctx, option, item);

    await option.setCacheHandler(ctx, option, item);

    return item;
};

const handleItem = async (ctx, option) => {
    const item = {};
    await option.replaceHandler(ctx, option, item);
    item.path = item.path || ctx.path;
    if (!await findFileItem(option, item)) {
        return;
    }
    return handleFile(ctx, option, item);
};

module.exports = (option) => {
    option = Object.assign(defaultOption, option);

    //init option
    if (option.cache && typeof(option.cache) !== "object") {
        option.cache = {};
    }

    return async (ctx, next) => {
        await next();
        //only handler head and get method
        if (ctx.method !== "HEAD" && ctx.method !== "GET") {
            return;
        }
        //response is already handled
        if (ctx.body) {
            return;
        }
        await option.beforeHandler(ctx, option);
        const item = await handleItem(ctx, option);
        await option.afterHandler(ctx, option, item);
    };
};
