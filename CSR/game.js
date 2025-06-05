
export class Game{
    constructor(data){
        this.data=data;
    }
    levels(){
        return this.data.levels
    }
    level(id){
        for (const level of this.data.levels){
            if (level.id == id){
                return level;
            }
        }
        throw new Error("Niveau non trouvé");
    }
    word(id){        
        if (this.data.words[id] != undefined){
            return this.data.words[id];
        }        
        throw new Error("Mot non trouvé");
    }
    stringToArray(string){
        // let array=[];
        // for(let i=0;i<string.length;i++){
        //     array.push(string.toUpperCase().charAt(i));
        // }
        // return array;
        return string.toUpperCase().split("");
    }
    letters(id){
        return this.stringToArray(this.word(id)).sort();
    }
    computeLine(id,playedWord){
        let array=[];
        let words=this.word(id);
        for (let i=0;i<words.length;i++){     
            let playedLetter = i < playedWord.length ? playedWord[i].toUpperCase() : "_";    
            array.push({letter: playedLetter.toUpperCase(),state:words[i].toUpperCase()==playedLetter});
        }
        return array;
    }
}