const axios = require("axios");
const assert = require("assert");

const port = 8080;
let server;

describe("init", function() {
    this.timeout(20 * 1000);

    before(() => {
        server = require("./server.js");
    });

    after(() => {
        server.close();
    });


    it("check / and livereload", async () => {
        let err;
        const res = await axios.get(`http://localhost:${port}/`).catch(function(e) {
            err = e;
        });
        assert.ok(res);
        assert.ok(!err);
        assert.equal(res.data, 'this is index.html<div class="livereload"></div>');
        //console.log(res.headers);
        assert.equal(res.headers.header_key, "header_value");
        assert.equal(res.headers["cache-control"], "max-age=600");
    });

    it("check index.html and livereload", async () => {
        let err;
        const res = await axios.get(`http://localhost:${port}/index.html`).catch(function(e) {
            err = e;
        });
        assert.ok(res);
        assert.ok(!err);
        assert.equal(res.data, 'this is index.html<div class="livereload"></div>');
    });

    it("check readme.md and no livereload", async () => {
        let err;
        const res = await axios.get(`http://localhost:${port}/readme.md`).catch(function(e) {
            err = e;
        });
        assert.ok(res);
        assert.ok(!err);
        assert.equal(res.data, "this is readme.md");
    });

    it("check 404", async () => {
        let err;
        const res = await axios.get(`http://localhost:${port}/not_found.html`).catch(function(e) {
            err = e;
        });
        assert.ok(!res);
        assert.ok(err);
        assert.equal(err.response.status, 404);
    });

    it("check include and livereload", async () => {
        let err;
        const res = await axios.get(`http://localhost:${port}/include/`).catch(function(e) {
            err = e;
        });
        assert.ok(res);
        assert.ok(!err);
        assert.equal(res.data, 'this is include<div class="livereload"></div>');
    });

    it("check replace and livereload", async () => {
        let err;
        const res = await axios.get(`http://localhost:${port}/from_replace/`).catch(function(e) {
            err = e;
        });
        assert.ok(res);
        assert.ok(!err);
        assert.equal(res.data, 'this is replace<div class="livereload"></div>');
    });

    it("check exclude", async () => {
        let err;
        const res = await axios.get(`http://localhost:${port}/exclude/`).catch(function(e) {
            err = e;
        });
        assert.ok(!res);
        assert.ok(err);
        assert.equal(err.response.status, 404);
    });

    it("check gzip with accept gzip", async () => {
        let err;
        const res = await axios({
            url: `http://localhost:${port}/gzip.html`,
            method: "get",
            decompress: false,
            headers: {
                "request_key": "request_value",
                "Accept-Encoding": "gzip, deflate, br"
            }
        }).catch(function(e) {
            err = e;
        });
        assert.ok(res);
        assert.ok(!err);
        //console.log(res.config.headers);
        console.log(res.headers);
        assert.equal(res.headers.header_key, "header_value");
        assert.equal(res.headers["cache-control"], "max-age=600");
        assert.equal(res.headers["content-encoding"], "gzip");
        assert.ok(res.headers["content-length"], 1024);
    });

});
