using System;

namespace kRetro.BusinessLogic.Models.Persistency
{
    public class CardBase
    {
        public int Id {get;set;}
        public string Message {get;set;}
        public User User {get;set;}
        public DateTime CreationDateTime {get;set;}
        public bool Visible {get;set;}       
    }
}