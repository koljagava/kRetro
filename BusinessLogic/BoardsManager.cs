using System.Collections.Generic;
using System.Threading;
using kRetro.BusinessLogic.Context;
using kRetro.BusinessLogic.Models.Persistency;
using kRetro.Hubs;
using Microsoft.AspNetCore.SignalR;
using System.Linq;
using kRetro.BusinessLogic.Models.Comunication;
using System.Threading.Tasks;
using System;
using System.Timers;

namespace kRetro.BusinessLogic
{
    public class BoardsManager
    {
        public IHubContext<BoardsHub> HubContext {get;set;}
        private readonly SemaphoreSlim _boardsLock = new SemaphoreSlim(1, 1);

        public BoardsManager(IHubContext<BoardsHub> context)
        {
            HubContext = context;
        }
        private Dictionary<int, BoardManager> Boards = new Dictionary<int, BoardManager>();

        public async Task AddUserAsync(UserBoardConnection userBoard)
        {
            await HubContext.Groups.AddToGroupAsync(userBoard.ConnectionId, userBoard.TeamId.ToString());
            await _boardsLock.WaitAsync();
            try
            {            
                if (Boards.ContainsKey(userBoard.TeamId))
                {
                    var board = Boards[userBoard.TeamId];
                    board.AddUser(userBoard.ConnectionId, userBoard.UserId);
                    if (board.Board!=null)
                        board.BroadcastBoardUpdate(true, HubContext.Clients.Client(userBoard.ConnectionId)).Wait();
                }
                else
                {
                    var board = CreateBoard(userBoard, HubContext.Clients.Group(userBoard.TeamId.ToString()));
                    Boards.Add(userBoard.TeamId, board);
                }
            }
            finally
            {
                _boardsLock.Release();
            }           
        }

        public void RemoveUser(string connectionId)
        {
            foreach (var board in Boards.Values.Where(ob=> ob.IsConnectionIn(connectionId))){
                board.RemoveUser(connectionId);
                HubContext.Groups.RemoveFromGroupAsync(connectionId, board.Team.Id.ToString());
            }
        }

        private BoardManager CreateBoard(UserBoardConnection userBoard, IClientProxy group){
            var board = new BoardManager(userBoard.TeamId, group);
            board.AddUser(userBoard.ConnectionId, userBoard.UserId);
            return board;
        }
        
        private BoardManager GetBoardManager(string connectionId){
            var bm = Boards.Values.Where(ob=> ob.IsConnectionIn(connectionId)).ToList();
            if (bm.Count == 1)
                return bm[0];
            throw new Exception($"BoardManager not found for connection Id {connectionId}");
        }

        internal async Task StarNewBoardAsync(string connectionId, string boardName)
        {
            await GetBoardManager(connectionId).StartNewBoardAsync(connectionId, boardName);
        }

        internal async Task AddCardMessageAsync (string connectionId, string message)
        {
            await GetBoardManager(connectionId).AddCardMessageAsync(connectionId, message);
        }

        internal async Task UpdateCardMessageAsync (string connectionId, int id, string message)
        {
            await GetBoardManager(connectionId).UpdateCardMessageAsync(connectionId, id, message);
        }

        internal async Task ChangeBoardStatusAsync(string connectionId, bool isInternalCall){
            await GetBoardManager(connectionId).ChangeBoardStatusAsync(isInternalCall);
        }

        internal async Task UpdateCardGoodVoteAsync(string connectionId, int cardId){
            await GetBoardManager(connectionId).UpdateCardGoodVoteAsync(connectionId, cardId);
        }

        internal async Task UpdateCardBadVoteAsync(string connectionId, int cardId, BadVoteType type){
            await GetBoardManager(connectionId).UpdateCardBadVoteAsync(connectionId, cardId, type);
        }

        internal async Task UpdateActionAsync(string connectionId, RetroAction action)
        {
            await GetBoardManager(connectionId).UpdateActionAsync(connectionId, action);
        }

        internal async Task DoClusterAsync(string connectionId, List<int> cardsIdToCluster, int clusterId)
        {
            await GetBoardManager(connectionId).DoClusterAsync(connectionId, cardsIdToCluster, clusterId);
        }

