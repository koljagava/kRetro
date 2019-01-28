import { CardBase } from './persistency/cardBase';
import { BadVoteType, BadVote, CardBad } from './persistency/cardBad';
import { User } from './persistency/user';
import { CardGood } from './persistency/cardGood';
import { RetroAction } from './persistency/retroAction';

export class ClustereCardBase<T extends CardBase> {
    public cards : Array<T> = [];    
    public parentCard : T;

    constructor(cards:Array<T>){
        if (cards == null)
        throw new Error("cards can not be null");
        cards.forEach(card => this.addCard(card));
    }

    public addCard(card : T){
        if (card.clusterId == undefined || card.clusterId === null || card.clusterId == card.id ){
            this.parentCard = card;
        }
        this.cards.push(card);
    }

    public getCardActions = (actions : Array<RetroAction>) =>{
        return actions.filter(action=> this.cards.some(card=> card.id == action.card.id));
    }

    public get message(): string{
        const res : string = "<ul>";
        this.cards.forEach(card=> res + "<li>" + card.message + "</li>");
        return res + '</ul>';
    }
}

export class ClusteredCardGood extends ClustereCardBase<CardGood>{
    public get votes() : Array<User>{
        let result: Array<User> = [];
        this.cards.map(cards=> {result = result.concat(cards.votes)});
        return result;
    }
}

export class ClusteredCardBad extends ClustereCardBase<CardBad>{
    public get votes() : Array<BadVote>{
        let result: Array<BadVote> = [];
        this.cards.map(cards=> {result = result.concat(cards.votes)});
        return result;
    }

    public voteCount = (type: BadVoteType): number => {
        const vt = this.votes;
        return vt.filter(vote => vote.type == type).length;
    };
}