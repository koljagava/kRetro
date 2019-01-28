using System;

namespace kRetro.BusinessLogic.Models.Persistency
{
    public enum CardType{
        Good,
        Bad,
        Unknown
    }
    public class CardBase
    {
        public CardType Type {get; private set;}

        public CardBase(){
            Type = CardType.Unknown;
        }        
        public CardBase(CardType type){
            Type = type;
        }
        public int Id {get;set;}
        public string Message {get;set;}
        public User User {get;set;}
        public DateTime CreationDateTime {get;set;}
        public bool Visible {get;set;}   
        public int? ClusterId {get;set;}            
    }
}