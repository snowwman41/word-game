import Fastify from "fastify";
import fs from "fs";
import { fastifyStatic } from "@fastify/static";

export class ServerApp {
    constructor(game) {
        this.game = game;
    }
    build(logEnabled) {
        const fastify = new Fastify({logger: logEnabled})
        fastify.register(fastifyStatic, { root: new URL('static', import.meta.url) });
        fastify.get("/api/levels", (request, reply) => this.getLevels(request, reply));
        fastify.get("/api/level/:id(^\\d+$)", (request, reply) => this.getLevel(request, reply));
        fastify.get("/api/letters/:id(^\\d+$)", (request, reply) => this.getLetters(request, reply));
        fastify.post("/api/line/:id(^\\d+$)", (request, reply) => this.getLine(request, reply));
        
        fastify.setNotFoundHandler((request, reply) => this.sendIndex(reply));
        return fastify;
    }

    start(port, logEnabled) {
        const fastify = this.build(logEnabled);
        fastify.listen({ port: port }, (err, address) => {
            if (err) { fastify.log.error(err); process.exit(1) }
        });
    }

    sendIndex(reply) {
        const stream = fs.createReadStream(new URL('static/index.html', import.meta.url));
        reply.code(200).type('text/html').send(stream);
    }
    // getLevels(request, reply) {
    //     console.log("GET LEVELS SERVER");
    //     reply.type('application/json').send(this.game.levels());      
    // }
    getLevels(request, reply) {
        reply.type('application/json').send(this.game.levels());    
      }
    getLevel(request, reply) {
        const id = parseInt(request.params.id);
        reply.type('application/json').send(this.game.level(id));    
    }
    getLetters(request, reply) {
        const id = parseInt(request.params.id);
        reply.type('application/json').send(this.game.letters(id));    
    }
    getLine(request, reply) {
        const id = parseInt(request.params.id);
        const word = request.body.word;
        reply.code(200).type('application/json').send(this.game.computeLine(id,word));
    }
}