        internal async Task DoUnClusterAsync(string connectionId, List<int> cardsIdToUnCluster)
        {
            await GetBoardManager(connectionId).DoClusterAsync(connectionId, cardsIdToUnCluster, null);
        }

        internal async Task UpdateBoardConfigAsync(string connectionId, BoardConfig boardConfig){
            foreach (var board in Boards.Values.Where(b=> b.Team.BoardConfiguration.Id == boardConfig.Id))
            {
                await board.UpdateBoardConfigAsync(boardConfig);
            }
        }
    }


    public class BoardManager {
        public Dictionary<User, string> ConnectedUser {get;set;} = new Dictionary<User, string>();
        public Team Team {get;private set;}
        public Board Board {get;private set;}
        public System.Timers.Timer BoardTimer {get;set;} 
        public int ElapsedMinutes {get;private set;}
        public IClientProxy Group {get;private set;}
        private readonly SemaphoreSlim _boardLock = new SemaphoreSlim(1, 1);

        public BoardManager(int teamId, IClientProxy group){
            this.Group = group;
            BoardTimer = new System.Timers.Timer(60000)
            {
                Enabled = false,
                AutoReset = true
            };
            BoardTimer.Elapsed += OnOneMinutePassed;
            using(var context = new LiteDbContext()){
                Team = context.Teams.Include(t=> t.BoardConfiguration).FindById(teamId); 
                var boards = context.Boards
                                .Include(b=> b.Actions)
                                .Include(b=> b.Manager)
                                .Find(b => b.Status != BoardStatus.Closed).ToList();
                if (boards.Count != 0){
                    Board = boards.Last();
                    Board.WhatWorks = context.Cards.Include(c => c.User).Find(c => Board.WhatWorks.Exists(cww => cww.Id == c.Id)).Cast<CardGood>().ToList();
                    Board.WhatDoesnt = context.Cards.Include(c => c.User).Find(c => Board.WhatDoesnt.Exists(cwd => cwd.Id == c.Id)).Cast<CardBad>().ToList();
                    RestartBoard();
                }
            }
        }

        private async void RestartBoard()
        {
            if (Board.Status == BoardStatus.New){
                 await BroadcastBoardUpdate(true);
                 return;
            }

            Board.Status = (BoardStatus)((int)Board.Status)-1;
            await ChangeBoardStatusAsync(true);
        }

        private void StartBoardTimer(){
            ElapsedMinutes = 0;
            BoardTimer.Start();
        }
        private void StopBoardTimer(){
            BoardTimer.Stop();
        }

        private void OnOneMinutePassed(Object source, ElapsedEventArgs e)
        {
            ElapsedMinutes++;
            int minutes=0;
            IEnumerable<CardBase> cards = null;
            switch(Board.Status)
            {
                case BoardStatus.WhatWorksOpened:
                    minutes = Team.BoardConfiguration.WhatWorksMinutes;
                    cards = Board.WhatWorks;
                    break;
                case BoardStatus.WhatDoesntOpened:
                    minutes = Team.BoardConfiguration.WhatDoesntMinutes;
                    cards = Board.WhatDoesnt;
                    break;
                default:
                    return;
            }
            if (minutes == ElapsedMinutes){
                StopBoardTimer();
                ChangeBoardStatusAsync(true).Wait();
                return;
            }

            if (Math.Round((decimal)((minutes+1) / 2)) == ElapsedMinutes){
                Group.SendAsync("SendMessage", "Let show other cards.");
                UpdateAllCardsAsVisible(cards);
                BroadcastBoardUpdate().Wait();
            }

            if ((minutes - ElapsedMinutes)<=1){
                Group.SendAsync("SendMessage", "One minute left.").Wait();
            }
        }

        private void UpdateAllCardsAsVisible(IEnumerable<CardBase> cards)
        {
            using(var context = new LiteDbContext()){
                foreach(var card in cards.Where(c=> !c.Visible)){
                    card.Visible = true;
                    context.Cards.Update(card);
                }
            }
        }

        internal void AddUser(string connectionId, int userId)
        {
            var user = ConnectedUser.Keys.FirstOrDefault(u=> u.Id == userId);
            if (user!=null)
                ConnectedUser[user] = connectionId;
            else{
                using(var context = new LiteDbContext()){
                    user = context.Users.FindById(userId); 
                }
                if (user != null)
                    ConnectedUser.Add(user, connectionId);
            }
            //BroadCast Messages for UpdatedConnectedUser
            BroadcastConnectedUsersUpdate().Wait();
        }

