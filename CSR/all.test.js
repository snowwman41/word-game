const progression = process.env.PROGRESSION || 0;

import { expect, test, vi, beforeAll } from 'vitest'
import { ServerApp } from './server-app.js';
import { JSDOM } from 'jsdom'
import { ClientApp } from './static/client-app.js';
import fs from 'fs'; 
import puppeteer from 'puppeteer';

let ServerGame = null;
let serverData = null;
let data = undefined;
let Game = null;

async function asyncImport() {
    if (progression >= 28) {
        Game = (await import('./static/game.js')).Game;
    }
    if (progression <= 47) {
        data = (await import('./static/data.js')).data;
    }
    if (progression >= 39) {
        ServerGame = (await import('./game.js')).Game;
        serverData = (await import('./data.js')).data;
    }
}

beforeAll(asyncImport);

const fakeData = { 
    "levels": [
        {"id": 1, "length": 5, "theme": "Littérature", "difficulty": 3},
        {"id": 2, "length": 6, "theme": "Sciences", "difficulty": 4},
        {"id": 3, "length": 7, "theme": "Art", "difficulty": 5}
    ],
    "words": {
        "1": "LIVRE",
        "2": "SAVANT",
        "3": "PEINTRE"
    }
};

const fakeLines = {
    "AB" : [{"letter": "A", "state": true}, {"letter": "B", "state": false}],
    "BC" : [{"letter": "B", "state": true}, {"letter": "C", "state": true}]
}

if (progression < 26) {
    test('TD 2 ou 3 [<26] : vous n\'êtes pas dans le bon répertoire', () => {
        expect(progression).toBeGreaterThanOrEqual(26);
    });
}

if (progression >= 26) {
    test('TD 4 [26] : serveur web', async () => {
        const app = new ServerApp();
        const fastify = app.build(false);
        const response = await fastify.inject({url: '/index.html'});
        expect(response.statusCode).toStrictEqual(200);
        expect(response.headers['content-type']).contain('text/html');
        const content = fs.readFileSync(new URL('static/index.html', import.meta.url), 'utf8');
        expect(response.body).toStrictEqual(content);
    });
}

if (progression >= 27) {
    test('TD 4 [27] : chargement d\'un module JavaScript par le navigateur', async () => {
        const app = new ServerApp();
        const fastify = app.build(false);
        await fastify.listen();
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        const consoleLogs = [];
        page.on('console', async consoleObj => { consoleLogs.push(await consoleObj.args()[0]?.jsonValue()) });
        await page.goto(`http://localhost:${fastify.server.address().port}`);
        const content = await page.content();
        const dom = new JSDOM(content);
        const script = dom.window.document.querySelector('script');
        expect(script.src).contain('/index.js');
        expect(script.type).toStrictEqual('module');
        await browser.close();
        await fastify.close();
        if (progression == 27) {
            expect(consoleLogs).toStrictEqual(['Bonjour !']);
        }
    });
}

if (progression >= 28 && progression < 30) {
    test('TD 4 [28] : organisation du client', async () => {
        const app = new ServerApp();
        const fastify = app.build(false);
        await fastify.listen();
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        const consoleLogs = [];
        page.on('console', async consoleObj => { 
            const args = consoleObj.args();
            const arg0 = args[0];
            const json = await arg0.jsonValue();
            consoleLogs.push(json) 
        });
        await page.goto(`http://localhost:${fastify.server.address().port}`);
        const content = await page.content();
        const dom = new JSDOM(content);
        const script = dom.window.document.querySelector('script');
        expect(script.src).contain('/index.js');
        expect(script.type).toStrictEqual('module');
        await browser.close();
        await fastify.close();
        expect(consoleLogs).toStrictEqual([data.levels]);
    });
}

if (progression == 29) {
    test('TD 4 [29] : exécution du client à la fin du chargement de la page', async () => {
        const app = new ServerApp();
        const fastify = app.build(false);
        await fastify.listen();
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        const consoleLogs = [];
        page.on('console', async consoleObj => { 
            const args = consoleObj.args();
            const arg0 = args[0];
            const json = await arg0.jsonValue();
            consoleLogs.push(json) 
        });
        await page.goto(`http://localhost:${fastify.server.address().port}`);
        await page.evaluate('window.onload()');
        await page.evaluate('window.onload()');
        await page.content();
        expect(consoleLogs).toStrictEqual([data.levels, data.levels, data.levels]);
        await browser.close();
        await fastify.close();
    });
}

