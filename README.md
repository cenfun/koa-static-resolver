
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
    dirs: ["./static/"],
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
    //browser cache
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
+ v1.0.1
  - init
