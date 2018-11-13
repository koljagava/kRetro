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
                        await HubContext.Clients.Client(userBoard.ConnectionId).SendAsync("BoardUpdate", board.Board);
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
            await GetBoardManager(connectionId).ChangeBoardStatusAsync(isInternalCall, connectionId);
        }

        internal async Task UpdateCardGoodVoteAsync(string connectionId, int cardId){
            await GetBoardManager(connectionId).UpdateCardGoodVoteAsync(connectionId, cardId);
        }

        internal async Task UpdateCardBadVoteAsync(string connectionId, int cardId, BadVoteType type){
            await GetBoardManager(connectionId).UpdateCardBadVoteAsync(connectionId, cardId, type);
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
            using(var context = new LiteDbContext()){
                Team = context.Teams.Include(t=> t.BoardConfiguration).FindById(teamId); 
            }
            BoardTimer = new System.Timers.Timer(60000);
            BoardTimer.Enabled=false;
            BoardTimer.AutoReset=true;
            BoardTimer.Elapsed += OnOneMinutePassed;
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
            // refresh team for configuration changes
            using(var context = new LiteDbContext()){
                Team = context.Teams.Include(t=> t.BoardConfiguration).FindById(Team.Id);
            }
            switch(Board.Status)
            {
                case BoardStatus.WhatWorksOpened:
                    minutes = Team.BoardConfiguration.WhatWorksMinutes;
                    break;
                case BoardStatus.WhatDoesntOpened:
                    minutes = Team.BoardConfiguration.WhatDoesntMinutes;
                    break;
                default:
                    return;
            }
            if (Math.Round((decimal)((minutes+1) / 2)) == ElapsedMinutes || minutes == ElapsedMinutes){
                if (minutes == ElapsedMinutes){
                    StopBoardTimer();
                    ChangeBoardStatusAsync(true, null).Wait();
                    Group.SendAsync("SendMessage", "Cards insert disabled.");
                    return;
                }
                Group.SendAsync("PublishCards").Wait();
            }
            if ((minutes - ElapsedMinutes)<=1){
                Group.SendAsync("SendMessage", "One minute left.").Wait();
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
                await BroadcastBoardUpdate();
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
                            Visible = true
                        };
                        using(var context = new LiteDbContext()){
                            context.CardsGood.Insert(gCard);
                            Board.WhatWorks.Add(gCard);
                            context.Boards.Update(Board);
                        }
                    break;
                    case BoardStatus.WhatDoesntOpened:
                        var bCard = new CardBad{
                            Message = message,
                            CreationDateTime = DateTime.Now,
                            User = GetConnectedUser(connectionId),
                            Visible = true
                        };
                        using(var context = new LiteDbContext()){
                            context.CardsBad.Insert(bCard);
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
                                context.CardsGood.Delete(c=> c.Id == id);    
                            }else{
                                gCard.Message = message;
                                context.CardsGood.Update(gCard);
                            }
                            context.Boards.Update(Board);
                        }
                    break;
                    case BoardStatus.WhatDoesntOpened:
                        var bCard = Board.WhatDoesnt.Find(c=> c.Id == id);
                        using(var context = new LiteDbContext()){                            
                            if (string.IsNullOrEmpty(message)){
                                Board.WhatDoesnt.Remove(bCard);
                                context.CardsBad.Delete(c=> c.Id == id);    
                            }else{
                                bCard.Message = message;
                                context.CardsBad.Update(bCard);
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

        internal async Task ChangeBoardStatusAsync(bool isInternalCall, string connectionId){
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
                        await Group.SendAsync("SendMessage", "Time started for \"What Works\", please write your cards.");
                        break;
                    case BoardStatus.WhatWorksOpened:
                        if (!isInternalCall)
                            throw new Exception("THis status Changes can not be done by user.");
                        nextStatus = BoardStatus.WhatWorksClosed;
                        await Group.SendAsync("SendMessage", " please do your votes.");
                        break;
                    case BoardStatus.WhatWorksClosed:
                        nextStatus = BoardStatus.WhatDoesntOpened;
                        StartBoardTimer();
                        await Group.SendAsync("SendMessage", "Time started for \"What Doesn't\", please write your cards.");
                        break;
                    case BoardStatus.WhatDoesntOpened:
                        if (!isInternalCall)
                            throw new Exception("THis status Changes can not be done by user.");
                        nextStatus = BoardStatus.WhatDesntClosed;
                        await Group.SendAsync("SendMessage", " please do your votes.");
                        break;
                    case BoardStatus.WhatDesntClosed:
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
                    if (actualStatus == BoardStatus.Closed){
                        Board = null;
                    }
                    await BroadcastBoardUpdate();
                }
            }
            finally
            {
                _boardLock.Release();
            }            
        }        

        private async Task BroadcastBoardUpdate()
        {
            await Group.SendAsync("BoardUpdate", Board);
        }
    }
}