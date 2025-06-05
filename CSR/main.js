

import { data } from "./data.js";
import { Game } from "./game.js";
import { ServerApp }  from "./server-app.js";

const game = new Game(data);
const app = new ServerApp(game);
app.start(5000, true);