        private User TryGetUserByConectionId(string connectionId){
            return ConnectedUser.Where(ukvp=> ukvp.Value == connectionId).Select(ukvp=> ukvp.Key).FirstOrDefault();
        }

        internal void RemoveUser(string connectionId)
        {
            var user = TryGetUserByConectionId(connectionId);
            if (user!=null)
                ConnectedUser.Remove(user);
            //BroadCast Messages for UpdatedConnectedUser
            BroadcastConnectedUsersUpdate().Wait();
        }

        private async Task BroadcastConnectedUsersUpdate()
        {
            await Group.SendAsync("ConnectedUsersUpdate", ConnectedUser.Keys); 
        }

        private User GetConnectedUser(string connectionId){
            var user = TryGetUserByConectionId(connectionId);
            if (user == null)
                throw new Exception($"ConnectedUser not found for connection Id {connectionId}");
            return user;
        }

        internal bool IsConnectionIn(string connectionId){
            return ConnectedUser.Values.Any(cid=> cid == connectionId);
        }

        internal async Task StartNewBoardAsync(string connectionId, string boardName)
        {
            await _boardLock.WaitAsync();
            try
            {
                if (Board!=null)
                    return;
                Board = new Board {
                    Name = boardName,
                    Date = DateTime.Now,
                    Manager = GetConnectedUser(connectionId)
                };
                using(var context = new LiteDbContext()){
                    context.Boards.Insert(Board);
                    Team.Boards.Add(Board);
                    context.Teams.Update(Team);
                }
                await BroadcastBoardUpdate(true);
            }
            finally
            {
                _boardLock.Release();
            }            
        }

        internal async Task AddCardMessageAsync(string connectionId, string message)
        {
            await _boardLock.WaitAsync();
            try
            {
                if (Board==null)
                    throw new Exception("Board does not exists.");
                
                switch (Board.Status){
                    case BoardStatus.WhatWorksOpened:
                        var gCard = new CardGood{
                            Message = message,
                            CreationDateTime = DateTime.Now,
                            User = GetConnectedUser(connectionId),
                            Visible = false
                        };
                        using(var context = new LiteDbContext()){
                            context.Cards.Insert(gCard);
                            Board.WhatWorks.Add(gCard);
                            context.Boards.Update(Board);
                        }
                    break;
                    case BoardStatus.WhatDoesntOpened:
                        var bCard = new CardBad{
                            Message = message,
                            CreationDateTime = DateTime.Now,
                            User = GetConnectedUser(connectionId),
                            Visible = false
                        };
                        using(var context = new LiteDbContext()){
                            context.Cards.Insert(bCard);
                            Board.WhatDoesnt.Add(bCard);
                            context.Boards.Update(Board);
                        }
                    break;
                    default:
                    throw new Exception("It is not time to add cards.");
                }
                await BroadcastBoardUpdate();
            }
            finally
            {
                _boardLock.Release();
            }            
        }

        internal async Task UpdateCardGoodVoteAsync(string connectionId, int cardId)
        {
            await _boardLock.WaitAsync();
            try
            {
                if (Board==null)
                    throw new Exception("Board does not exists.");
                
                var card = Board.WhatWorks.Find(cg=> cg.Id == cardId);

                if (card == null)
                    throw new Exception($"Card Good does not exists [Card Id : {cardId}].");
                var user = GetConnectedUser(connectionId);

                var uv = card.Votes.Find(vote=> vote.Id == user.Id);

                if (uv == null)
                    card.Votes.Add(user);
                else
                    card.Votes.Remove(uv);

                using (var context = new LiteDbContext()){
                    context.Cards.Update(card);
                }

                await BroadcastBoardUpdate();
            }
            finally
            {
                _boardLock.Release();
            }            
        }

