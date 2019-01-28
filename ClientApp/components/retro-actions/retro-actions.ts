import * as ko from 'knockout';
import { Board } from '../../models/persistency/board';
import 'bootstrap';
import { CardGood } from '../../models/persistency/cardGood';
import { CardBad, BadVoteType } from '../../models/persistency/cardBad';
import * as feather from 'feather-icons';
import { RetroActionManagerViewModel } from '../retro-action-manager/retro-action-manager';
import { User } from '../../models/persistency/user';
import { UserService } from '../../services/user.service';
import { CardType, CardBase } from '../../models/persistency/cardBase';
import './retro-action.css';
import * as $ from 'jquery';
import 'jqueryui';
import { ClusteredCardGood, ClusteredCardBad, ClustereCardBase } from '../../models/clusteredCard';

declare global {
    interface Array<T> {
        groupBy<K>(keyGetter:(ele:T) => K ) : Map<K, Array<T>> ;
    }
}
if (!Array.prototype.groupBy) {
    Array.prototype.groupBy = function<T,K>(keyGetter:(item:T) => K ) : Map<K,Array<T>>{
        const map = new Map();
        this.forEach((item) => {
            const key = keyGetter(item);
            if (!map.has(key)) {
                map.set(key, [item]);
            } else {
                map.get(key).push(item);
            }
        });
        return map;    
    }
}

ko.bindingHandlers.clusterizable = {
    moveselected: function (elements :JQuery<HTMLElement>, ol: number, ot : number){
        elements.each(function(){
            const $this = $(this);
            $this.css('left', $this.position().left+ol);
            $this.css('top', $this.position().top+ot);
        });
    },
    init: (element, valueAccessor, allBindings, viewModel, bindingContext) => {
        // Destroy the sortable if knockout disposes the element it's connected to
        ko.utils.domNodeDisposal.addDisposeCallback(element, () => {
            const elements = $(element).find('tr');
            elements.draggable('destroy');
            elements.droppable('destroy');
        });
        const feva = function() {
            return {foreach: valueAccessor()}
        }
        const result = ko.bindingHandlers.template.init(element, feva, allBindings, viewModel, bindingContext);
        const enable = ko.unwrap(allBindings().clusterEnable);
        if (!enable)
            return result;
        $(element).selectable({filter:'tr'});
        return result;
    },
    update :  (element, valueAccessor, allBindings, viewModel, bindingContext) => {
        ko.unwrap(valueAccessor());
        // const oldtrs = $(element).find('tr');
        // oldtrs.draggable('destroy');
        // oldtrs.droppable('destroy');
        const feva = function() {
            return {foreach: valueAccessor()}
        }
        const result = ko.bindingHandlers.template.update(element, feva, allBindings, viewModel, bindingContext);
        const enable = ko.unwrap(allBindings().clusterEnable);
        if (!enable)
            return result;
        let dragged : any = [];
        const trs = $(element).find('tr');
        trs.droppable({
            drop: function( event, ui ) {
                allBindings().oncluster(ko.dataFor(this),ui.helper.data('_koData'));
                trs.droppable('enable');
              },
            tolerance : 'pointer'
        });
        trs.draggable({
            handle: ".cluster-handler",
            helper: function(){
                dragged = $(element).find('tr.ui-selected');
                if (!$(this).hasClass('ui-selected')){
                    $(this).addClass('ui-selected');
                    dragged.removeClass('ui-selected');
                    dragged = $(this);
                }
                dragged.droppable("disable");
                const koData: any = []
                dragged.each((index: number, ele: HTMLElement) => koData.push(ko.dataFor(ele)));
                const helper = $('<div/>').attr('id', 'draggingContainer');
                helper.append(dragged.clone().removeAttr("id").width(dragged.width()));
                helper.data("_koData", koData);
                return helper;
            }//,
            // drag: function(event, ui: any) {
            //     const currentLoc = $(this).position();
            //     let prevLoc = $(this).data('prevLoc');
            //     if (!prevLoc) {
            //         prevLoc = ui.originalPosition;
            //     }       
            //     var offsetLeft = currentLoc.left-prevLoc.left;
            //     var offsetTop = currentLoc.top-prevLoc.top;
            //     ko.bindingHandlers.clusterizable.moveselected(dragged, offsetLeft, offsetTop);
            //     trs.each(function () {
            //         $(this).removeData('prevLoc');
            //      });
            //     $(this).data('prevLoc', currentLoc);
            // }
          });
        return result;
    }
}

