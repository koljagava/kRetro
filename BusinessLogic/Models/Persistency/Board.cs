using System;
using System.Collections.Generic;

namespace kRetro.BusinessLogic.Models.Persistency
{
    public enum BoardStatus{
        New = 0,
        OpenWhatWorks = 1,
        CloseWhatWorks = 2,
        OpenWhatDont = 3,
        CloseWhatDont = 4,
        OpenActions = 5,
        CloseActions = 6,
        Close = 7
    }
    public class Board
    {
        public int Id {get;set;}
        public string Name {get;set;}
        public DateTime Date {get;set;}
        public BoardStatus Status {get;set;}
        public List<CardGood> WhatWorks {get;set;} = new List<CardGood>();
        public List<CardBad> WhatDont {get;set;} = new List<CardBad>();
        public List<Action> Actions {get;set;} = new List<Action>();
        public User Manager {get;set;}
    }
}