if (progression == 30) {
    test('TD 4 [30] : premières interactions avec le DOM', async () => {
        const dom = new JSDOM('<div id="level_description"></div><div id="content"></div>');
        global.window = dom.window;
        global.document = dom.window.document;
        global.content = document.querySelector("#content");
        const game = new Game(data);
        const app = new ClientApp(game);
        app.loadIndex();
        const html = dom.window.document.querySelector("#content").innerHTML;
        expect(html).toStrictEqual('<b>Bonjour !</b>');
        content.innerHTML = '';
        app.main();
        const html2 = dom.window.document.querySelector("#content").innerHTML;
        expect(html2).toStrictEqual('<b>Bonjour !</b>');
    });
}

if (progression == 31) {
    test('TD 4 [31] : génération du tableau des niveaux', async () => {
        const dom = new JSDOM('<table><tbody></tbody></table>');
        global.window = dom.window;
        global.document = dom.window.document;
        const game = new Game(data);
        vi.spyOn(game, 'levels').mockImplementation(() => fakeData.levels);
        const app = new ClientApp(game);
        app.addLevel(data.levels[0]);
        const tbody = dom.window.document.querySelector('tbody');
        const tr = tbody.querySelector('tr');
        expect(tr).not.toBeNull();
        const html = tr.innerHTML.trim().split('\n').map(line=>line.trim()).join('');
        expect(html).toStrictEqual('<td>5 lettres</td><td>Littérature</td><td>★★★</td><td><a>Démarrer</a></td>');
        tbody.innerHTML = '';
        app.addLevels();
        const trs = tbody.querySelectorAll('tr');
        expect(trs.length).toStrictEqual(3);
        for (let i = 0; i < trs.length; i++) {
            const html = trs[i].innerHTML.trim().split('\n').map(line=>line.trim()).join('');
            const level = fakeData.levels[i];
            expect(html).toStrictEqual(`<td>${level.length} lettres</td><td>${level.theme}</td><td>${'★'.repeat(level.difficulty)}</td><td><a>Démarrer</a></td>`);
        }
    });
}

if (progression >= 32) {
    test('TD 4 [32] : modification des propriétés', async () => {
        const dom = new JSDOM('<table><tbody></tbody></table>');
        global.window = dom.window;
        global.document = dom.window.document;
        const game = new Game(fakeData);
        const spyLevels = vi.spyOn(game, 'levels').mockImplementation(() => fakeData.levels);
        const app = new ClientApp(game);
        app.addLevel(fakeData.levels[0]);
        const tbody = dom.window.document.querySelector('tbody');
        const tr = tbody.querySelector('tr');
        expect(tr).not.toBeNull();
        const html = tr.innerHTML.trim().split('\n').map(line=>line.trim()).join('');
        expect(html).toStrictEqual('<td>5 lettres</td><td>Littérature</td><td>★★★</td><td><a href="/level/1">Démarrer</a></td>');
        tbody.innerHTML = '';
        await app.addLevels();
        const trs = tbody.querySelectorAll('tr');
        expect(trs.length).toStrictEqual(fakeData.levels.length);
        for (let i = 0; i < trs.length; i++) {
            const html = trs[i].innerHTML.trim().split('\n').map(line=>line.trim()).join('');
            const level = fakeData.levels[i];
            expect(html).toStrictEqual(`<td>${level.length} lettres</td><td>${level.theme}</td>`+
                                       `<td>${'★'.repeat(level.difficulty)}</td><td><a href="/level/${level.id}">Démarrer</a></td>`);
        }
        expect(spyLevels).toHaveBeenCalledTimes(1);
    });
}

