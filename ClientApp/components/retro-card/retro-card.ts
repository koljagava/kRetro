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
    public badVoteType = BadVoteType;
    public isDisabled = ko.observable(true);
    public feather = feather;
    public clrVote = ko.observable('LightSteelBlue');
    public clrEasy = ko.observable('LightSteelBlue');
    public clrSignificant = ko.observable('LightSteelBlue');
    public clrUnexpected = ko.observable('LightSteelBlue');

    public constructor(params: {card : CardBase}){
        this.card = params.card;
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

    public cardExit = (cvm : RetroCardViewModel, kEvt : KeyboardEvent)=>{
        const eleValue = (<HTMLInputElement>kEvt.currentTarget ).value;
        this.userService.boardService().updateCardMessage(this.card.id, eleValue);
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
            return true;
        }
        if (kEvt.keyCode == 13) {
            kEvt.preventDefault();
            this.cardExit(cvm, kEvt);
            return true;
        }
        return true;
    }

    private setVoteClr(ele : HTMLElement){
        ele.classList.toggle('card-icon-selected');
    }

    //#region Vote  
    public doVote = (cvm : RetroCardViewModel, kEvt : MouseEvent) : boolean => {        
        const voteStatus = this.userService.boardService().getWhatWorksUserVoteStatus(this.userService.currentUser().id);
        if (this.hasUserVotedForGood() || 
            voteStatus == null ||
            voteStatus.count < this.userService.currentTeam().boardConfiguration.whatWorksVotesPerUser) {
                this.setVoteClr(<HTMLElement>kEvt.currentTarget);
                this.userService.boardService().updateCardGoodVote(this.card.id);
        }
        return true;
    }
    //#endregion

    //#region Easy  
    public doEasy = (cvm : RetroCardViewModel, kEvt : MouseEvent) : boolean => {
        const voteStatus = this.userService.boardService().getWhatDoesntUserVoteStatus(this.userService.currentUser().id);
        if (this.hasUserVotedForBad(BadVoteType.Easy) ||
            voteStatus == null ||
            voteStatus.voteTypeCount[BadVoteType.Easy] < this.userService.currentTeam().boardConfiguration.whatDoesntVotesPerUser) {
                this.setVoteClr(<HTMLElement>kEvt.currentTarget);
                this.userService.boardService().updateCardBadVote(this.card.id, BadVoteType.Easy);
        }
        return true;
    }    
    //#endregion

    //#region Significant
    public doSignificant = (cvm : RetroCardViewModel, kEvt : MouseEvent) : boolean => {
        const voteStatus = this.userService.boardService().getWhatDoesntUserVoteStatus(this.userService.currentUser().id);
        if (this.hasUserVotedForBad(BadVoteType.Significant) ||
            voteStatus == null || 
            voteStatus.voteTypeCount[BadVoteType.Significant] < this.userService.currentTeam().boardConfiguration.whatDoesntVotesPerUser) {
                this.setVoteClr(<HTMLElement>kEvt.currentTarget);
                this.userService.boardService().updateCardBadVote(this.card.id, BadVoteType.Significant);
        }
        return true;        
    }
    //#endregion

    //#region Unexpected
    public doUnexpected = (cvm : RetroCardViewModel, kEvt : MouseEvent) : boolean => {
        const voteStatus = this.userService.boardService().getWhatDoesntUserVoteStatus(this.userService.currentUser().id);
        if (this.hasUserVotedForBad(BadVoteType.Unexpected) ||
            voteStatus == null ||
            voteStatus.voteTypeCount[BadVoteType.Unexpected] < this.userService.currentTeam().boardConfiguration.whatDoesntVotesPerUser){
                this.setVoteClr(<HTMLElement>kEvt.currentTarget);
                this.userService.boardService().updateCardBadVote(this.card.id, BadVoteType.Unexpected);
        }
        return true;
    }
    //#endregion
}
const cardComponent = { viewModel: RetroCardViewModel, template: require('./retro-card.html') };
ko.components.register("retro-card", cardComponent);
export default cardComponent;