export interface IRetroActionsViewModelParams{
    board : KnockoutObservable<Board>
    title : KnockoutSubscribable<string>
}

export class RetroActionsViewModel {
    public badVoteType = BadVoteType;
    private _retroActionManager = RetroActionManagerViewModel;
    public feather =  feather;
    public board: KnockoutObservable<Board> = ko.observable<Board>(null);
    public title: KnockoutSubscribable<string> = ko.observable<string>("");
    public cardsGood: KnockoutComputed<ClusteredCardGood[]>;
    public cardsBad: KnockoutComputed<ClusteredCardBad[]>;
    public teamUsers : KnockoutObservableArray<User> = ko.observableArray([]);
    public isUserManager : KnockoutComputed<boolean>;

    constructor(params : IRetroActionsViewModelParams) {
        if (params == null)
            throw new Error("params can not be null.");
        this.board = params.board;
        this.title = params.title;

        UserService.getTeamUsers().then(users =>{
            this.teamUsers(users);
        });
        
        this.isUserManager = ko.computed(():boolean =>{
            if (this.board()!=null){
                return UserService.currentUser().id == this.board().manager.id;
            }
            return false;
        });

        this.cardsGood = ko.computed(():Array<ClusteredCardGood> =>{
            if (this.board()!=null){
                const clusteredCards: Array<ClusteredCardGood> = [];
                this.board().whatWorks
                    .groupBy(card => card.clusterId==undefined || card.clusterId==null?card.id:card.clusterId)
                    .forEach(cluster => clusteredCards.push(new ClusteredCardGood(cluster)));               
                
                return clusteredCards.filter((card)=> card.votes.length!=0).sort((prev,  curr) => {
                    if (prev.votes.length < curr.votes.length)
                        return 1;
                    if (prev.votes.length > curr.votes.length)
                        return -1;
                    if (prev.parentCard.id < curr.parentCard.id)
                        return 1
                    if (prev.parentCard.id > curr.parentCard.id)
                        return -1
                    return 0;
                });
            }
            return [];
        });

        this.cardsBad = ko.computed(():Array<ClusteredCardBad> =>{
            if (this.board()!=null){
                const clusteredCards: Array<ClusteredCardBad> = [];
                this.board().whatDoesnt
                    .groupBy(card => card.clusterId==undefined || card.clusterId==null?card.id:card.clusterId)
                    .forEach(cluster => clusteredCards.push(new ClusteredCardBad(cluster)));
                return clusteredCards.filter((card)=> card.votes.length!=0).sort((prev,  curr) => {
                    if (prev.votes.length < curr.votes.length)
                        return 1;
                    if (prev.votes.length > curr.votes.length)
                        return -1;
                    if (prev.parentCard.id < curr.parentCard.id)
                        return 1
                    if (prev.parentCard.id > curr.parentCard.id)
                        return -1
                    return 0;
                });
            }
            return [];
        });
    }

    public doCluster = (destination: ClustereCardBase<CardBase>, clusters: Array<ClustereCardBase<CardBase>>) =>{
        const cardsIdToCluster : Array<number> = [];
        clusters.forEach(cluster =>cluster.cards.forEach(card => cardsIdToCluster.push(card.id)));
        UserService.boardService().doCluster(cardsIdToCluster, destination.parentCard.id);
    }

    public doUnCluster = (card: CardBase) =>{
        UserService.boardService().doUnCluster([card.id]);
    }
}

const actionsComponent = { viewModel: RetroActionsViewModel, template: require('./retro-actions.html') };
ko.components.register("retro-actions", actionsComponent);
export default actionsComponent;