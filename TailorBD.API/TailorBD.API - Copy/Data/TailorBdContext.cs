using System.Data;
using System.Data.SqlClient;

namespace TailorBD.API.Data
{
    public class TailorBdContext
    {
        private readonly IConfiguration _configuration;
        private readonly string _connectionString;

        public TailorBdContext(IConfiguration configuration)
        {
            _configuration = configuration;
            _connectionString = _configuration.GetConnectionString("TailorBDConnectionString")
                ?? throw new InvalidOperationException("Connection string 'TailorBDConnectionString' not found.");
        }

        public IDbConnection CreateConnection()
            => new SqlConnection(_connectionString);

        public string ConnectionString => _connectionString;
    }
}
