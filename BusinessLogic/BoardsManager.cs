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
        private Dictionary<int, BoardManager> OpenedBoards = new Dictionary<int, BoardManager>();

        public async Task AddUserAsync(UserBoardConnection userBoard)
        {
            await HubContext.Groups.AddAsync(userBoard.ConnectionId, userBoard.TeamId.ToString());
            await _boardsLock.WaitAsync();
            try
            {            
                if (OpenedBoards.ContainsKey(userBoard.TeamId))
                {
                    OpenedBoards[userBoard.TeamId].AddUser(userBoard.ConnectionId, userBoard.UserId);
                }
                else
                {
                    var board = CreateBoard(userBoard, HubContext.Clients.Group(userBoard.TeamId.ToString()));
                    OpenedBoards.Add(userBoard.TeamId, board);
                }
            }
            finally
            {
                _boardsLock.Release();
            }           
        }

        public void RemoveUser(string connectionId)
        {
            foreach (var board in OpenedBoards.Values.Where(ob=> ob.IsConnectionIn(connectionId))){
                board.RemoveUser(connectionId);
            }
        }

        private BoardManager CreateBoard(UserBoardConnection userBoard, IClientProxy group){
            var board = new BoardManager{TeamId = userBoard.TeamId, Group = group};
            board.AddUser(userBoard.ConnectionId, userBoard.UserId);
            return board;
        }
        
        private BoardManager GetBoardManager(string connectionId){
            var bm = OpenedBoards.Values.Where(ob=> ob.IsConnectionIn(connectionId)).ToList();
            if (bm.Count == 1)
                return bm[0];
            throw new Exception($"BoardManager not found for connection Id {connectionId}");
        }

        internal async Task StarNewBoardAsync(string connectionId, string boardName)
        {
            await GetBoardManager(connectionId).StartNewBoardAsync(connectionId, boardName);
        }
    }


    public class BoardManager {
        public Dictionary<User, string> ConnectedUser {get;set;} = new Dictionary<User, string>();
        public int TeamId {get;set;}
        public Board Board {get;set;}
        public Timer BoardTimer {get;set;}
        public IClientProxy Group {get;set;}
        private readonly SemaphoreSlim _boardLock = new SemaphoreSlim(1, 1);

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

        internal void RemoveUser(string connectionId)
        {
            var user = ConnectedUser.Where(cu => cu.Value == connectionId).Select(cu=> cu.Key).FirstOrDefault();
            if (user!=null)
                ConnectedUser.Remove(user);
            //BroadCast Messages for UpdatedConnectedUser
            BroadcastConnectedUsersUpdate().Wait();
        }

        private async Task BroadcastConnectedUsersUpdate()
        {            
            await Group.InvokeAsync("ConnectedUsersUpdate", ConnectedUser.Keys);
        }

        private User GetConnectedUser(string connectionId){
            var user = ConnectedUser.Where(cu => cu.Value == connectionId).ToList();
            if (user.Count == 1)
                return user[0].Key;
            throw new Exception($"ConnectedUser not found for connection Id {connectionId}");
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
                    var team = context.Teams.FindById(TeamId);
                    team.Boards.Add(Board);
                    context.Teams.Update(team);
                }
                await BroadcastOpenedBoardUpdate();
            }
            finally
            {
                _boardLock.Release();
            }            
        }
        private async Task BroadcastOpenedBoardUpdate()
        {
            await Group.InvokeAsync("OpenedBoardUpdate", Board);
        }
    }
}