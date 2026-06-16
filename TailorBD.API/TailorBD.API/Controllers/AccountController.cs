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
                if (model == null || model.AccountID <= 0 || model.InstitutionID <= 0 || model.RegistrationID <= 0)
                    return BadRequest(new { success = false, message = "Invalid transaction data" });

                if (model.Amount <= 0)
                    return BadRequest(new { success = false, message = "Amount must be greater than zero" });

                var isDeposit = string.Equals(model.Type, "deposit", StringComparison.OrdinalIgnoreCase);
                var isWithdraw = string.Equals(model.Type, "withdraw", StringComparison.OrdinalIgnoreCase);

                if (!isDeposit && !isWithdraw)
                    return BadRequest(new { success = false, message = "Invalid transaction type" });

                using var connection = _context.CreateConnection();
                connection.Open();

                if (isWithdraw)
                {
                    var balance = connection.ExecuteScalar<decimal?>(
                        "SELECT AccountBalance FROM Account WHERE InstitutionID = @InstitutionID AND AccountID = @AccountID",
                        new { model.InstitutionID, model.AccountID });

                    if (balance == null)
                        return BadRequest(new { success = false, message = "Account not found" });

                    if (model.Amount > balance.Value)
                    {
                        return Ok(new
                        {
                            success = false,
                            message = "উত্তোলনের পরিমাণ বর্তমান ব্যালেন্সের বেশি"
                        });
                    }
                }

                var txDate = model.Date == default ? DateTime.Today : model.Date.Date;
                var details = model.Note ?? string.Empty;

                if (isDeposit)
                {
                    connection.Execute(@"
                        INSERT INTO AccountIN_Record (
                            AccountID, InstitutionID, RegistrationID,
                            AccountIN_Amount, IN_Details, AccountIN_Date
                        ) VALUES (
                            @AccountID, @InstitutionID, @RegistrationID,
                            @Amount, @Details, @TxDate
                        )",
                        new
                        {
                            model.AccountID,
                            model.InstitutionID,
                            model.RegistrationID,
                            Amount = (double)model.Amount,
                            Details = details,
                            TxDate = txDate
                        });
                }
                else
                {
                    connection.Execute(@"
                        INSERT INTO AccountOUT_Record (
                            AccountID, InstitutionID, RegistrationID,
                            AccountOUT_Amount, Out_Details, AccountOUT_Date
                        ) VALUES (
                            @AccountID, @InstitutionID, @RegistrationID,
                            @Amount, @Details, @TxDate
                        )",
                        new
                        {
                            model.AccountID,
                            model.InstitutionID,
                            model.RegistrationID,
                            Amount = (double)model.Amount,
                            Details = details,
                            TxDate = txDate
                        });
                }

                return Ok(new
                {
                    success = true,
                    message = isDeposit ? "জমা সফল হয়েছে" : "উত্তোলন সফল হয়েছে"
                });
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
                    SELECT Log_SN, AccountID, Amount, Add_Subtraction, Category, Situation,
                           Details, Insert_Date, Activity_Date, Balance_Before, Balance_After
                    FROM Account_Log 
                    WHERE AccountID = @AccountID 
                      AND Category IN ('Deposit', 'Withdraw')
                    ORDER BY Insert_Date DESC, Insert_Time DESC";

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
