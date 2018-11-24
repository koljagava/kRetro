import * as ko from 'knockout';
import { UserService } from '../../services/user.service';
import * as Boostrap from 'bootstrap';
import * as feather from 'feather-icons';
import { CardBase } from '../../models/persistency/cardBase';
import { RetroAction } from '../../models/persistency/retroAction';
import { BoardStatus } from '../../models/persistency/board';

interface IRetroActionManagerParams {
    card : CardBase
}

export class RetroActionManagerViewModel {
    public userService = UserService;
    private _bootstrap = Boostrap;
    public feather =  feather;    
    public card : KnockoutObservable<CardBase> = ko.observable<CardBase>(null);
    public selectedFieldId : string = null;
    public boardStatus = BoardStatus;

    public constructor(params: IRetroActionManagerParams) {
        if (params.card == null){
            throw new Error("card can not be null");
        }
        this.card(params.card);
    }

    public actions = ko.computed(():Array<RetroAction> =>{
            if (this.card() != null &&
                this.userService.boardService()!=null && 
                this.userService.boardService().board()!=null){
                const actions = this.userService.boardService().board().actions.filter((act)=> act.card.id ==this.card().id);
                actions.push(new RetroAction(this.card()));
                setTimeout(()=>{
                    if (this.selectedFieldId != null){
                        const ele = <HTMLInputElement>document.getElementById(this.selectedFieldId);
                        if (ele!= null){
                            ele.focus();
                            ele.select();
                        }
                    }
                }, 0);
                return actions;
            }
            return [new RetroAction(this.card())];
    }).extend({ notify: 'always' });

    public isDisabled = ko.computed((): boolean =>{
        if (this.userService.boardService()!=null && 
            this.userService.boardService().board()!=null &&
            this.userService.boardService().board().status == this.boardStatus.ActionsOpened){
            return this.userService.boardService().user().id != this.userService.boardService().board().manager.id;
        }
        return true;
    });

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