if (progression >= 33) {
    test('TD 4 [33] : récupération de l\'URL du document', async () => {
        const dom = new JSDOM('<div id="level_description"></div><div id="content"></div>');
        dom.reconfigure({url: 'http://localhost:3000/'})
        global.window = dom.window;
        global.document = dom.window.document;
        const game = new Game(fakeData);
        const spyLevels = vi.spyOn(game, 'levels').mockImplementation(() => fakeData.levels);
        vi.spyOn(game, 'level').mockImplementation(() => fakeData.levels[2]);
        vi.spyOn(game, 'letters').mockImplementation(() => ['A', 'B', 'C']);
        const app = new ClientApp(game);
        await app.main();
        const trs = document.querySelectorAll('tbody tr');
        expect(trs.length).toStrictEqual(fakeData.levels.length);
        for (let i = 0; i < trs.length; i++) {
            const html = trs[i].innerHTML.trim().split('\n').map(line=>line.trim()).join('');
            const level = fakeData.levels[i];
            expect(html).toStrictEqual(`<td>${level.length} lettres</td><td>${level.theme}</td>`+
                                       `<td>${'★'.repeat(level.difficulty)}</td><td><a href="/level/${level.id}">Démarrer</a></td>`);
        }
        expect(spyLevels).toHaveBeenCalledTimes(1);
        dom.reconfigure({url: 'http://localhost:3000/level/3'});
        await app.main();
        const content = document.querySelector("#content").innerHTML;
        const expectedHTML = (progression == 33) ? 'Niveau 3' : '<input type="text" class="form-control">';
        expect(content).contain(expectedHTML);
    });
}

if (progression >= 34) {
    test('TD 4 [34] : mise en place du formulaire', async () => {
        const dom = new JSDOM('<div id="level_description"></div><div id="content"></div>');
        dom.reconfigure({url: 'http://localhost:3000/level/3'})
        global.window = dom.window;
        global.document = dom.window.document;
        const game = new Game(fakeData);
        vi.spyOn(game, 'letters').mockImplementation(() => ['A', 'B', 'C']);
        const spyLevel = vi.spyOn(game, 'level').mockImplementation(() => fakeData.levels[2]);
        const spyComputeLine = vi.spyOn(game, 'computeLine').mockImplementation((id, word) => fakeLines[word]);
        const app = new ClientApp(game);
        const spyOnSubmitWord = vi.spyOn(app, 'onSubmitWord');
        const spyAddLine = vi.spyOn(app, 'addLine');
        await app.main();
        const content = document.querySelector("#content").innerHTML;
        expect(content).contain('<input type="text" class="form-control">');
        const input = document.querySelector('input');
        input.value = 'AB';
        const button = document.querySelector('button');
        button.click();
        await new Promise(resolve => setTimeout(resolve, 100));
        expect(input.value).toStrictEqual('');
        expect(spyLevel).toHaveBeenCalledTimes(1);
        expect(spyLevel).toBeCalledWith(3);
        expect(spyComputeLine).toHaveBeenCalledTimes(1);
        expect(spyComputeLine).toBeCalledWith(3, 'AB');
        expect(spyOnSubmitWord).toHaveBeenCalledTimes(1);
        expect(spyAddLine).toHaveBeenCalledTimes(1);
        expect(spyAddLine).toBeCalledWith(fakeLines['AB']);
    });
}

if (progression >= 35) {
    test('TD 4 [35] : implémentation de addLetters', async () => {
        const game = new Game(fakeData);
        const fakeLetters = ['A', 'B', 'C'];
        const spyLetters = vi.spyOn(game, 'letters').mockImplementation((id) => fakeLetters);
        const app = new ClientApp(game);
        const dom = new JSDOM('<table><tbody></tbody></table>');
        global.window = dom.window;
        global.document = dom.window.document;
        await app.addLetters(5);
        const tbody = dom.window.document.querySelector('tbody');
        const tr = tbody.querySelector('tr');
        const tds = tr.querySelectorAll('td');
        expect(tds.length).toStrictEqual(fakeLetters.length);
        for (let i = 0; i < tds.length; i++) {
            const td = tds[i];
            expect(td.textContent).toStrictEqual(fakeLetters[i]);
            expect(td.classList.contains('text-bg-primary')).toBeTruthy();
        }
        expect(spyLetters).toHaveBeenCalledTimes(1);
        expect(spyLetters).toBeCalledWith(5);
    });
}

if (progression >= 36) {
    test('TD 4 [36] : implémentation de addLine', async () => {
        const game = new Game(fakeData);
        const app = new ClientApp(game);
        const dom = new JSDOM('<table><tbody></tbody></table>');
        global.window = dom.window;
        global.document = dom.window.document;
        app.addLine(fakeLines['AB']);
        const tbody = dom.window.document.querySelector('tbody');
        const tr = tbody.querySelector('tr');
        const tds = tr.querySelectorAll('td');
        expect(tds.length).toStrictEqual(fakeLines['AB'].length);
        for (let i = 0; i < tds.length; i++) {
            const td = tds[i];
            const position = fakeLines['AB'][i];
            expect(td.textContent).toStrictEqual(position.letter);
            expect(td.classList.contains(position.state ? 'text-bg-success' : 'text-bg-danger')).toBeTruthy();
        }
    });
}


