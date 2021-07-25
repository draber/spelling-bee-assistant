/**
 * Bookmarklet test server
 */
import fs from 'fs-extra';
import https from 'https';
import settings from '../../settings.js';
import express from 'express';
import reqMock from '../fakers/requests/index.js';
import winMock from '../fakers/window/index.js';

const __dirname = settings.get('mock.server');

const metaData = {
    ...fs.readJSONSync(`${settings.get('mock.current')}/meta-data.json`),
    ...{
        userId: 123456
    }
};

const app = express();
const hostname = 'localhost';
const port = 3000;

const options = {
    key: fs.readFileSync(__dirname + '/key.pem'),
    cert: fs.readFileSync(__dirname + '/cert.pem')
};

const server = https.createServer(options, app)
    .listen(port, hostname, function () {
        `Server running at https://${hostname}:${port}/`
    });


app.get('/mock/:type', (req, res) => {
    const type = req.params.type;
    metaData.ua = req.headers['user-agent'];
    metaData.req = req;
    metaData.req.port = server.address().port;
    if (reqMock[type]) {
        res.writeHead(200);
        res.end(JSON.stringify(reqMock[type](metaData)));
        return;
    }
    if (type === 'globals.js') {
        res.writeHead(200);
        let globalData = '';
        for (let [key, value] of Object.entries(winMock.getData(metaData))) {
            globalData += `window.${key} = ${JSON.stringify(value)};\n`;
        }
        res.end(globalData);
        return;
    }
    res.writeHead(404);
    res.end('Not found');
})
app.get(/^\/mock\/([\w-]+)\/svc\/spelling-bee\/v1\/game\/(\d+)\.json$/, (req, res) => {
    if(req.params[0] === 'game' && req.params[1]) {
        metaData.gameId = req.params[1];
        res.writeHead(200);
        res.end(JSON.stringify(reqMock.game(metaData)));
        return;
    }
})

app.get(/^\/mock\/data-layer\/svc\/nyt\/data-layer$/, (req, res) => {
    res.writeHead(200);
    res.end(JSON.stringify(reqMock.dataLayer(metaData)));
    return;
})
app.use(express.static('storage/current'));