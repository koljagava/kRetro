import * as ko from 'knockout';
import { UserService } from '../../services/user.service';
import * as Boostrap from 'bootstrap';
import * as feather from 'feather-icons';
import { CardBase } from '../../models/persistency/cardBase';
import { RetroAction } from '../../models/persistency/retroAction';
import { BoardStatus, Board } from '../../models/persistency/board';

interface IRetroActionManagerParams {
    board: KnockoutObservable<Board>;
    card : CardBase
}

export class RetroActionManagerViewModel {
    public userService = UserService;
    private _bootstrap = Boostrap;
    public feather =  feather;    
    public card : KnockoutObservable<CardBase>;
    public selectedFieldId : string = null;
    public boardStatus = BoardStatus;
    public board: KnockoutObservable<Board>;
    public actions: KnockoutComputed<RetroAction[]>;
    public isDisabled: KnockoutComputed<boolean>;

    public constructor(params: IRetroActionManagerParams) {
        if (params == null){
            throw new Error("params can not be null");
        }
        if (params.card == null){
            throw new Error("card can not be null");
        }
        if (params.board == null){
            throw new Error("board can not be null");
        }
        this.card = ko.observable<CardBase>(params.card);
        this.board = params.board;

        this.actions = ko.computed(():Array<RetroAction> =>{
            let actions : Array<RetroAction> = [];
            if (this.card() != null &&
                this.board()!=null){
                actions = this.board().actions.filter((act)=> act.card.id ==this.card().id);
                setTimeout(()=>{
                    if (this.selectedFieldId != null){
                        const ele = <HTMLInputElement>document.getElementById(this.selectedFieldId);
                        if (ele!= null){
                            ele.focus();
                            ele.select();
                        }
                    }
                }, 0);
            }
            if (this.board()!= null &&
                this.board().status == this.boardStatus.ActionsOpened){
                actions.push(new RetroAction(this.card()));
            }
            return actions;
        }).extend({ notify: 'always' });

        this.isDisabled = ko.computed((): boolean =>{
            if (this.board()!=null &&
                this.board().status == this.boardStatus.ActionsOpened){
                return this.userService.currentUser().id != this.board().manager.id;
            }
            return true;
        });
    }

    public setFocus = (action : RetroAction, kEvt : KeyboardEvent) =>{
        this.selectedFieldId = (<HTMLElement>kEvt.currentTarget).id;
    }

    public saveAction = (action : RetroAction, kEvt : KeyboardEvent) : boolean => {
        this.selectedFieldId = null;
        if (action.description != "" ||
            action.inChargeTo  != "" ||
            action.whoChecks != ""){
            this.userService.boardService().updateAction(action);
        }
        return true;
    }
}

const actionsComponent = { viewModel: RetroActionManagerViewModel, template: require('./retro-action-manager.html') };
ko.components.register("retro-action-manager", actionsComponent);
export default actionsComponent;