if (progression >= 37) {
    test('TD 4 [37] : description des niveaux', async () => {
        const dom = new JSDOM('<div id="level_description"></div><div id="content"></div>');
        global.window = dom.window;
        global.document = dom.window.document;
        const game = new Game(fakeData);
        vi.spyOn(game, 'levels').mockImplementation(() => fakeData.levels);
        vi.spyOn(game, 'level').mockImplementation((id) => fakeData.levels[1]);
        vi.spyOn(game, 'letters').mockImplementation(() => ['A', 'B', 'C']);
        const app = new ClientApp(game);
        dom.reconfigure({url: 'http://localhost:3000/level/2'});
        await app.main();
        const content = document.querySelector("#level_description").innerHTML;
        expect(content).toStrictEqual('Sciences (6 lettres)');
        dom.reconfigure({url: 'http://localhost:3000'});
        await app.main();
        const content2 = document.querySelector("#level_description").innerHTML;
        expect(content2).toStrictEqual('');
    });
}

if (progression >= 38) {
    test('TD 4 [38] : gestion des erreurs', async () => {
        const dom = new JSDOM('<div id="level_description"></div><div id="content"></div>');
        global.window = dom.window;
        global.document = dom.window.document;
        const game = new Game(fakeData);
        const app = new ClientApp(game);
        const spyLoadError = vi.spyOn(app, 'loadError');
        dom.reconfigure({url: 'http://localhost:3000/abc'});
        await app.main();
        expect(spyLoadError).toHaveBeenCalledTimes(1);
        expect(spyLoadError).toBeCalledWith(404, 'Page non trouvée');
        const content = document.querySelector("#content").innerHTML;
        expect(content).contain('404');
        expect(content).contain('Page non trouvée');
        spyLoadError.mockClear();
        vi.spyOn(game, 'level').mockImplementation((id) => { throw new Error('abc'); });
        dom.reconfigure({url: 'http://localhost:3000/level/1'});
        await app.main();
        expect(spyLoadError).toHaveBeenCalledTimes(1);
        expect(spyLoadError).toBeCalledWith(500, 'Erreur interne');
        const content2 = document.querySelector("#content").innerHTML;
        expect(content2).contain('500');
        expect(content2).contain('Erreur interne');
    });
}

if (progression >= 39) {
    test('TD 5 [39] : mise en place', async () => {
        const game = new ServerGame(serverData);
        const serverApp = new ServerApp(game);
        expect(serverApp.game).toBe(game);
    });
}

if (progression >= 40) {
    test('TD 5 [40] : accès à la liste des niveaux (côté serveur)', async () => {
        const game = new ServerGame(serverData);
        const spyLevels = vi.spyOn(game, 'levels').mockImplementation(() => fakeData.levels);
        const serverApp = new ServerApp(game);
        const fastify = serverApp.build(false);
        const response = await fastify.inject({url: '/api/levels'});
        expect(response.statusCode).toStrictEqual(200);
        expect(response.headers['content-type']).contain('application/json');
        expect(response.json()).toStrictEqual(fakeData.levels);
        expect(spyLevels).toHaveBeenCalledTimes(1);
    });
}

if (progression >= 41) {
    test('TD 5 [41] : accès à la liste des niveaux (côté client)', async () => {
        const game = new Game(fakeData);
        const spyFetch = vi.spyOn(global, 'fetch').mockImplementation(() => Promise.resolve({json: async () => fakeData.levels}));
        const levels = await game.levels();
        expect(levels).toStrictEqual(fakeData.levels);
        expect(spyFetch).toHaveBeenCalledTimes(1);
        expect(spyFetch).toBeCalledWith('/api/levels');
        spyFetch.mockClear();
        const dom = new JSDOM('<div id="level_description"></div><div id="content"></div>');
        dom.reconfigure({url: 'http://localhost:3000'});
        global.window = dom.window;
        global.document = dom.window.document;
        global.content = document.querySelector("#content");
        const app = new ClientApp(game);
        await app.main();
        expect(spyFetch).toHaveBeenCalledTimes(1);
        expect(spyFetch).toBeCalledWith('/api/levels');
        expect(document.querySelectorAll('tbody tr').length).toStrictEqual(fakeData.levels.length);
    });
}