        internal async Task UpdateCardBadVoteAsync(string connectionId, int cardId, BadVoteType type)
        {
            await _boardLock.WaitAsync();
            try
            {
                if (Board==null)
                    throw new Exception("Board does not exists.");
                
                var card = Board.WhatDoesnt.Find(cg=> cg.Id == cardId);

                if (card == null)
                    throw new Exception($"Card Good does not exists [Card Id : {cardId}].");
                var user = GetConnectedUser(connectionId);

                var uv = card.Votes.Find(vote=> vote.User.Id == user.Id && vote.Type == type);

                if (uv == null)
                    card.Votes.Add(new BadVote{ Type = type, User = user});
                else
                    card.Votes.Remove(uv);

                using (var context = new LiteDbContext()){
                    context.Cards.Update(card);
                }

                await BroadcastBoardUpdate();
            }
            finally
            {
                _boardLock.Release();
            }            
        }

        internal async Task UpdateCardMessageAsync(string connectionId, int id, string message)
        {
            await _boardLock.WaitAsync();
            try
            {
                if (Board==null)
                    throw new Exception("Board does not exists.");
                switch (Board.Status){
                    case BoardStatus.WhatWorksOpened:
                        var gCard = Board.WhatWorks.Find(c=> c.Id == id);
                        using(var context = new LiteDbContext()){                            
                            if (string.IsNullOrEmpty(message)){
                                Board.WhatWorks.Remove(gCard);
                                context.Cards.Delete(c=> c.Id == id);    
                            }else{
                                gCard.Message = message;
                                context.Cards.Update(gCard);
                            }
                            context.Boards.Update(Board);
                        }
                    break;
                    case BoardStatus.WhatDoesntOpened:
                        var bCard = Board.WhatDoesnt.Find(c=> c.Id == id);
                        using(var context = new LiteDbContext()){                            
                            if (string.IsNullOrEmpty(message)){
                                Board.WhatDoesnt.Remove(bCard);
                                context.Cards.Delete(c=> c.Id == id);    
                            }else{
                                bCard.Message = message;
                                context.Cards.Update(bCard);
                            }
                            context.Boards.Update(Board);
                        }
                    break;
                    default:
                    throw new Exception("It is not time to update cards.");
                }
                await BroadcastBoardUpdate();
            }
            finally
            {
                _boardLock.Release();
            }            
        }

        internal async Task DoClusterAsync(string connectionId, List<int> cardsIdToCluster, int? clusterId)
        {
            await _boardLock.WaitAsync();
            try
            {
                if (Board==null)
                    throw new Exception("Board does not exists.");
                using(var context = new LiteDbContext()){
                    var boardCards = Board.WhatWorks.Cast<CardBase>().Concat(Board.WhatDoesnt).ToList();
                    foreach(var cardId in cardsIdToCluster){
                        var card = boardCards.Find(c=> c.Id == cardId);
                        if (card != null){
                            if (clusterId == null && card.ClusterId == null){
                                var cluster = boardCards.Where(c=> c.ClusterId == card.Id).ToList();
                                if (cluster.Count != 0) {
                                    cluster[0].ClusterId = null;
                                    context.Cards.Update(cluster[0]);
                                    foreach(var ccard in cluster) {
                                        if (ccard.Id != cluster[0].Id){
                                            ccard.ClusterId = cluster[0].Id;
                                            context.Cards.Update(ccard);
                                        }
                                    }
                                }
                            } else{
                                card.ClusterId = clusterId;
                                context.Cards.Update(card);
                            }
                        }
                    }
                }
                await BroadcastBoardUpdate();
            }
            finally
            {
                _boardLock.Release();
            }       
        }

