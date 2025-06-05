import { Game } from './game.js'
import { ClientApp } from './client-app.js'

const game = new Game();
const app = new ClientApp(game);

window.onload = () => app.main();
window.onpopstate = () => app.main();