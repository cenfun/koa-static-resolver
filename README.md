
# Koa Static Resolver
> Koa static file resolver, dirs, default index, path replace, cache, livereload, gzip

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
    include: ["include_str", /include_regexp/],
    exclude: ["exclude_str", /exclude_regexp/],
    defaultIndex: "index.html"
}));
app.listen(8080);
```

## Cache
```js
app.use(KSR({
    dirs: ["./static/"],
    //server cache
    cache: {},
    //browser cache header: max-age=<seconds>
    maxAge: 600
}));
```

## Livereload
```js
app.use(KSR({
    dirs: ["./static/"],
    livereload: '\n<script src="/livereload.js"></script>\n'
}));
```

## Gzip
```js
app.use(KSR({
    dirs: ["./static/"],
    cache: {},
    gzip: true
}));
```

## CHANGELOG
+ v1.0.4
  - added include/exclude match for file path

+ v1.0.3
  - fixed cache issue if maxAge=0

+ v1.0.2
  - fixed livereload