        internal async Task ChangeBoardStatusAsync(bool isInternalCall){
            await _boardLock.WaitAsync();
            try
            {
                //TODO 0: allow status change only to board manager if is not an internalCall
                if (Board==null)
                    throw new Exception("Board does not exists.");

                var actualStatus = this.Board.Status;
                var nextStatus = actualStatus;

                switch(actualStatus)
                {
                    case BoardStatus.New :
                        nextStatus = BoardStatus.WhatWorksOpened;
                        StartBoardTimer();
                        break;
                    case BoardStatus.WhatWorksOpened:
                        if (!isInternalCall)
                            throw new Exception("THis status Changes can not be done by user.");
                        UpdateAllCardsAsVisible(Board.WhatWorks);
                        nextStatus = BoardStatus.WhatWorksClosed;
                        break;
                    case BoardStatus.WhatWorksClosed:
                        nextStatus = BoardStatus.WhatDoesntOpened;
                        StartBoardTimer();
                        break;
                    case BoardStatus.WhatDoesntOpened:
                        if (!isInternalCall)
                            throw new Exception("THis status Changes can not be done by user.");
                        UpdateAllCardsAsVisible(Board.WhatDoesnt);
                        nextStatus = BoardStatus.WhatDoesntClosed;
                        break;
                    case BoardStatus.WhatDoesntClosed:
                        nextStatus = BoardStatus.ActionsOpened;
                        break;
                    case BoardStatus.ActionsOpened:
                        nextStatus = BoardStatus.ActionsClosed;
                        break;
                    case BoardStatus.ActionsClosed:
                        nextStatus = BoardStatus.Closed;
                        break;
                }
                if (actualStatus != nextStatus){
                    Board.Status = nextStatus;

                    using(var context = new LiteDbContext()){
                        context.Boards.Update(Board);                        
                    }
                    if (Board.Status == BoardStatus.Closed){
                        Board = null;
                    }
                    await BroadcastBoardUpdate(true);
                }
            }
            finally
            {
                _boardLock.Release();
            }            
        }        

        internal async Task UpdateBoardConfigAsync(BoardConfig boardConfig)
        {
            await _boardLock.WaitAsync();
            try
            {
                if (Board==null)
                    throw new Exception("Board does not exists.");

                Team.BoardConfiguration = boardConfig;

                await Group.SendAsync("BoardConfigUpdate", boardConfig);
            }
            finally
            {
                _boardLock.Release();
            }            
        }
 
        internal async Task BroadcastBoardUpdate(bool notifyForAll=false, IClientProxy client = null)
        {
            IClientProxy proxy = client??Group;
            await proxy.SendAsync("BoardUpdate", Board);
            if (notifyForAll && Board != null) {
                switch(Board.Status)
                {
                    case BoardStatus.New :
                        break;
                    case BoardStatus.WhatWorksOpened:
                        await proxy.SendAsync("SendMessage", "Time started for \"What Works\", please write your cards.");
                        break;
                    case BoardStatus.WhatWorksClosed:
                        await proxy.SendAsync("SendMessage", "Cards insert disabled.");
                        await proxy.SendAsync("SendMessage", " please do your votes.");
                        await proxy.SendAsync("PublishCards");
                        break;
                    case BoardStatus.WhatDoesntOpened:
                        await proxy.SendAsync("SendMessage", "Time started for \"What Doesn't\", please write your cards.");
                        break;
                    case BoardStatus.WhatDoesntClosed:
                        await proxy.SendAsync("SendMessage", "Cards insert disabled.");
                        await proxy.SendAsync("SendMessage", " please do your votes.");
                        await proxy.SendAsync("PublishCards");
                        break;
                    case BoardStatus.ActionsOpened:
                        break;
                    case BoardStatus.ActionsClosed:
                        break;
                }
            }
        }

        internal async Task UpdateActionAsync(string connectionId, RetroAction action)
        {
            await _boardLock.WaitAsync();
            try
            {
                if (action==null)
                    throw new Exception("Action can not be null.");

                if (action.Card==null)
                    throw new Exception($"Action's linked card can not be null [action : {action.Description??"[empty]"}].");

                using(var context = new LiteDbContext()){
                    RetroAction extAct = null;
                    if (Board!= null)
                        extAct = Board.Actions.Find(act => act.Id == action.Id);
                    else 
                        extAct = context.Actions.FindById(action.Id);

                    if (extAct == null){
                        if (Board==null)
                            throw new Exception("Board does not exists.");
                        context.Actions.Insert(action);
                        Board.Actions.Add(action);
                        context.Boards.Update(Board);
                    }
                    else{
                        extAct.Description = action.Description;
                        extAct.WhoChecks = action.WhoChecks;
                        extAct.InChargeTo = action.InChargeTo;
                        extAct.Status = action.Status;
                        extAct.Card = action.Card;
                        context.Actions.Update(extAct);
                    }
                }
                await BroadcastBoardUpdate();
            }
            finally
            {
                _boardLock.Release();
            }            
        }
    }
}