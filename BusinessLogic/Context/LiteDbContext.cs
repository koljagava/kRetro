using System;
using System.Collections.Generic;
using kRetro.BusinessLogic.Models.Persistency;
using LiteDB;

namespace kRetro.BusinessLogic.Context
{
    public class LiteDbContext : IDisposable
    {
        private string user_collection_name = "Users";
        private string team_collection_name = "Teams";
        private string boardconfig_collection_name = "BoardConfigs";
        private string cardgood_collection_name = "CardsGood";
        private string cardbad_collection_name = "CardsBad";
        private string action_collection_name = "Actions";
        private string board_collection_name = "Boards";
        
        
        public readonly LiteDatabase Db;        
        public LiteDbContext()
        {

            Db = new LiteDatabase(Configuration.LightDbName);
            var boardConfig = new BoardConfig{
                WhatWorksMinutes = 3,
                WhatWorksVotesPerUser = 3,
                WhatDontMinutes = 3,
                WhatDontVotesPerUser = 3,
                ShowCardUser = false
            };

            var boardConfigs = new List<BoardConfig>{
                boardConfig,
                boardConfig.Clone(),
                boardConfig.Clone()
            };
            if (BoardConfigs.Count()==0)
            {
                BoardConfigs.InsertBulk(boardConfigs);
            }

            var teams = new List<Team>
            {
                new Team{ Name="TaxE", BoardConfiguration = boardConfigs[0]},     
                new Team{ Name="Corporate", BoardConfiguration = boardConfigs[1]},
                new Team{ Name="Fiscality", BoardConfiguration = boardConfigs[2]}
            };

            if (Teams.Count()==0)
            {
                Teams.InsertBulk(teams);
            }
            if (Users.Count() == 0)
            {
                Users.Insert(new User
                {
                    Username = "kolja",
                    Password = "kolja",
                    Teams = teams
                });
                Users.Insert(new User
                {
                    Username = "kota",
                    Password = "kota",
                    Teams = teams
                });
            }
            SetUpDbStructure();
        }

        private void SetUpDbStructure()
        {
            //**Indexes**
            Teams.EnsureIndex(t=> t.Name);
            Users.EnsureIndex(u=> u.Username);
            Users.EnsureIndex(u=> u.Username);
            Users.EnsureIndex(u=> u.Username);
            Boards.EnsureIndex(b=> b.Date);

            //**Relations**
            //Users
            BsonMapper.Global.Entity<User>()
            .DbRef(u => u.Teams, team_collection_name);

            //Teams
            BsonMapper.Global.Entity<Team>()
            .DbRef(t => t.Boards, board_collection_name);
            BsonMapper.Global.Entity<Team>()
            .DbRef(t => t.BoardConfiguration, boardconfig_collection_name);
            
            //Boards
            BsonMapper.Global.Entity<Board>()
            .DbRef(b => b.WhatWorks, cardgood_collection_name);
            BsonMapper.Global.Entity<Board>()
            .DbRef(b => b.WhatDont, cardbad_collection_name);
            BsonMapper.Global.Entity<Board>()
            .DbRef(b => b.Actions, action_collection_name);
            BsonMapper.Global.Entity<Board>()
            .DbRef(b => b.Manager, user_collection_name);

            //CardsBad
            BsonMapper.Global.Entity<CardBad>()
            .DbRef(cb => cb.User, user_collection_name);
            BsonMapper.Global.Entity<BadVote>()
            .DbRef(bv => bv.User, user_collection_name);

            //CardsGood
            BsonMapper.Global.Entity<CardGood>()
            .DbRef(cg => cg.User, user_collection_name);
            BsonMapper.Global.Entity<CardGood>()
            .DbRef(cg => cg.Votes, user_collection_name);
        }

        #region Collections
        private LiteCollection<User> _users;
        public LiteCollection<User> Users
        {
            get
            {
                if (_users != null){
                    return _users;                    
                }
                _users = Db.GetCollection<User>(user_collection_name);
                return _users;
            }
        }
        private LiteCollection<BoardConfig> _boardConfigs;
        public LiteCollection<BoardConfig> BoardConfigs
        {
            get
            {
                if (_boardConfigs != null){
                    return _boardConfigs;                    
                }
                _boardConfigs = Db.GetCollection<BoardConfig>(boardconfig_collection_name);
                return _boardConfigs;
            }
        }
        private LiteCollection<Team> _teams;
        public LiteCollection<Team> Teams
        {
            get
            {
                if (_teams != null){
                    return _teams;                    
                }
                _teams = Db.GetCollection<Team>(team_collection_name);
                return _teams;
            }
        }
        private LiteCollection<CardGood> _cardsGood;
        public LiteCollection<CardGood> CardsGood
        {
            get
            {
                if (_cardsGood != null){
                    return _cardsGood;                    
                }
                _cardsGood = Db.GetCollection<CardGood>(cardgood_collection_name);
                return _cardsGood;
            }
        }
        private LiteCollection<CardBad> _cardsBad;
        public LiteCollection<CardBad> CardsBad
        {
            get
            {
                if (_cardsBad != null){
                    return _cardsBad;
                }
                _cardsBad = Db.GetCollection<CardBad>(cardbad_collection_name);
                return _cardsBad;
            }
        }
        private LiteCollection<Models.Persistency.Action> _actions;
        public LiteCollection<Models.Persistency.Action> Actions
        {
            get
            {
                if (_actions != null){
                    return _actions;
                }
                _actions = Db.GetCollection<Models.Persistency.Action>(action_collection_name);
                return _actions;
            }
        }
        private LiteCollection<Board> _boards;
        public LiteCollection<Board> Boards
        {
            get
            {
                if (_boards != null){
                    return _boards;
                }
                _boards = Db.GetCollection<Board>(board_collection_name);
                return _boards;
            }
        }
        #endregion

        #region IDisposable Support
        private bool disposedValue = false; // To detect redundant calls

        protected virtual void Dispose(bool disposing)
        {
            if (!disposedValue)
            {
                if (disposing)
                {
                    Db.Dispose();
                    // TODO: dispose managed state (managed objects).
                }

                // TODO: free unmanaged resources (unmanaged objects) and override a finalizer below.
                // TODO: set large fields to null.

                disposedValue = true;
            }
        }

        // TODO: override a finalizer only if Dispose(bool disposing) above has code to free unmanaged resources.
        // ~LiteDbContext() {
        //   // Do not change this code. Put cleanup code in Dispose(bool disposing) above.
        //   Dispose(false);
        // }

        // This code added to correctly implement the disposable pattern.
        void IDisposable.Dispose()
        {
            // Do not change this code. Put cleanup code in Dispose(bool disposing) above.
            Dispose(true);
            // TODO: uncomment the following line if the finalizer is overridden above.
            // GC.SuppressFinalize(this);
        }
        #endregion

    }
}