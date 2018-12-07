using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using kRetro.BusinessLogic.Models.Persistency;
using kRetro.BusinessLogic.Context;
using Microsoft.AspNetCore.Mvc;

namespace kRetro.Controllers
{
    [Route("api/[controller]")]
    public class UserController : Controller
    {
        public class LoginData
        {
            public string Username { get; set; }
            public string Password { get; set; }
        }

        public class UserIdParam
        {
            public int? UserId { get; set; }
        }

        public class TeamIdParam
        {
            public int? TeamId { get; set; }
        }

        [HttpPost("[action]")]
        public JsonResult Authenticate([FromBody] LoginData loginData)
        {
            using (var context = new LiteDbContext())
            {
                var users = context.Users.Find(u => u.Username == loginData.Username && u.Password == loginData.Password).ToList();
                if (users.Count == 0)
                    throw new Exception("wrong username or password");
                if (users.Count != 1)
                    throw new Exception("multiple user found for username");
                return new JsonResult(users[0]);
            }
        }
        
        [HttpPost("[action]")]
        public JsonResult Get([FromBody] UserIdParam param)
        {
            if (!param.UserId.HasValue)
                return new JsonResult (null);

            using (var context = new LiteDbContext())
            {
                //TODO : what about if id is not exists?
                var user = context.Users.FindById(param.UserId);
                return new JsonResult(user);
            }
        }

        [HttpPost("[action]")]
        public JsonResult GetTeams()
        {
            using (var context = new LiteDbContext())
            {
                return new JsonResult(context.Teams.Include(t=> t.BoardConfiguration).FindAll().ToList());
            }
        }

        [HttpPost("[action]")]
        public JsonResult GetTeamUsers([FromBody] TeamIdParam param)
        {
            using (var context = new LiteDbContext())
            {
                if (param== null || !param.TeamId.HasValue)
                {
                    throw new Exception("UserId must not null");
                }
                return new JsonResult(context.Users.Find(u=> u.Team.Id == param.TeamId).ToList());
            }
        }

        [HttpPost("[action]")]
        public JsonResult GetBoardsHistory([FromBody] TeamIdParam param)
        {
            // TODO : "using" statement generate an HTTP error 
            // provare a fare un ciclo della lista prima di darla al result

            var context = new LiteDbContext();
                var boards = context.Boards
                                .Include(b=> b.Actions)
                                .Include(b=> b.WhatWorks)
                                .Include(b=> b.WhatDoesnt)
                                .Include(b=> b.Manager)
                                .Find(b => b.Status == BoardStatus.Closed).OrderByDescending(b=> b.Date).ToList();

                return new JsonResult(boards);
        }

        [HttpPost("[action]")]
        public JsonResult Update([FromBody] User user)
        {
            using (var context = new LiteDbContext())
            {
                if (!context.Users.Update(user))
                    throw new Exception("Error updating User");
                return new JsonResult(user);
            }
        }
        
        [HttpPost("[action]")]
        public JsonResult Create([FromBody] User user)
        {
            using (var context = new LiteDbContext())
            {
                var users = context.Users.Find(u => u.Username == user.Username).ToList();
                if (users.Count != 0)
                    throw new Exception("Error User with the same Username already exists");

                context.Users.Insert(user);

                if (user == null)
                    throw new Exception("Error creating User");
                return new JsonResult(user);
            }
        }
    }
}
