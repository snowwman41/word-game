export class ClientApp {
    constructor(game) {
      this.game = game;
    }
  
    async main(){
        try {
            const pathname = window.location.pathname;
            if (pathname === '/') {
                await this.loadIndex();
            } else if (pathname.startsWith('/level/')) {
              const lastIndex = pathname.lastIndexOf('/');
              const id = parseInt(pathname.substring(lastIndex + 1));
              await this.loadLevel(id);
            } else {   
                this.loadError(404, 'Page non trouvée');  
            }
        } catch (error) {
            this.loadError(500, 'Erreur interne');        
        }  
        this.setupLinks()      
    }
    async loadLevel(id) {
        const level = await this.game.level(id);
        const content = document.querySelector("#content");
        content.innerHTML = `
        <br>
        <div class="col-4 offset-4">
            <table class="table table-bordered text-center">
                <tbody>
                </tbody>
            </table>
            <div class="input-group mb-3">
                <input type="text" class="form-control">
                <button class="btn btn-outline-secondary">Proposer</button>
            </div>
        </div>`;
        const level_description = document.querySelector("#level_description");
        level_description.innerHTML = `${level.theme} (${level.length} lettres)`;
        await this.addLetters(level.id);
        const btn = document.querySelector("button");
        btn.onclick = () => this.onSubmitWord(id);
        
    }
    async addLetters(id) { 
        const tbody = document.querySelector('tbody');
        const tr= document.createElement('tr');
        tbody.appendChild(tr);
        for ( const letter of await this.game.letters(id)){
            const td= document.createElement('td');
            td.classList.add("text-bg-primary");
            td.innerHTML=letter;
            tr.appendChild(td);
        }
    }
    addLine(line) { 
        const tbody = document.querySelector('tbody');
        const tr= document.createElement('tr');
        tbody.appendChild(tr);
        for (const object of line){
            const td= document.createElement('td');
            td.innerHTML=object.letter;
            tr.appendChild(td);
            object.state == true ? td.classList.add("text-bg-success") : td.classList.add("text-bg-danger");
        }
        /* à compléter dans un prochain exercice */ }
    async onSubmitWord(id) { 
        const input = document.querySelector('input');
        const value = input.value;
        const array = await this.game.computeLine(id,value);
        this.addLine(array);
        input.value='';
     }
    async loadIndex() {
        const content = document.querySelector("#content");
        content.innerHTML = `
            <br>
            <table class="table table-striped table-hover">
                <thead>
                    <tr>
                        <th>Longueur</th>
                        <th>Thème</th>
                        <th>Difficulté</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                </tbody>
            </table>
        `;
        const level_description = document.querySelector("#level_description");
        level_description.innerHTML = '';
        await this.addLevels();
    }
    async addLevels() {
        const levels = await this.game.levels();
        for (const level of levels) {
          this.addLevel(level);
        }
    }
    addLevel(level) {
        const tbody = document.querySelector('tbody');
        const tr = document.createElement('tr');
        tbody.appendChild(tr);    
        
        const td1 = document.createElement('td');
        td1.innerHTML= level.length + " lettres";
        
        const td2 = document.createElement('td');
        td2.innerHTML= level.theme;

        const td3 = document.createElement('td');
        let stars = "";
        for(let i=0; i<level.difficulty; i++){
            stars = stars + "&#9733";
        }
        td3.innerHTML= stars;

        const td4 = document.createElement('td');
        const link= document.createElement('a');
        link.innerHTML="Démarrer";
        link.href=`/level/${level.id}`;
        td4.appendChild(link);

        tr.appendChild(td1);
        tr.appendChild(td2);
        tr.appendChild(td3);
        tr.appendChild(td4);
    }
    loadError(code, message) {
        const content = document.querySelector("#content");
        content.innerHTML = `
            <div class="d-flex align-items-center justify-content-center vh-100">
                <div class="text-center">
                    <h1 class="display-1 fw-bold">${code}</h1>
                    <p class="lead">${message}</p>
                    <a href="/" class="btn btn-primary">Retour à la liste des jeux</a>
                </div>
            </div>
        `;
        const levelDescription = document.querySelector("#level_description");
        levelDescription.innerText = '';
    }
    navigateTo(path) {
        window.history.pushState(null, null, path);
        this.main();
      }
    setupLinks() {
    const links = document.querySelectorAll("a");
    for (const link of links) {
        link.onclick = (event) => {
            event.preventDefault();
            this.navigateTo(link.href);
        };
    }
    }  
  }