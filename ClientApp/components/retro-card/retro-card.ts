import * as ko from 'knockout';
import { CardType, CardBase } from '../../models/persistency/cardBase';
import { UserService } from '../../services/user.service';
import { BoardService } from '../../services/board.service';
import * as feather from 'feather-icons';
import './retro-card.css';
import { CardGood } from '../../models/persistency/cardGood';
import { CardBad, BadVoteType, BadVote } from '../../models/persistency/cardBad';
import { BoardStatus } from '../../models/persistency/board';

export class RetroCardViewModel {
    public userService = UserService;
    public card : CardBase;
    public cardType = CardType;
    public boardStatus = BoardStatus;
    public isDisabled = ko.observable(true);
    public feather = feather;
    public clrVote = ko.observable('LightSteelBlue');
    public clrEasy = ko.observable('LightSteelBlue');
    public clrSignificant = ko.observable('LightSteelBlue');
    public clrUnexpected = ko.observable('LightSteelBlue');

    public constructor(params: {card : CardBase}){
        this.card = params.card;
        if (this.card.type == CardType.Good){
            this.setGoodVoteClr();
        } else if (this.card.type == CardType.Bad){
            this.setBadVoteClr(this.clrEasy, BadVoteType.Easy);
            this.setBadVoteClr(this.clrSignificant, BadVoteType.Significant);
            this.setBadVoteClr(this.clrUnexpected, BadVoteType.Unexpected);
        }
    }

    public currentBoardStatus = ko.computed((): BoardStatus=>{
        if (this.userService.boardService() == null ||
            this.userService.currentUser() == null ||
            this.userService.boardService().board() == null){
            return BoardStatus.New;
        }
        return this.userService.boardService().board().status;
    });

    public doEdit = ()=>{
        if (this.isDisabled()== false)
            return true;
        if (this.userService.boardService() == null ||
            this.userService.currentUser() == null ||        
            this.userService.currentUser().id != this.card.user.id ||
            (this.userService.boardService().board().status != this.boardStatus.WhatDoesntOpened &&
             this.userService.boardService().board().status != this.boardStatus.WhatWorksOpened)) {
            return true;
        }
        this.isDisabled(false);
        return true;
    }

    public cardExit = ()=>{
        this.isDisabled(true);
    }

    public hasUserVotedForGood = (): boolean  => {
        const cg = this.card as CardGood;
        return cg.votes.findIndex(v=> v.id == this.userService.currentUser().id) != -1;
    }

    public hasUserVotedForBad = (type : BadVoteType): boolean => {
        const cg = this.card as CardBad;
        return cg.votes.findIndex(v=> v.type == type && v.user.id == this.userService.currentUser().id) != -1;    
    }

    public checkEnter = (cvm : RetroCardViewModel, kEvt : KeyboardEvent) : boolean => {
        if (this.userService.boardService() == null ||
            this.userService.currentUser() == null ||        
            this.userService.currentUser().id != this.card.user.id) {
            this.cardExit();
            return true;
        }
        if (kEvt.keyCode == 13){
            kEvt.preventDefault();
            this.userService.boardService().updateCardMessage(this.card.id, (<HTMLInputElement>kEvt.currentTarget ).value);
            (<HTMLInputElement>kEvt.currentTarget ).value = "";
            this.cardExit();
            return true;
        }
        return true;
    }

    private setGoodVoteClr(isMouseIn: boolean = false){
        if (this.hasUserVotedForGood()){
            this.clrVote('darkblue');
        }else{
            this.clrVote(isMouseIn?'darkblue':'LightSteelBlue');
        }
    }

    //#region Vote  
    public doVote = (cvm : RetroCardViewModel, kEvt : MouseEvent) : boolean => {
        const voteStatus = this.userService.boardService().getWhatWorksUserVoteStatus(this.userService.currentUser().id);
        if (this.hasUserVotedForGood() || 
            voteStatus == null ||
            voteStatus.count < this.userService.currentTeam().boardConfiguration.whatWorksVotesPerUser){
            this.userService.boardService().updateCardGoodVote(this.card.id);
        }
        return true;
    }
    
