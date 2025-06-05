
export class Game{

    async levels(){
        try {
            const response = await fetch("/api/levels");
            const json = await response.json();
            return json;
        } catch (error) {
            return error.message;
        }    
    }
       
    async level(id) {
        try {
            const response = await fetch(`/api/level/${id}`);
            const json = await response.json();
            return json;
        } catch (error) {
            return error.message;
        }
    }

    async letters(id){
        try {
            const response = await fetch(`/api/letters/${id}`);
            const json = await response.json();
            return json;
        } catch (error) {
            return error.message;
        }       }
    async computeLine(id,playedWord){     

       
        const response = await fetch(`/api/line/${id}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ word: playedWord })
            });
        const json = await response.json();
        return json
        // let array=[];
        // let words=this.word(id);
        // for (let i=0;i<words.length;i++){     
        //     let playedLetter = i < playedWord.length ? playedWord[i].toUpperCase() : "_";    
        //     array.push({letter: playedLetter.toUpperCase(),state:words[i].toUpperCase()==playedLetter});
        // }
        // return array;
    }
    navigateTo(path) {
  window.history.pushState(null, null, path);
  this.main();
}
}