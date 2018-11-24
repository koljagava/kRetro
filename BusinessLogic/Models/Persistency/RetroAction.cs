namespace kRetro.BusinessLogic.Models.Persistency
{
    public enum RetroActionStatus{
        New=0,
        Open=1,
        Done=3
    }
    public class RetroAction
    {
        public int Id {get;set;}
        public string Description {get;set;}
        public string InChargeTo {get;set;}
        public string WhoChecks {get;set;}
        public CardBase Card {get;set;}
        public RetroActionStatus Status {get;set;}
    }
}