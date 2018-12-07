import * as ko from 'knockout';
import * as $ from 'jquery';
import { UserService } from '../../services/user.service';
import * as Boostrap from 'bootstrap';
import * as feather from 'feather-icons';
import { CardBase } from '../../models/persistency/cardBase';
import { RetroAction, RetroActionStatus } from '../../models/persistency/retroAction';
import { BoardStatus, Board } from '../../models/persistency/board';
import { User } from '../../models/persistency/user';

interface IRetroActionManagerParams {
    board: KnockoutObservable<Board>;
    card : CardBase
    teamUsers : KnockoutObservableArray<User>
}

export class RetroActionManagerViewModel {
    public userService = UserService;
    private _bootstrap = Boostrap;
    public feather =  feather;    
    public card : KnockoutObservable<CardBase>;
    public selectedFieldId : string = null;
    public boardStatus = BoardStatus;
    public board: KnockoutObservable<Board>;
    public actions: KnockoutComputed<Array<RetroAction>>;
    public isDisabled: KnockoutComputed<boolean>;
    public teamUsers : KnockoutObservableArray<User> = ko.observableArray([]);
    public retroActionStatus = RetroActionStatus;
    private _retroActionStatusList: Array<string> =[];

    public get retroActionStatusList(){
        if (this._retroActionStatusList.length != 0)
            return this._retroActionStatusList;
        for (var enumMember in RetroActionStatus) {
            if (isNaN(Number(RetroActionStatus[enumMember])))
                continue;
                this._retroActionStatusList.push(RetroActionStatus[enumMember])
         }
         return this._retroActionStatusList;
    };

    public getActionStatusName = (data:any) =>{
        return RetroActionStatus[data];
    }

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
        if (params.teamUsers == null){
            throw new Error("teamUsers can not be null");
        }
        this.card = ko.observable<CardBase>(params.card);
        this.board = params.board;
        this.teamUsers = params.teamUsers;

        this.actions = ko.computed(():Array<RetroAction> =>{
            let acts : Array<RetroAction>= [];
            if (this.card() != null &&
                this.board()!=null &&
                this.teamUsers().length != 0){
                    acts = this.board().actions.filter((act)=> act.card.id ==this.card().id).map(act => {
                        let teamUser : User;
                        if (act.inChargeTo!= null){
                            teamUser = this.teamUsers().find(usr => usr.id == act.inChargeTo.id);
                            if (teamUser != null){
                                act.inChargeTo = teamUser;
                            }
                        }
                        if (act.whoChecks!= null){
                            teamUser = this.teamUsers().find(usr => usr.id == act.whoChecks.id);
                            if (teamUser != null){
                                act.whoChecks = teamUser;
                            }
                        }
                        return act;
                    });
                    setTimeout(()=>{
                        if (this.selectedFieldId != null){
                            const ele = <HTMLInputElement>document.getElementById(this.selectedFieldId);
                            if (ele!= null){
                                ele.focus();
                                if (ele.select){
                                    ele.select();
                                }
                            }
                        }
                    }, 0);
            }
            if (this.board()!= null &&
                this.board().status == this.boardStatus.ActionsOpened){
                    acts.push(new RetroAction(this.card()));
            }
            return acts;
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

    public saveStatus = (action : RetroAction) => {
        this.userService.boardService().updateAction(action);
    }

    public saveAction = (action : RetroAction, kEvt : KeyboardEvent) : boolean => {
        if ((<HTMLElement>kEvt.currentTarget).getAttribute('type') == 'input'){
            this.selectedFieldId = null;
        }
        if (action.description != "" ||
            action.inChargeTo != null ||
            action.whoChecks != null){
            this.userService.boardService().updateAction(action);
        }
        return true;
    }
}

const actionsComponent = { viewModel: RetroActionManagerViewModel, template: require('./retro-action-manager.html') };
ko.components.register("retro-action-manager", actionsComponent);
export default actionsComponent;