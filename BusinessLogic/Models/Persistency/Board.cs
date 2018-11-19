using System;
using System.Collections.Generic;
using System.Linq;
using LiteDB;

namespace kRetro.BusinessLogic.Models.Persistency
{
    public enum BoardStatus{
        New = 0,
        WhatWorksOpened = 1,
        WhatWorksClosed = 2,
        WhatDoesntOpened = 3,
        WhatDesntClosed = 4,
        ActionsOpened = 5,
        ActionsClosed = 6,
        Closed = 7
    }

    public class WhatWorksUserVoteStatus{
        public int Id {get;set;}
        public int Count {get;set;} = 0;
    }

    public class WhatDoesntUserVoteStatus{
        public int Id {get;set;}
        public int Count {get;set;} = 0;
        public Dictionary<int, int> VoteTypeCount {get;set;} = new Dictionary<int, int>();

        public WhatDoesntUserVoteStatus(){
            foreach(var badVoteType in Enum.GetValues(typeof(BadVoteType)).Cast<BadVoteType>()){
                VoteTypeCount.Add((int)badVoteType, 0);
            }
        }

    }

    public class Board
    {
        public int Id {get;set;}
        public string Name {get;set;}
        public DateTime Date {get;set;}
        public BoardStatus Status {get;set;} = BoardStatus.New;
        public List<CardGood> WhatWorks {get;set;} = new List<CardGood>();
        public List<CardBad> WhatDoesnt {get;set;} = new List<CardBad>();
        public List<Action> Actions {get;set;} = new List<Action>();
        public User Manager {get;set;}

        [BsonIgnore]
        public List<WhatWorksUserVoteStatus> WhatWorksUserVoteStatues {
            get
            {
                var result = new List<WhatWorksUserVoteStatus>();
                foreach (var vote in WhatWorks.SelectMany(card=> card.Votes))
                {
                    var wwuvs = result.Find(ele=> ele.Id == vote.Id);
                    if (wwuvs==null) {
                        wwuvs = new WhatWorksUserVoteStatus{Id = vote.Id, Count = 0};
                        result.Add(wwuvs);
                    }
                    wwuvs.Count++;
                }
                return result;
            }
        }
        [BsonIgnore]
        public List<WhatDoesntUserVoteStatus> WhatDoesntUserVoteStatues {
            get
            {
                var result = new List<WhatDoesntUserVoteStatus>();
                foreach (var vote in WhatDoesnt.SelectMany(card=> card.Votes))
                {
                    var wduvs = result.Find(ele=> ele.Id == vote.User.Id);
                    if (wduvs==null){
                        wduvs = new WhatDoesntUserVoteStatus{Id = vote.User.Id};
                        result.Add(wduvs);
                    }
                    wduvs.Count++;
                    wduvs.VoteTypeCount[(int)vote.Type]++;
                }
                return result;
            }
        }

        [BsonIgnore]
        public List<User> PartecipatingUsers {
            get {
                return WhatWorks.Select(c=> c.User).Union(WhatDoesnt.Select(c=> c.User)).Distinct().ToList();
            }
        }

    }
}