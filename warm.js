const yargs = require('yargs');
const {
    spawn
} = require('child_process');
const argv = yargs
    .option('url', {
        alias: 'u',
        description: 'Please enter URL of content to be prewamed as of now we support hls and dash',
        type: 'text',
    })
    .option('logs', {
        alias: 'l',
        description: 'To print all logs add -l true. By defaults its false and hence wont print any logs',
        type: 'boolean',
    }).option('batch', {
        alias: 'b',
        description: 'batch size of async functions to control copmute utilisation. default value is 10',
        type: 'number',
    })
    .help()
    .alias('help', 'h')
    .argv;

if (!argv.url) {
    return console.error("URL is mandatory. use -u or --url  to specify url");
}


const DASH_URI = argv.url.indexOf('.mpd') > 0 ? argv.url : null,
    HLS_URI = argv.url.indexOf('.m3u8') > 0 ? argv.url : null,
    SILENT = argv.logs ? false : true,
    BATCH_SIZE = argv.batch || 10;

if (!DASH_URI && !HLS_URI) {
    return console.error("HLS or DASH URL is mandatory. use -u or --url to specify url with extension .mpd or .m3u8");
}

const fetch = require('node-fetch'),
    mpdParser = require('mpd-parser'),
    fs = require('fs'),
    HLS = require('hls-parser'),
    manifestUri = DASH_URI;

var url_counter = 0,
    success_counter = 0,
    failure_counter = 0;

var publish_result = function () {
    console.log("Total segments processed", " - ", url_counter)
    console.log("Total segments succeeded", " - ", success_counter)
    console.log("Total segments failed", " - ", failure_counter)
}

var fetch_promise = function (url, type) {
    const myPromise = new Promise(async (resolve, reject) => {
        try {
            if (!SILENT)
                console.log("Fetching cotent -" + url);
            var res = await fetch(url);
            var response = await res.text();
            if (response && !SILENT)
                console.log("Fetched cotent -" + url);
            process.stdout.write(`Processed ${type} segments : ${success_counter++} / ${url_counter} \r`);
            resolve("success");
        } catch (err) {
            reject(err);
            process.stdout.write(`Failed ${type} segments : ${success_counter++} \r`);
            if (!SILENT)
                console.error(err)
        }
    });
    return myPromise;
}

var get_dash_urls = async function () {
    var dash_urls = [];
    try {
        const res = await fetch(manifestUri);
        const manifest = await res.text();
        var parsedManifest = mpdParser.parse(manifest, {
            manifestUri
        });
        for (i = 0; i < parsedManifest.playlists.length; i++) {
            var playlist = parsedManifest.playlists[i];
            for (j = 0; j < playlist.segments.length; j++) {
                var segment = playlist.segments[j];
                process.stdout.write("Counting DASH segments : " + url_counter++ + "\r");
                dash_urls.push(segment.resolvedUri);
            }
        }
    } catch (err) {
        console.log(err);
    }
    return dash_urls;
}

var get_hls_urls = async function () {
    var hls_urls = [];
    try {
        const res = await fetch(HLS_URI);
        const manifest = await res.text();
        const main_manfest = HLS.parse(manifest);
        for (i = 0; i < main_manfest.variants.length; i++) {
            var variant = main_manfest.variants[i];
            var lastIndex = HLS_URI.lastIndexOf('/');
            const var_uri = HLS_URI.substr(0, lastIndex) + '/' + variant.uri;
            const var_res = await fetch(var_uri);
            const child_manifest = await var_res.text();
            const sub_manfest = HLS.parse(child_manifest);
            for (j = 0; j < sub_manfest.segments.length; j++) {
                var segment = sub_manfest.segments[j];
                var seg_lastIndex = var_uri.lastIndexOf('/');
                const seg_uri = var_uri.substr(0, seg_lastIndex) + '/' + segment.uri;
                process.stdout.write("Counting HLS segments : " + url_counter++ + "\r");
                hls_urls.push(seg_uri);
            }
        }
    } catch (err) {
        console.log(err);
    }
    return hls_urls;
}

var process_batch = async function (urls, type, index) {
    var my_promises = [],
        i = index || 0,
        batch_counter = 0;
    for (i; batch_counter <= BATCH_SIZE && i < urls.length; i++) {
        my_promises.push(fetch_promise(urls[i], type));
        batch_counter++;
    }
    await Promise.allSettled(my_promises);
    return i;
}

var prewarm_urls = async function (type) {
    const myPromise = new Promise(async (resolve, reject) => {
        try {
            var urls = type == "hls" ? await get_hls_urls() : await get_dash_urls();;
            var index = await process_batch(urls, type);
            while (index < urls.length) {
                index = await process_batch(urls, type, index);
            }
            resolve("Success");
        } catch (err) {
            if (!SILENT)
                console.error(err)
            reject(err);
        }
    });
    return myPromise;
}

var main = async function () {
    var type = HLS_URI ? "hls" : "dash";
    console.log(`Prewarming ${type}...`)
    var reponse = await prewarm_urls(type);
    console.log(`Prewarming ${type} Completed Successfully!!!`)
    publish_result();
}
main();
