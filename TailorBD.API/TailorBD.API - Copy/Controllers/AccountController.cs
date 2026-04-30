using Microsoft.AspNetCore.Mvc;
using TailorBD.API.Data;
using Dapper;

namespace TailorBD.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AccountController : ControllerBase
    {
        private readonly TailorBdContext _context;

        public AccountController(TailorBdContext context)
        {
            _context = context;
        }

        // GET: api/Account/{institutionId}
        [HttpGet("{institutionId}")]
        public IActionResult GetAccounts(int institutionId)
        {
            try
            {
                using var connection = _context.CreateConnection();
                
                var query = "SELECT * FROM Account WHERE InstitutionID = @InstitutionID ORDER BY Default_Status DESC, AccountName";
                var accounts = connection.Query(query, new { InstitutionID = institutionId });

                return Ok(new { success = true, data = accounts });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        // POST: api/Account
        [HttpPost]
        public IActionResult CreateAccount([FromBody] AccountCreateModel model)
        {
            try
            {
                using var connection = _context.CreateConnection();
                
                // Check if account already exists
                var checkQuery = "SELECT COUNT(*) FROM Account WHERE InstitutionID = @InstitutionID AND AccountName = @AccountName";
                var exists = connection.ExecuteScalar<int>(checkQuery, new {
                    InstitutionID = model.InstitutionID,
                    AccountName = model.AccountName
                });

                if (exists > 0)
                {
                    return Ok(new { 
                        success = false, 
                        message = $"{model.AccountName} already exists" 
                    });
                }

                // Insert new account
                var insertQuery = @"
                    INSERT INTO Account (AccountName, RegistrationID, InstitutionID, Default_Status)
                    VALUES (@AccountName, @RegistrationID, @InstitutionID, 0)";

                connection.Execute(insertQuery, new {
                    AccountName = model.AccountName,
                    RegistrationID = model.RegistrationID,
                    InstitutionID = model.InstitutionID
                });

                return Ok(new { 
                    success = true, 
                    message = "Account created successfully" 
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        // PUT: api/Account
        [HttpPut]
        public IActionResult UpdateAccount([FromBody] AccountUpdateModel model)
        {
            try
            {
                using var connection = _context.CreateConnection();
                connection.Open();
                using var transaction = connection.BeginTransaction();

                try
                {
                    // Update account name
                    var updateQuery = "UPDATE Account SET AccountName = @AccountName WHERE AccountID = @AccountID";
                    connection.Execute(updateQuery, new {
                        AccountName = model.AccountName,
                        AccountID = model.AccountID
                    }, transaction);

                    // Update default status
                    if (model.DefaultStatus)
                    {
                        // Get institution ID
                        var instQuery = "SELECT InstitutionID FROM Account WHERE AccountID = @AccountID";
                        var institutionId = connection.ExecuteScalar<int>(instQuery, 
                            new { AccountID = model.AccountID }, transaction);

                        // Set this as default, unset others
                        var defaultQuery = @"
                            UPDATE Account SET Default_Status = 0 WHERE InstitutionID = @InstitutionID;
                            UPDATE Account SET Default_Status = 1 WHERE AccountID = @AccountID";
                        
                        connection.Execute(defaultQuery, new {
                            InstitutionID = institutionId,
                            AccountID = model.AccountID
                        }, transaction);
                    }

                    transaction.Commit();

                    return Ok(new { 
                        success = true, 
                        message = "Account updated successfully" 
                    });
                }
                catch (Exception)
                {
                    transaction.Rollback();
                    throw;
                }
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        // DELETE: api/Account/{accountId}
        [HttpDelete("{accountId}")]
        public IActionResult DeleteAccount(int accountId)
        {
            try
            {
                using var connection = _context.CreateConnection();
                
                // Check if account has transactions
                var checkQuery = "SELECT COUNT(*) FROM Account_Log WHERE AccountID = @AccountID";
                var hasTransactions = connection.ExecuteScalar<int>(checkQuery, new { AccountID = accountId });

                if (hasTransactions > 0)
                {
                    return Ok(new { 
                        success = false, 
                        message = "Cannot delete account with transactions" 
                    });
                }

                // Delete account
                var deleteQuery = "DELETE FROM Account WHERE AccountID = @AccountID";
                connection.Execute(deleteQuery, new { AccountID = accountId });

                return Ok(new { 
                    success = true, 
                    message = "Account deleted successfully" 
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        // POST: api/Account/transaction
        [HttpPost("transaction")]
        public IActionResult CreateTransaction([FromBody] TransactionModel model)
        {
            try
            {
                using var connection = _context.CreateConnection();
                connection.Open();
                using var transaction = connection.BeginTransaction();

                try
                {
                    // Insert transaction log
                    var insertQuery = @"
                        INSERT INTO Account_Log (
                            AccountID, 
                            InstitutionID, 
                            RegistrationID, 
                            Amount, 
                            Type, 
                            Note, 
                            Date,
                            EntryDate
                        ) VALUES (
                            @AccountID, 
                            @InstitutionID, 
                            @RegistrationID, 
                            @Amount, 
                            @Type, 
                            @Note, 
                            @Date,
                            GETDATE()
                        )";

                    connection.Execute(insertQuery, new {
                        AccountID = model.AccountID,
                        InstitutionID = model.InstitutionID,
                        RegistrationID = model.RegistrationID,
                        Amount = model.Amount,
                        Type = model.Type, // 'IN' for deposit, 'OUT' for withdraw
                        Note = model.Note,
                        Date = model.Date
                    }, transaction);

                    // Update account balance
                    var balanceQuery = model.Type == "deposit" ? 
                        "UPDATE Account SET AccountBalance = AccountBalance + @Amount, Total_IN = Total_IN + @Amount WHERE AccountID = @AccountID" :
                        "UPDATE Account SET AccountBalance = AccountBalance - @Amount, Total_OUT = Total_OUT + @Amount WHERE AccountID = @AccountID";

                    connection.Execute(balanceQuery, new {
                        Amount = model.Amount,
                        AccountID = model.AccountID
                    }, transaction);

                    transaction.Commit();

                    return Ok(new { 
                        success = true, 
                        message = "Transaction completed successfully" 
                    });
                }
                catch (Exception)
                {
                    transaction.Rollback();
                    throw;
                }
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        // GET: api/Account/{accountId}/transactions
        [HttpGet("{accountId}/transactions")]
        public IActionResult GetAccountTransactions(int accountId)
        {
            try
            {
                using var connection = _context.CreateConnection();
                
                var query = @"
                    SELECT * FROM Account_Log 
                    WHERE AccountID = @AccountID 
                    ORDER BY Date DESC, EntryDate DESC";

                var transactions = connection.Query(query, new { AccountID = accountId });

                return Ok(new { success = true, data = transactions });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }
    }

    // Models
    public class AccountCreateModel
    {
        public string AccountName { get; set; }
        public int InstitutionID { get; set; }
        public int RegistrationID { get; set; }
    }

    public class AccountUpdateModel
    {
        public int AccountID { get; set; }
        public string AccountName { get; set; }
        public bool DefaultStatus { get; set; }
    }

    public class TransactionModel
    {
        public int AccountID { get; set; }
        public int InstitutionID { get; set; }
        public int RegistrationID { get; set; }
        public decimal Amount { get; set; }
        public string Type { get; set; } // 'deposit' or 'withdraw'
        public string Note { get; set; }
        public DateTime Date { get; set; }
    }
}