if (progression >= 42) {
    test('TD 5 [42] : accès aux informations d\'un niveau (côté serveur)', async () => {
        const game = new ServerGame(serverData);
        const spyLevel = vi.spyOn(game, 'level').mockImplementation((id) => fakeData.levels[id-1]);
        const serverApp = new ServerApp(game);
        const fastify = serverApp.build(false);
        const response = await fastify.inject({url: '/api/level/2'});
        expect(response.statusCode).toStrictEqual(200);
        expect(response.headers['content-type']).contain('application/json');
        expect(response.json()).toStrictEqual(fakeData.levels[1]);
        expect(spyLevel).toHaveBeenCalledTimes(1);
        expect(spyLevel).toBeCalledWith(2);
    });
}

if (progression >= 43) {
    test('TD 5 [43] : accès aux informations d\'un niveau (côté client)', async () => {
        const game = new Game(fakeData);
        vi.spyOn(game, 'letters').mockImplementation(() => ['A', 'B', 'C']);
        const spyFetch = vi.spyOn(global, 'fetch').mockImplementation(() => Promise.resolve({json: async () => fakeData.levels[1]}));
        const level = await game.level(2);
        expect(level).toStrictEqual(fakeData.levels[1]);
        expect(spyFetch).toHaveBeenCalledTimes(1);
        expect(spyFetch).toBeCalledWith('/api/level/2');
        spyFetch.mockClear();
        const dom = new JSDOM('<div id="level_description"></div><div id="content"></div>');
        dom.reconfigure({url: 'http://localhost:3000/level/2'});
        global.window = dom.window;
        global.document = dom.window.document;
        global.content = document.querySelector("#content");
        const app = new ClientApp(game);
        await app.main();
        expect(spyFetch).toHaveBeenCalledTimes(1);
        expect(spyFetch).toBeCalledWith('/api/level/2');
        expect(document.querySelector("#level_description").innerHTML).toStrictEqual('Sciences (6 lettres)');
    });
}

if (progression >= 44) {
    test('TD 5 [44] : accès aux lettres d\'un niveau (côté serveur)', async () => {
        const game = new ServerGame(serverData);
        const spyWord = vi.spyOn(game, 'letters').mockImplementation((id) => ['A', 'B', 'C']);
        const serverApp = new ServerApp(game);
        const fastify = serverApp.build(false);
        const response = await fastify.inject({url: '/api/letters/2'});
        expect(response.statusCode).toStrictEqual(200);
        expect(response.headers['content-type']).contain('application/json');
        expect(response.json()).toStrictEqual(['A', 'B', 'C']);
        expect(spyWord).toHaveBeenCalledTimes(1);
        expect(spyWord).toBeCalledWith(2);
    });
}

if (progression >= 45) {
    test('TD 5 [45] : accès aux lettres d\'un niveau (côté client)', async () => {
        const game = new Game(fakeData);
        const spyFetch = vi.spyOn(global, 'fetch').mockImplementation(() => Promise.resolve({json: async () => ['A', 'B', 'C']}));
        vi.spyOn(game, 'level').mockImplementation((id) => fakeData.levels[2]);
        const letters = await game.letters(fakeData.levels[2].id);
        expect(letters).toStrictEqual(['A', 'B', 'C']);
        expect(spyFetch).toHaveBeenCalledTimes(1);
        expect(spyFetch).toBeCalledWith('/api/letters/3');
        spyFetch.mockClear();
        const dom = new JSDOM('<div id="level_description"></div><div id="content"></div>');
        dom.reconfigure({url: 'http://localhost:3000/level/3'});
        global.window = dom.window;
        global.document = dom.window.document;
        global.content = document.querySelector("#content");
        const app = new ClientApp(game);
        await app.main();
        expect(spyFetch).toHaveBeenCalledTimes(1);
        expect(spyFetch).toBeCalledWith('/api/letters/3');
        expect(document.querySelectorAll('tbody tr td').length).toStrictEqual(3);
    });
}

if (progression >= 46) {
    test('TD 5 [46] : traitement d\'un mot par le serveur', async () => {
        const game = new ServerGame(serverData);
        const spyComputeLine = vi.spyOn(game, 'computeLine').mockImplementation((id, word) => fakeLines[word]);
        const serverApp = new ServerApp(game);
        const fastify = serverApp.build(false);
        const response = await fastify.inject({url: '/api/line/2', method: 'POST', payload: {word: 'AB'}});
        expect(response.statusCode).toStrictEqual(200);
        expect(response.headers['content-type']).contain('application/json');
        expect(response.json()).toStrictEqual(fakeLines['AB']);
        expect(spyComputeLine).toHaveBeenCalledTimes(1);
        expect(spyComputeLine).toBeCalledWith(2, 'AB');
    });
}

