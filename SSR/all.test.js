const progression = process.env.PROGRESSION || 0;

import { expect, test } from 'vitest'
import { Game } from './game.js';
import { ServerApp } from './server-app.js';
import { JSDOM } from 'jsdom'
import fs from 'fs';
import puppeteer from 'puppeteer';

export const data = { 
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

test('TD 2 [00] : tests', () => {
    expect(true).toStrictEqual(true);
});

if (progression == 1) {
    test('TD 2 [01] : classes', () => {
        const game = new Game();
        expect(game).toBeInstanceOf(Game);
    });
}

if (progression >= 2) {
    test('TD 2 [02] : constructeurs', () => {
        expect(Game.prototype.constructor.name).toStrictEqual("Game");
        expect(Game.prototype.constructor.length).toStrictEqual(1);
        expect(Game.prototype.constructor.toString().replaceAll(' ', '')).toContain("constructor(data)");
    });
}

if (progression >= 3) {
    test('TD 2 [03] : propriétés', () => {
        const game = new Game("test");
        expect(game.data).toStrictEqual("test");
    });
}

if (progression >= 4) {
    test('TD 2 [04] : méthodes', () => {
        const game = new Game({levels: "test"});
        expect(game.levels()).toStrictEqual("test");
    });
}

if (progression >= 5) {
    test('TD 2 [05] : boucle for et conditions', () => {
        const game = new Game(data);
        expect(game.level(2)).toStrictEqual(data.levels[1]);
        if (progression == 5) { expect(game.level(20)).toStrictEqual(undefined); }
    });
}

if (progression >= 6) {
    test('TD 2 [06] : exceptions', () => {
        const game = new Game(data);
        expect(game.level(2)).toStrictEqual(data.levels[1]);
        expect(() => game.level(20)).toThrow('Niveau non trouvé');
    });
}

if (progression >= 7) {
    test('TD 2 [07] : undefined', () => {
        const game = new Game(data);
        expect(game.word(2)).toStrictEqual(data.words[2]);
        expect(() => game.word(20)).toThrow('Mot non trouvé');
    });
}

if (progression >= 8) {
    test('TD 2 [08] : chaînes de caractères, variables et tableaux', () => {
        const game = new Game(data);
        expect(game.stringToArray("test")).toStrictEqual(['T', 'E', 'S', 'T']);
    });
}

if (progression >= 9) {
    test('TD 2 [09] : tri', () => {
        const game = new Game(data);
        expect(game.letters(2)).toStrictEqual(['A', 'A', 'N', 'S', 'T', 'V']);
    });
}

if (progression >= 10) {
    test('TD 2 [10] : objets', () => {
        const game = new Game(data);
        expect(game.computeLine(2, "SAVANT")).toStrictEqual([
            {letter: 'S', state: true},
            {letter: 'A', state: true},
            {letter: 'V', state: true},
            {letter: 'A', state: true},
            {letter: 'N', state: true},
            {letter: 'T', state: true}
        ]);
        expect(game.computeLine(2, "STVB")).toStrictEqual([
            {letter: 'S', state: true},
            {letter: 'T', state: false},
            {letter: 'V', state: true},
            {letter: 'B', state: false},
            {letter: '_', state: false},
            {letter: '_', state: false}
        ]);
        expect(game.computeLine(2, "SAVANTT")).toStrictEqual([
            {letter: 'S', state: true},
            {letter: 'A', state: true},
            {letter: 'V', state: true},
            {letter: 'A', state: true},
            {letter: 'N', state: true},
            {letter: 'T', state: true}
        ]);
    });
}

if (progression >= 11) {
    test('TD 2 [11] : mise en place du serveur web', () => {
        const game = new Game(data);
        const app = new ServerApp(game);
        expect(app.start).toBeInstanceOf(Function);
        expect(app.build).toBeInstanceOf(Function);
        app.start(3000, true);
    });
}

if (progression >= 12) {
    test('TD 2 [12] : documents statiques', async () => {
        const game = new Game(data);
        const app = new ServerApp(game);
        const fastify = app.build(false);
        const response = await fastify.inject({url: '/favicon.svg'});
        expect(response.statusCode).toStrictEqual(200);
        expect(response.headers['content-type']).toStrictEqual('image/svg+xml');
        const content = fs.readFileSync(new URL('static/favicon.svg', import.meta.url), 'utf8');
        expect(response.body).toStrictEqual(content);
    });
}

if (progression >= 13) {
    test('TD 2 [13] : mise en place de la première route', async () => {
        const game = new Game(data);
        const app = new ServerApp(game);
        const fastify = app.build(false);
        const response = await fastify.inject({url: '/'});
        expect(response.statusCode).toStrictEqual(200);
        if (progression == 13) {
            expect(response.headers['content-type']).contain('text/html');
            expect(response.body).toStrictEqual('<h1>Hello World !</h1>');
        }
    });
}

if (progression >= 14 && progression < 16) {
    test('TD 2 [14] : envoi de la liste des niveaux en JSON', async () => {
        const game = new Game(data);
        const app = new ServerApp(game);
        const fastify = app.build(false);
        const response = await fastify.inject({url: '/'});
        expect(response.statusCode).toStrictEqual(200);
        expect(response.headers['content-type']).contain('application/json');
        expect(response.json()).toStrictEqual(data.levels);
    });
}

if (progression == 15) {
    test('TD 2 [15] : deuxième route en JSON', async () => {
        const game = new Game(data);
        const app = new ServerApp(game);
        const fastify = app.build(false);
        const response = await fastify.inject({url: '/level/2'});
        expect(response.statusCode).toStrictEqual(200);
        expect(response.headers['content-type']).contain('application/json');
        expect(response.json()).toStrictEqual({
            level: data.levels[1],
            letters: ['A', 'A', 'N', 'S', 'T', 'V']
        });
        const response2 = await fastify.inject({url: '/level/20'});
        expect(response2.statusCode).toStrictEqual(500);
    });
}

if (progression >= 16) {
    test('TD 2 [16] : mise en place des templates', async () => {
        const game = new Game(data);
        const app = new ServerApp(game);
        const fastify = app.build(false);
        const response = await fastify.inject({url: '/'});
        expect(response.statusCode).toStrictEqual(200);
        expect(response.headers['content-type']).contain('text/html');
        expect(response.body).toContain('<th>Difficulté</th>');
        const response2 = await fastify.inject({url: '/level/2'});
        expect(response2.statusCode).toStrictEqual(200);
        expect(response2.headers['content-type']).contain('text/html');
        expect(response2.body).toContain('lettres)');
    });
}

if (progression >= 17) {
    test('TD 2 [17] : template index.ejs', async () => {
        const game = new Game(data);
        const app = new ServerApp(game);
        const fastify = app.build(false);
        const response = await fastify.inject({ url: '/' });
        const dom = new JSDOM(response.payload);
        let html = dom.window.document.querySelector('tbody').innerHTML;
        html = html.trim().split('\n').map(line=>line.trim()).join('');
        expect(html).toStrictEqual('<tr><td>5 lettres</td><td>Littérature</td><td>★★★</td><td><a href=\"level/1\">Démarrer</a></td></tr>'+
                                   '<tr><td>6 lettres</td><td>Sciences</td><td>★★★★</td><td><a href=\"level/2\">Démarrer</a></td></tr>'+
                                   '<tr><td>7 lettres</td><td>Art</td><td>★★★★★</td><td><a href=\"level/3\">Démarrer</a></td></tr>');
    });
}

if (progression >= 18) {
    test('TD 2 [18] : template level.ejs', async () => {
        const game = new Game(data);
        const app = new ServerApp(game);
        const fastify = app.build(false);
        const response = await fastify.inject({ url: '/level/1' });
        const dom = new JSDOM(response.payload);
        let trElements = dom.window.document.querySelectorAll('tr');
        expect(trElements.length).toBeGreaterThanOrEqual(1);
        const firstTrElement = trElements[0];
        let html = firstTrElement.innerHTML.trim().split('\n').map(line=>line.trim()).join('');
        expect(html).toStrictEqual('<td class="text-bg-primary">E</td><td class="text-bg-primary">I</td><td class="text-bg-primary">L</td>'+
                                   '<td class="text-bg-primary">R</td><td class="text-bg-primary">V</td>');
    });
}

if (progression >= 19) {
    test('TD 2 [19] : gestion des erreurs 500', async () => {
        const game = new Game(data);
        const app = new ServerApp(game);
        const fastify = app.build(false);
        fastify.get("/error", (request, reply) => { throw new Error("Error message"); });
        const response = await fastify.inject({ url: '/error' });
        expect(response.statusCode).toStrictEqual(500);
        expect(response.payload).contain('<p class="lead">Error message</p>');
    });
}

if (progression >= 20) {
    test('TD 2 [20] : gestion des erreurs 404', async () => {
        const game = new Game(data);
        const app = new ServerApp(game);
        const fastify = app.build(false);
        const response = await fastify.inject({ url: '/unknown' });
        expect(response.statusCode).toStrictEqual(404);
        expect(response.payload).contain('<p class="lead">Impossible de trouver cette page</p>');
    });
}

if (progression >= 21) {
    test('TD 3 [21] : mise en place d\'un formulaire', async () => {
        const game = new Game(data);
        const app = new ServerApp(game);
        const fastify = app.build(false);
        const response = await fastify.inject({ url: '/level/1' });
        const dom = new JSDOM(response.payload);
        const form = dom.window.document.querySelector('form');
        expect(form).not.toBeNull();
        expect(form.method).toStrictEqual('post');
        expect(form.action).toStrictEqual('/level/1');
        const input = form.querySelector('input');
        expect(input).not.toBeNull();
        expect(input.type).toStrictEqual('text');
        expect(input.name).toStrictEqual('word');
        const button = form.querySelector('button');
        expect(button).not.toBeNull();
        expect(button.type).toStrictEqual('submit');
        expect(button.textContent).toStrictEqual('Proposer');
    });
}

if (progression == 22) {
    test('TD 3 [22] : traitement de la requête POST', async () => {
        const game = new Game(data);
        const app = new ServerApp(game);
        const fastify = app.build(true);
        const response = await fastify.inject({ url: '/level/1', method: 'POST', payload: {word: 'LIVES'} });
        expect(response.statusCode).toStrictEqual(200);
        expect(response.json()).toStrictEqual([
            {letter: 'L', state: true},
            {letter: 'I', state: true},
            {letter: 'V', state: true},
            {letter: 'E', state: false},
            {letter: 'S', state: false}
        ]);
    });
}

if (progression == 23) {
    test('TD 3 [23] : affichage des lignes', async () => {
        const game = new Game(data);
        const app = new ServerApp(game);
        const fastify = app.build(false);
        const response = await fastify.inject({ url: '/level/1', method: 'POST', payload: {word: 'LIVES'} });
        const dom = new JSDOM(response.payload);
        const trElements1 = dom.window.document.querySelectorAll('tr');
        expect(trElements1.length).toStrictEqual(2);
        const lastTrElements1 = trElements1[trElements1.length-1];
        const html = lastTrElements1.innerHTML.trim().split('\n').map(line=>line.trim()).join('');
        expect(html).toStrictEqual('<td class="text-bg-success">L</td><td class="text-bg-success">I</td><td class="text-bg-success">V</td>'+
                                   '<td class="text-bg-danger">E</td><td class="text-bg-danger">S</td>');
        const response2 = await fastify.inject({ url: '/level/1', method: 'GET' });
        const dom2 = new JSDOM(response2.payload);
        const trElements2 = dom2.window.document.querySelectorAll('tr');
        expect(trElements2.length).toStrictEqual(1);
        const lastTrElements2 = trElements2[trElements2.length-1];
        const html2 = lastTrElements2.innerHTML.trim().split('\n').map(line=>line.trim()).join('');
        expect(html2).toStrictEqual('<td class="text-bg-primary">E</td><td class="text-bg-primary">I</td><td class="text-bg-primary">L</td>'+
                                   '<td class="text-bg-primary">R</td><td class="text-bg-primary">V</td>');
        const templateHTML = await fastify.view('templates/level.ejs', {
            level: data.levels[0],
            letters: game.letters(1),
            lines: [game.computeLine(1, 'LIVES'), game.computeLine(1, 'LIVRE')]
        });
        const dom3 = new JSDOM(templateHTML);
        const trElements3 = dom3.window.document.querySelectorAll('tr');
        expect(trElements3.length).toStrictEqual(3);
        const trElement31 = trElements3[1];
        const trElement32 = trElements3[2];
        const html31 = trElement31.innerHTML.trim().split('\n').map(line=>line.trim()).join('');
        expect(html31).toStrictEqual('<td class="text-bg-success">L</td><td class="text-bg-success">I</td><td class="text-bg-success">V</td>'+
                                     '<td class="text-bg-danger">E</td><td class="text-bg-danger">S</td>');
        const html32 = trElement32.innerHTML.trim().split('\n').map(line=>line.trim()).join('');
        expect(html32).toStrictEqual('<td class="text-bg-success">L</td><td class="text-bg-success">I</td><td class="text-bg-success">V</td>'+
                                     '<td class="text-bg-success">R</td><td class="text-bg-success">E</td>');
    });
}

if (progression >= 24) {
    test('TD 3 [24] : utilisation des sessions', async () => {
        const game = new Game(data);
        const app = new ServerApp(game);
        const fastify = app.build(false);
        await fastify.listen();
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.goto(`http://localhost:${fastify.server.address().port}/level/1`);
        await page.waitForSelector('input');
        await page.type('input', 'LIVES');
        await page.click('button');
        await page.waitForSelector('input');
        await page.type('input', 'LIVRE');
        await page.click('button');
        await page.waitForSelector('input');
        const html = await page.content();
        const dom = new JSDOM(html);
        let tbody = dom.window.document.querySelector('tbody').innerHTML
        tbody = tbody.trim().split('\n').map(line=>line.trim()).join('');
        const expectedHTML = '<tr><td class="text-bg-primary">E</td><td class="text-bg-primary">I</td><td class="text-bg-primary">L</td>'+
                             '<td class="text-bg-primary">R</td><td class="text-bg-primary">V</td></tr>'+
                             '<tr><td class="text-bg-success">L</td><td class="text-bg-success">I</td><td class="text-bg-success">V</td>'+
                             '<td class="text-bg-danger">E</td><td class="text-bg-danger">S</td></tr>'+
                             '<tr><td class="text-bg-success">L</td><td class="text-bg-success">I</td><td class="text-bg-success">V</td>'+
                             '<td class="text-bg-success">R</td><td class="text-bg-success">E</td></tr>';
        expect(tbody).toStrictEqual(expectedHTML);
        await browser.close();
        await fastify.close();
    });
}

if (progression >= 25) {
    test('TD 3 [25] : redirections', async () => {
        const game = new Game(data);
        const app = new ServerApp(game);
        const fastify = app.build(false);
        const response = await fastify.inject({
            url: '/level/1',
            method: 'POST',
            payload: {word: 'LIVRE'}
        });
        expect(response.statusCode).toStrictEqual(302);
        expect(response.headers.location).toStrictEqual('/level/1');
    });
}

if (progression >= 26) {
    test('TD 4 [>=26] : Vous n\'êtes pas dans le bon répertoire !', async () => {
        expect(true).toStrictEqual(false);
    });
}