import * as ko from 'knockout';
import { Board } from '../../models/persistency/board';
import * as Boostrap from 'bootstrap';
import { CardGood } from '../../models/persistency/cardGood';
import { CardBad, BadVoteType } from '../../models/persistency/cardBad';
import * as feather from 'feather-icons';
import { RetroActionManagerViewModel } from '../retro-action-manager/retro-action-manager';


export interface IRetroActionsViewModelParams{
    board : KnockoutObservable<Board>
    title : KnockoutSubscribable<string>
}


export class RetroActionsViewModel {
    public badVoteType = BadVoteType;
    private _bootstrap = Boostrap;
    private _retroActionManager = RetroActionManagerViewModel;
    public feather =  feather;
    public board: KnockoutObservable<Board> = ko.observable<Board>(null);
    public title: KnockoutSubscribable<string> = ko.observable<string>("");
    cardsGood: KnockoutComputed<CardGood[]>;
    cardsBad: KnockoutComputed<CardBad[]>;

    constructor(params : IRetroActionsViewModelParams) {
        if (params == null)
            throw new Error("params can not be null.");
        this.board = params.board;
        this.title = params.title;

        this.cardsGood = ko.computed(():Array<CardGood> =>{
            if (this.board()!=null){
                return this.board().whatWorks.filter((card)=> card.votes.length!=0).sort((prev,  curr) => {
                    if (prev.votes.length < curr.votes.length)
                        return 1;
                    if (prev.votes.length > curr.votes.length)
                        return -1;
                    if (prev.id < curr.id)
                        return 1
                    if (prev.id > curr.id)
                        return -1
                    return 0;
                });
            }
            return [];
        });

        this.cardsBad = ko.computed(():Array<CardBad> =>{
            if (this.board()!=null){
                return this.board().whatDoesnt.filter((card)=> card.votes.length!=0).sort((prev,  curr) => {
                    if (prev.votes.length < curr.votes.length)
                        return 1;
                    if (prev.votes.length > curr.votes.length)
                        return -1;
                    if (prev.id < curr.id)
                        return 1
                    if (prev.id > curr.id)
                        return -1
                    return 0;
                });
            }
            return [];
        });    
    }
}

const actionsComponent = { viewModel: RetroActionsViewModel, template: require('./retro-actions.html') };
ko.components.register("retro-actions", actionsComponent);
export default actionsComponent;