if (progression >= 47) {
    test('TD 5 [47] : soumission d\'un mot au serveur par le client', async () => {
        const game = new Game(fakeData);
        const spyFetch = vi.spyOn(global, 'fetch').mockImplementation(() => Promise.resolve({json: async () => fakeLines['AB']}));
        vi.spyOn(game, 'level').mockImplementation((id) => fakeData.levels[2]);
        vi.spyOn(game, 'letters').mockImplementation(() => ['A', 'B', 'C']);
        const line = await game.computeLine(3, 'AB');
        expect(line).toStrictEqual(fakeLines['AB']);
        expect(spyFetch).toHaveBeenCalledTimes(1);
        expect(spyFetch).toBeCalledWith('/api/line/3', {
            method: 'POST', 
            headers: {'Content-Type': 'application/json'}, 
            body: JSON.stringify({word: 'AB'})
        });
        spyFetch.mockClear();
        const dom = new JSDOM('<div id="level_description"></div><div id="content"></div>');
        dom.reconfigure({url: 'http://localhost:3000/level/3'});
        global.window = dom.window;
        global.document = dom.window.document;
        global.content = document.querySelector("#content");
        const app = new ClientApp(game);
        await app.main();
        const input = document.querySelector('input');
        input.value = 'AB';
        const button = document.querySelector('button');
        button.click();
        await new Promise(resolve => setTimeout(resolve, 100));
        expect(spyFetch).toHaveBeenCalledTimes(1);
        expect(spyFetch).toBeCalledWith('/api/line/3', {
            method: 'POST', 
            headers: {'Content-Type': 'application/json'}, 
            body: JSON.stringify({word: 'AB'})
        });
        expect(document.querySelector('input').value).toStrictEqual('');
        expect(dom.window.document.querySelectorAll('tbody tr td').length).toStrictEqual(5);
    });
}

if (progression >= 48) {
    test('TD 5 [48] : nettoyage', async () => {
        expect(Game.prototype.constructor.name).toStrictEqual("Game");
        expect(Game.prototype.constructor.length).toStrictEqual(0);
        expect(fs.existsSync('./static/data.js')).toStrictEqual(false);
        expect(Game.prototype.word).toBeUndefined();
        expect(Game.prototype.stringToArray).toBeUndefined();
    });
}

if (progression >= 49) {
    test('TD 5 [49] : Single Page Application', async () => {
        const dom = new JSDOM('<a href=""></a><div id="level_description"></div><div id="content"></div>');
        dom.reconfigure({url: 'http://localhost:3000'});
        global.window = dom.window;
        global.document = dom.window.document;
        const game = new Game(fakeData);
        vi.spyOn(global, 'fetch').mockImplementation(() => Promise.resolve({json: async () => fakeData.levels}));
        const spyNavigateTo = vi.spyOn(ClientApp.prototype, 'navigateTo').mockImplementation(() => {});
        const app = new ClientApp(game);
        await app.main();
        const links = document.querySelectorAll('a');
        console.log(document.body.innerHTML);
        expect(links.length).toStrictEqual(fakeData.levels.length + 1);
        for (const link of links) { link.click(); }
        expect(spyNavigateTo).toHaveBeenCalledTimes(fakeData.levels.length + 1);
        spyNavigateTo.mockClear();
        dom.reconfigure({url: 'http://localhost:3000/level/2'});
        await app.main();
        const links2 = document.querySelectorAll('a');
        expect(links2.length).toStrictEqual(1);
        for (const link of links2) { link.click(); }
        expect(spyNavigateTo).toHaveBeenCalledTimes(1);
        vi.restoreAllMocks();
        const spyPushState = vi.spyOn(window.history, 'pushState').mockImplementation(() => {});
        const spyMain = vi.spyOn(ClientApp.prototype, 'main').mockImplementation(() => {});
        app.navigateTo('/level/3');
        expect(spyPushState).toHaveBeenCalledTimes(1);
        expect(spyPushState).toBeCalledWith(null, null, '/level/3');
        expect(spyMain).toHaveBeenCalledTimes(1);
        await import('./static/index.js');
        spyMain.mockClear();
        window.onpopstate();
        expect(spyMain).toHaveBeenCalledTimes(1);
    });
        
}