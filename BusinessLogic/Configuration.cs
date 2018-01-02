using System.IO;
using Microsoft.Extensions.Configuration;
namespace kRetro.BusinessLogic
{
    public static class Configuration
    {
        private static IConfiguration _config;

        private static IConfiguration Config 
        {
            get
            {
                if (_config == null){ 
                    var builder = new ConfigurationBuilder()
                        .SetBasePath(Directory.GetCurrentDirectory())
                        .AddJsonFile("config.NG.json");

                    _config = builder.Build();
                }
                return _config;
            }
        }
        private const string LITEDB_NAME = "LiteDb:Name";

        public static string LightDbName
        {
            get
            {
                return Config[LITEDB_NAME];
            }
        }
    }
}