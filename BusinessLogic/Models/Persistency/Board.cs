using System;
using System.Collections.Generic;

namespace kRetro.BusinessLogic.Models.Persistency
{
    public enum BoardStatus{
        New = 0,
        WhatWorksOpened = 1,
        WhatWorksClosed = 2,
        WhatDesntOpened = 3,
        WhatDesntClosed = 4,
        ActionsOpened = 5,
        ActionsClosed = 6,
        Closed = 7
    }
    public class Board
    {
        public int Id {get;set;}
        public string Name {get;set;}
        public DateTime Date {get;set;}
        public BoardStatus Status {get;set;} = BoardStatus.New;
        public List<CardGood> WhatWorks {get;set;} = new List<CardGood>();
        public List<CardBad> WhatDont {get;set;} = new List<CardBad>();
        public List<Action> Actions {get;set;} = new List<Action>();
        public User Manager {get;set;}
    }
}