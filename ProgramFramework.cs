using Microsoft.AspNetCore;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;

namespace kRetro.Framework
{
    public class ProgramFramework
    {
        public static void Main(string[] args)
        {
            BuildWebHost(args).Run();
        }

        public static IWebHost BuildWebHost(string[] args) =>
            WebHost.CreateDefaultBuilder(args)
                .ConfigureAppConfiguration(
                    (WebHostBuilderContext context, IConfigurationBuilder builder) =>
                    {
                        //builder.Sources.Clear();
                        builder
                            .AddJsonFile($"appsettings.NG.json", optional: true, reloadOnChange: true);
                    })
                .UseStartup<StartupFramework>()
                .Build();
    }
}