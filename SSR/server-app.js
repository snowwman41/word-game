import Fastify from "fastify";
import { fastifyView } from "@fastify/view";
import { fastifyStatic } from "@fastify/static";
import { fastifyFormbody } from "@fastify/formbody";
import { fastifyCookie } from "@fastify/cookie";
import { fastifySession } from "@fastify/session";
import ejs from "ejs";


export class ServerApp {
    constructor(game) {
        this.game = game;
    }
    build(logEnabled) {
        const fastify = new Fastify({logger: logEnabled});
        fastify.register(fastifyCookie);
        fastify.register(fastifySession, {secret: '01234567890123456789012345678901', cookie: {secure: 'auto'}});
        fastify.register(fastifyView, {engine: {ejs: ejs}});
        fastify.setErrorHandler((error, request, reply) => {this.handleError(error, reply) ; } );
        fastify.setNotFoundHandler((request, reply) => { this.handleNotFound(reply); });
        
        fastify.register(fastifyStatic, { root: new URL('static', import.meta.url) });
        fastify.register(fastifyFormbody);
        
        fastify.get("/", (request, reply) => this.getIndex(request, reply));
        fastify.get("/level/:id(^\\d+$)", (request, reply) => this.getLevel(request, reply));        
        fastify.post("/level/:id(^\\d+$)", (request, reply) => this.postWord(request, reply));
        
        return fastify;
    }
    start(port, logEnabled) {
        const fastify = this.build(logEnabled);
        fastify.listen({ port: port }, (err, address) => {
            if (err) { fastify.log.error(err); process.exit(1) }
        });
    }
    getIndex(request, reply) {       
        // reply.type('text/html').send('<h1>Hello World !</h1>');
        let levels = this.game.levels();
        reply.view('templates/index.ejs', {levels:levels});
        // reply.type('application/json').send(this.game.levels());
    }    
    getLevel(request, reply) {
        this.resetSessionIfNeeded(request);
        const id = request.params.id;
        const level = this.game.level(id);
        const letters = this.game.letters(id); 
        const lines = request.session.lines;
        // reply.type('application/json').send({
        //     level: level,
        //     letters: letters  
        // });
        reply.view('templates/level.ejs', {level:level,letters:letters, lines:lines});

    }
    postWord(request, reply) {
        // reply.type('application/json').send({array:array});
        
        const id = request.params.id;
        const word = request.body.word;

        request.session.lines.push(this.game.computeLine(id,word));
        const level = this.game.level(id);
        const letters = this.game.letters(id);
       
        // console.log(array);
        
        reply.view("/templates/level.ejs", { 
            level: level,
            letters: letters,
            lines:request.session.lines
        });
        
    }
    resetSessionIfNeeded(request) {
        if (!request.session.levelId || request.params.id !== request.session.levelId) {
            request.session.levelId = request.params.id;
            request.session.lines = [];
        }
    }

    handleError(error, reply) {
        reply.code(500).view('templates/error.ejs', { code: 500, error: error.message });
    }

    handleNotFound(reply) {
        reply.code(404).view('templates/error.ejs', { code: 404, error: 'Impossible de trouver cette page' });
    } 
}