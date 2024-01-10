
# Koa Static Resolver
> Koa static file resolver, dirs, default index, path replace, cache, livereload, gzip

[![](https://img.shields.io/npm/v/koa-static-resolver)](https://www.npmjs.com/package/koa-static-resolver)
[![](https://badgen.net/npm/dw/koa-static-resolver)](https://www.npmjs.com/package/koa-static-resolver)
![](https://img.shields.io/github/license/cenfun/koa-static-resolver)

## Install 
```sh
npm install koa-static-resolver --save
```

## Usage
```js
const Koa = require('koa');
const KSR = require('koa-static-resolver');
const app = new Koa();
app.use(KSR({
    dirs: ["./static/", "../node_modules/"],
    defaultIndex: "index.html"
}));
app.listen(8080);
```

## cache
```js
app.use(KSR({
    dirs: ["./static/"],
    //server cache (Memory)
    cache: {},
    //do NOT cache big size file
    cacheMaxLength: 10 * 1024 * 1024,
    //browser cache header: max-age=<seconds>
    maxAge: 600
}));
```

## livereload
```js
app.use(KSR({
    dirs: ["./static/"],
    livereload: '\n<script src="/livereload.js"></script>\n'
}));
//only inject to .html
```

## gzip
```js
app.use(KSR({
    dirs: ["./static/"],
    cache: {},
    gzip: true,
    gzipMinLength: 1024,
    gzipTypes: [".html", ".css", ".js", ".svg", ".xml"]
}));
//require headers with "Accept-Encoding": "gzip"
```

## include/exclude
```js
app.use(KSR({
    dirs: ["./static/"],
    include: ["include/folder", /RegExp/],
    exclude: ["exclude/folder", /RegExp/]
}));
// any files not matched include/folder will be 404 not found
// any files matched exclude/folder will be 404 not found
// support RegExp
```

## replace
```js
app.use(KSR({
    dirs: ["./static/"],
    replace: {
      "from_path": "to_path"
    }
}));
//when request /from_path/some_next_path/, will be replaced with /to_path/some_next_path/ to find out file path
```

## headers
```js
app.use(KSR({
    dirs: ["./static/"],
    headers: {
      "header_key": "header_value"
    }
}));
```


## CHANGELOG

+ v1.0.5
  - added test case
  - added types

+ v1.0.4
  - added include/exclude match for file path

+ v1.0.3
  - fixed cache issue if maxAge=0

+ v1.0.2
  - fixed livereload
