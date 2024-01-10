const fs = require('fs');
const path = require('path');

const Koa = require('koa');
const KSR = require('../');

const rootPath = path.resolve(__dirname, '../');
console.log(`rootPath: ${rootPath}`);
const tempPath = path.resolve(rootPath, '.temp');
console.log(`tempPath: ${tempPath}`);

const port = 8080;
const gzipMinLength = 1024;

// create .temp folder for test
if (!fs.existsSync(tempPath)) {
    console.log('create .temp folder for test');
    fs.mkdirSync(tempPath, {
        recursive: true
    });
}

// create test files
fs.writeFileSync(path.resolve(tempPath, 'index.html'), 'this is index.html');
fs.writeFileSync(path.resolve(tempPath, 'readme.md'), 'this is readme.md');
fs.writeFileSync(path.resolve(tempPath, 'filename with space.html'), 'this is filename with space.html');
fs.writeFileSync(path.resolve(tempPath, '中文 文件名.html'), 'this is 中文 文件名.html');

let str = '';
while (str.length < gzipMinLength) {
    str += ' this is gzip str this is gzip str this is gzip str this is gzip str this is gzip str ';
}
fs.writeFileSync(path.resolve(tempPath, 'gzip.html'), str);

// include and exclude
const includePath = path.resolve(tempPath, 'include');
if (!fs.existsSync(includePath)) {
    fs.mkdirSync(includePath, {
        recursive: true
    });
}
fs.writeFileSync(path.resolve(includePath, 'index.html'), 'this is include');

const replacePath = path.resolve(tempPath, 'replace');
if (!fs.existsSync(replacePath)) {
    fs.mkdirSync(replacePath, {
        recursive: true
    });
}
fs.writeFileSync(path.resolve(replacePath, 'index.html'), 'this is replace');


const excludePath = path.resolve(tempPath, 'exclude');
if (!fs.existsSync(excludePath)) {
    fs.mkdirSync(excludePath, {
        recursive: true
    });
}
fs.writeFileSync(path.resolve(excludePath, 'index.html'), 'this is exclude');


const app = new Koa();
app.use(KSR({
    dirs: [
        // cwd is root because execute "npx mocha"
        './.temp/',
        './'
    ],
    include: ['.temp'],
    exclude: ['exclude'],
    replace: {
        'from_replace': 'replace'
    },
    headers: {
        'header_key': 'header_value'
    },
    cache: {},
    maxAge: 600,
    gzip: true,
    gzipMinLength: gzipMinLength,
    livereload: '<div class="livereload"></div>'
}));
const server = app.listen(port);

module.exports = server;
