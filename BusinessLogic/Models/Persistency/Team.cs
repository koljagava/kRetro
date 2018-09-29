using System.Collections.Generic;

namespace kRetro.BusinessLogic.Models.Persistency
{
    public class Team {
        public int Id {get;set;}
        public string Name {get;set;}
        public BoardConfig BoardConfiguration {get;set;}
        public List<Board> Boards {get;set;}
    }
}