    public voteMouseIn =  (cvm : RetroCardViewModel, kEvt : MouseEvent) : boolean => {
        this.setGoodVoteClr(true);
        return true;
    }

    public voteMouseOut =  (cvm : RetroCardViewModel, kEvt : MouseEvent) : boolean => {
        this.setGoodVoteClr(false);
        return true;
    }
    //#endregion

    private setBadVoteClr(obs: KnockoutObservable<string>, type: BadVoteType, isMouseIn: boolean = false) {
        if (this.hasUserVotedForBad(type)){
            obs('darkblue');
        }else{
            obs(isMouseIn?'darkblue':'LightSteelBlue');
        }
    }

    //#region Easy  
    public doEasy = (cvm : RetroCardViewModel, kEvt : MouseEvent) : boolean => {
        const voteStatus = this.userService.boardService().getWhatDoesntUserVoteStatus(this.userService.currentUser().id);
        if (this.hasUserVotedForBad(BadVoteType.Easy) ||
            voteStatus == null ||
            voteStatus.voteTypeCount[BadVoteType.Easy] < this.userService.currentTeam().boardConfiguration.whatDoesntVotesPerUser) {
            this.userService.boardService().updateCardBadVote(this.card.id, BadVoteType.Easy);
        }
        return true;
    }
    
    public easyMouseIn =  (cvm : RetroCardViewModel, kEvt : MouseEvent) : boolean => {
        this.setBadVoteClr(this.clrEasy, BadVoteType.Easy, true);
        return true;
    }

    public easyMouseOut =  (cvm : RetroCardViewModel, kEvt : MouseEvent) : boolean => {
        this.setBadVoteClr(this.clrEasy, BadVoteType.Easy, false);
        return true;
    }
    //#endregion

    //#region Significant
    public doSignificant = (cvm : RetroCardViewModel, kEvt : MouseEvent) : boolean => {
        const voteStatus = this.userService.boardService().getWhatDoesntUserVoteStatus(this.userService.currentUser().id);
        if (this.hasUserVotedForBad(BadVoteType.Significant) ||
            voteStatus == null || 
            voteStatus.voteTypeCount[BadVoteType.Significant] < this.userService.currentTeam().boardConfiguration.whatDoesntVotesPerUser) {
            this.userService.boardService().updateCardBadVote(this.card.id, BadVoteType.Significant);
        }
        return true;
    }
    
    public significantMouseIn =  (cvm : RetroCardViewModel, kEvt : MouseEvent) : boolean => {
        this.setBadVoteClr(this.clrSignificant, BadVoteType.Significant, true);
        return true;
    }

    public significantMouseOut =  (cvm : RetroCardViewModel, kEvt : MouseEvent) : boolean => {
        this.setBadVoteClr(this.clrSignificant, BadVoteType.Significant, false);
        return true;
    }
    //#endregion

    //#region Unexpected
    public doUnexpected = (cvm : RetroCardViewModel, kEvt : MouseEvent) : boolean => {
        const voteStatus = this.userService.boardService().getWhatDoesntUserVoteStatus(this.userService.currentUser().id);
        if (this.hasUserVotedForBad(BadVoteType.Unexpected) ||
            voteStatus == null ||
            voteStatus.voteTypeCount[BadVoteType.Unexpected] < this.userService.currentTeam().boardConfiguration.whatDoesntVotesPerUser){
            this.userService.boardService().updateCardBadVote(this.card.id, BadVoteType.Unexpected);
        }
        return true;
    }
    
    public unexpectedMouseIn =  (cvm : RetroCardViewModel, kEvt : MouseEvent) : boolean => {
        this.setBadVoteClr(this.clrUnexpected, BadVoteType.Unexpected, true);
        return true;
    }

    public unexpectedMouseOut =  (cvm : RetroCardViewModel, kEvt : MouseEvent) : boolean => {
        this.setBadVoteClr(this.clrUnexpected, BadVoteType.Unexpected, false);
        return true;
    }
    //#endregion
}
const cardComponent = { viewModel: RetroCardViewModel, template: require('./retro-card.html') };
ko.components.register("retro-card", cardComponent);
export default cardComponent;