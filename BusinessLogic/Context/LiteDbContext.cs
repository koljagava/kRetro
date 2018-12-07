using System;
using System.Collections.Generic;
using System.IO;
using kRetro.BusinessLogic.Models.Persistency;
using LiteDB;

namespace kRetro.BusinessLogic.Context
{
    public class LiteDbContext : IDisposable
    {
        private string user_collection_name = "Users";
        private string team_collection_name = "Teams";
        private string boardconfig_collection_name = "BoardConfigs";
        private string card_collection_name = "Cards";
        private string action_collection_name = "Actions";
        private string board_collection_name = "Boards";
        
        
        private static LiteDatabase dbInstance = null;
        public LiteDatabase Db {
            get {
                if (dbInstance != null)
                    return dbInstance;
                dbInstance = new LiteDatabase(Configuration.LightDbName);
                return dbInstance;
            }
        }
        public LiteDbContext()
        {
            var dbIsNew = !File.Exists(Configuration.LightDbName);
            SetUpDbStructure();
            if (dbIsNew){
                SetUpNewDb();
            }
        }

        private void SetUpNewDb(){

            var boardConfig = new BoardConfig{
                WhatWorksMinutes = 3,
                WhatWorksVotesPerUser = 3,
                WhatDoesntMinutes = 3,
                WhatDoesntVotesPerUser = 3,
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
                new Team{ Name="Tax & Transversal", BoardConfiguration = boardConfigs[2]}
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
                    FirstName = "Nicola",
                    LastName = "Gavazzeni",
                    Team = teams[2]
                });
                Users.Insert(new User
                {
                    Username = "kota",
                    Password = "kota",
                    Team = teams[2]
                });
            }
        }

        private void SetUpDbStructure()
        {
            //** Primary Key **/
            // da capire

            //**Indexes**
            Teams.EnsureIndex(t=> t.Name);            
            Users.EnsureIndex(u=> u.Username);
            Boards.EnsureIndex(b=> b.Date);
            Actions.EnsureIndex(a=> a.Card, false);
            Actions.EnsureIndex(a=> a.InChargeTo, false);
            Actions.EnsureIndex(a=> a.WhoChecks, false);
            BoardConfigs.EnsureIndex(bc=> bc.Id);
            Cards.EnsureIndex(c=> c.Id);

            //**Relations**
            //Users
            BsonMapper.Global.Entity<User>()
            .DbRef(u => u.Team, team_collection_name);

            //Teams
            BsonMapper.Global.Entity<Team>()
            .DbRef(t => t.Boards, board_collection_name);
            BsonMapper.Global.Entity<Team>()
            .DbRef(t => t.BoardConfiguration, boardconfig_collection_name);
            
            //Boards
            BsonMapper.Global.Entity<Board>()
            .DbRef(b => b.WhatWorks, card_collection_name);
            BsonMapper.Global.Entity<Board>()
            .DbRef(b => b.WhatDoesnt, card_collection_name);
            BsonMapper.Global.Entity<Board>()
            .DbRef(b => b.Actions, action_collection_name);
            BsonMapper.Global.Entity<Board>()
            .DbRef(b => b.Manager, user_collection_name);

            //CardsBase
            BsonMapper.Global.Entity<CardBase>()
            .DbRef(cb => cb.User, user_collection_name);
            
            BsonMapper.Global.Entity<BadVote>()
            .DbRef(bv => bv.User, user_collection_name);

            //CardsGood
            BsonMapper.Global.Entity<CardGood>()
            .DbRef(cg => cg.Votes, user_collection_name);

            //Actions
            BsonMapper.Global.Entity<RetroAction>()
            .DbRef(a => a.Card, card_collection_name);
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
        private LiteCollection<CardBase> _cards;
        public LiteCollection<CardBase> Cards
        {
            get
            {
                if (_cards != null){
                    return _cards;                    
                }
                _cards = Db.GetCollection<CardBase>(card_collection_name);
                return _cards;
            }
        }
        private LiteCollection<RetroAction> _actions;
        public LiteCollection<RetroAction> Actions
        {
            get
            {
                if (_actions != null){
                    return _actions;
                }
                _actions = Db.GetCollection<RetroAction>(action_collection_name);
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
                    //Db.Dispose();
                }
                disposedValue = true;
            }
        }

        void IDisposable.Dispose()
        {
            Dispose(true);
        }
        #endregion

    }
}