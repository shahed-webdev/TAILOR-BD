using Microsoft.AspNetCore.Mvc;
using TailorBD.API.Data;
using Dapper;

namespace TailorBD.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class EmployeeController : ControllerBase
    {
        private readonly TailorBdContext _context;
        public EmployeeController(TailorBdContext context) => _context = context;

        // ── Employee list ─────────────────────────────────────────────────────
        [HttpGet("list")]
        public IActionResult GetList(int institutionId)
        {
            try
            {
                using var con = _context.CreateConnection();
                var data = con.Query(@"
                    SELECT EmployeeID, EID, Name, Phone, Designation, Balance,
                           CONVERT(varchar(10), Date, 23) AS JoinDate
                    FROM Employee
                    WHERE InstitutionID=@InstitutionID
                    ORDER BY EID",
                    new { InstitutionID = institutionId });
                return Ok(new { success = true, data });
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }

        // ── Add employee ──────────────────────────────────────────────────────
        [HttpPost("add")]
        public IActionResult Add([FromBody] EmployeeAddModel m)
        {
            try
            {
                using var con = _context.CreateConnection();
                var id = con.ExecuteScalar<int>(@"
                    INSERT INTO Employee (InstitutionID, RegistrationID, EID, Name, Phone, Designation)
                    VALUES (@InstitutionID, @RegistrationID,
                            [dbo].[Employee_EID](@InstitutionID), @Name, @Phone, @Designation);
                    SELECT SCOPE_IDENTITY();",
                    new { m.InstitutionID, m.RegistrationID, m.Name, m.Phone, m.Designation });
                return Ok(new { success = true, employeeId = id });
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }

        // ── Update employee ───────────────────────────────────────────────────
        [HttpPut("update")]
        public IActionResult Update([FromBody] EmployeeUpdateModel m)
        {
            try
            {
                using var con = _context.CreateConnection();
                con.Execute(@"UPDATE Employee SET Name=@Name, Phone=@Phone, Designation=@Designation
                              WHERE EmployeeID=@EmployeeID AND InstitutionID=@InstitutionID",
                    new { m.EmployeeID, m.InstitutionID, m.Name, m.Phone, m.Designation });
                return Ok(new { success = true });
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }

        // ── Delete employee ───────────────────────────────────────────────────
        [HttpDelete("delete")]
        public IActionResult Delete(int employeeId, int institutionId)
        {
            try
            {
                using var con = _context.CreateConnection();
                con.Execute("DELETE FROM Employee WHERE EmployeeID=@EmployeeID AND InstitutionID=@InstitutionID",
                    new { EmployeeID = employeeId, InstitutionID = institutionId });
                return Ok(new { success = true });
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }

        // ── Employee details (single) ─────────────────────────────────────────
        [HttpGet("details")]
        public IActionResult GetDetails(int employeeId, int institutionId)
        {
            try
            {
                using var con = _context.CreateConnection();
                var emp = con.QueryFirstOrDefault(@"
                    SELECT EmployeeID, EID, Name, Phone, Designation, Balance,
                           CONVERT(varchar(10), Date, 23) AS JoinDate
                    FROM Employee
                    WHERE EmployeeID=@EmployeeID AND InstitutionID=@InstitutionID",
                    new { EmployeeID = employeeId, InstitutionID = institutionId });
                if (emp == null) return NotFound(new { success = false, message = "Employee not found" });
                return Ok(new { success = true, data = emp });
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }

        // ── Summary totals ────────────────────────────────────────────────────
        [HttpGet("summary")]
        public IActionResult GetSummary(int employeeId, int institutionId,
            string? dateFrom = null, string? dateTo = null)
        {
            try
            {
                using var con = _context.CreateConnection();
                var p = new
                {
                    EmployeeID = employeeId,
                    InstitutionID = institutionId,
                    DateFrom = string.IsNullOrEmpty(dateFrom) ? (DateTime?)null : DateTime.Parse(dateFrom),
                    DateTo = string.IsNullOrEmpty(dateTo) ? (DateTime?)null : DateTime.Parse(dateTo)
                };
                var data = con.QueryFirstOrDefault(@"
                    SELECT
                        (SELECT ISNULL(SUM(WorkAmount),0) FROM Employee_Work
                         WHERE InstitutionID=@InstitutionID AND EmployeeID=@EmployeeID
                           AND (@DateFrom IS NULL OR WorkDate >= @DateFrom)
                           AND (@DateTo   IS NULL OR WorkDate <= @DateTo))   AS TotalWork,
                        (SELECT ISNULL(SUM(LoanAmount),0) FROM Employee_Loan
                         WHERE InstitutionID=@InstitutionID AND EmployeeID=@EmployeeID
                           AND (@DateFrom IS NULL OR LoanDate >= @DateFrom)
                           AND (@DateTo   IS NULL OR LoanDate <= @DateTo))   AS TotalLoan,
                        (SELECT ISNULL(SUM(ReturnAmount),0) FROM Employee_Return
                         WHERE InstitutionID=@InstitutionID AND EmployeeID=@EmployeeID
                           AND (@DateFrom IS NULL OR ReturnDate >= @DateFrom)
                           AND (@DateTo   IS NULL OR ReturnDate <= @DateTo)) AS TotalReturn", p);
                return Ok(new { success = true, data });
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }

        // ── Work records ──────────────────────────────────────────────────────
        [HttpGet("work")]
        public IActionResult GetWork(int employeeId, int institutionId,
            string? dateFrom = null, string? dateTo = null, int page = 1, int pageSize = 20)
        {
            try
            {
                using var con = _context.CreateConnection();
                var p = new
                {
                    EmployeeID = employeeId,
                    InstitutionID = institutionId,
                    DateFrom = string.IsNullOrEmpty(dateFrom) ? (DateTime?)null : DateTime.Parse(dateFrom),
                    DateTo = string.IsNullOrEmpty(dateTo) ? (DateTime?)null : DateTime.Parse(dateTo),
                    Offset = (page - 1) * pageSize,
                    PageSize = pageSize
                };
                var total = con.ExecuteScalar<int>(@"
                    SELECT COUNT(*) FROM Employee_Work
                    WHERE InstitutionID=@InstitutionID AND EmployeeID=@EmployeeID
                      AND (@DateFrom IS NULL OR WorkDate >= @DateFrom)
                      AND (@DateTo   IS NULL OR WorkDate <= @DateTo)", p);
                var data = con.Query(@"
                    SELECT EmployeeWorkID, WorkFor, WorkAmount,
                           CONVERT(varchar(10), WorkDate, 23) AS WorkDate
                    FROM Employee_Work
                    WHERE InstitutionID=@InstitutionID AND EmployeeID=@EmployeeID
                      AND (@DateFrom IS NULL OR WorkDate >= @DateFrom)
                      AND (@DateTo   IS NULL OR WorkDate <= @DateTo)
                    ORDER BY WorkDate DESC
                    OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY", p);
                return Ok(new
                {
                    success = true,
                    total,
                    page,
                    pageSize,
                    totalPages = (int)Math.Ceiling((double)total / pageSize),
                    data
                });
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }

        [HttpPost("work/add")]
        public IActionResult AddWork([FromBody] EmployeeWorkModel m)
        {
            try
            {
                using var con = _context.CreateConnection();
                con.Execute(@"INSERT INTO Employee_Work(EmployeeID,InstitutionID,RegistrationID,WorkFor,WorkAmount,WorkDate)
                              VALUES(@EmployeeID,@InstitutionID,@RegistrationID,@WorkFor,@WorkAmount,@WorkDate)",
                    new { m.EmployeeID, m.InstitutionID, m.RegistrationID, m.WorkFor, m.WorkAmount, WorkDate = DateTime.Parse(m.WorkDate) });
                RecalcBalance(con, m.EmployeeID, m.InstitutionID);
                return Ok(new { success = true });
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }

        [HttpDelete("work/delete")]
        public IActionResult DeleteWork(int workId, int institutionId)
        {
            try
            {
                using var con = _context.CreateConnection();
                var empId = con.ExecuteScalar<int>("SELECT EmployeeID FROM Employee_Work WHERE EmployeeWorkID=@WorkID", new { WorkID = workId });
                con.Execute("DELETE FROM Employee_Work WHERE EmployeeWorkID=@WorkID AND InstitutionID=@InstitutionID",
                    new { WorkID = workId, InstitutionID = institutionId });
                if (empId > 0) RecalcBalance(con, empId, institutionId);
                return Ok(new { success = true });
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }

        // ── Loan records ──────────────────────────────────────────────────────
        [HttpGet("loan")]
        public IActionResult GetLoan(int employeeId, int institutionId,
            string? dateFrom = null, string? dateTo = null, int page = 1, int pageSize = 20)
        {
            try
            {
                using var con = _context.CreateConnection();
                var p = new
                {
                    EmployeeID = employeeId,
                    InstitutionID = institutionId,
                    DateFrom = string.IsNullOrEmpty(dateFrom) ? (DateTime?)null : DateTime.Parse(dateFrom),
                    DateTo = string.IsNullOrEmpty(dateTo) ? (DateTime?)null : DateTime.Parse(dateTo),
                    Offset = (page - 1) * pageSize,
                    PageSize = pageSize
                };
                var total = con.ExecuteScalar<int>(@"
                    SELECT COUNT(*) FROM Employee_Loan
                    WHERE InstitutionID=@InstitutionID AND EmployeeID=@EmployeeID
                      AND (@DateFrom IS NULL OR LoanDate >= @DateFrom)
                      AND (@DateTo   IS NULL OR LoanDate <= @DateTo)", p);
                var data = con.Query(@"
                    SELECT EmployeeLoanID, LoanFor, LoanAmount,
                           CONVERT(varchar(10), LoanDate, 23) AS LoanDate
                    FROM Employee_Loan
                    WHERE InstitutionID=@InstitutionID AND EmployeeID=@EmployeeID
                      AND (@DateFrom IS NULL OR LoanDate >= @DateFrom)
                      AND (@DateTo   IS NULL OR LoanDate <= @DateTo)
                    ORDER BY LoanDate DESC
                    OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY", p);
                return Ok(new
                {
                    success = true,
                    total,
                    page,
                    pageSize,
                    totalPages = (int)Math.Ceiling((double)total / pageSize),
                    data
                });
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }

        [HttpPost("loan/add")]
        public IActionResult AddLoan([FromBody] EmployeeLoanModel m)
        {
            try
            {
                using var con = _context.CreateConnection();
                con.Execute(@"INSERT INTO Employee_Loan(EmployeeID,InstitutionID,RegistrationID,LoanFor,LoanAmount,LoanDate)
                              VALUES(@EmployeeID,@InstitutionID,@RegistrationID,@LoanFor,@LoanAmount,@LoanDate)",
                    new { m.EmployeeID, m.InstitutionID, m.RegistrationID, m.LoanFor, m.LoanAmount, LoanDate = DateTime.Parse(m.LoanDate) });
                RecalcBalance(con, m.EmployeeID, m.InstitutionID);
                return Ok(new { success = true });
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }

        [HttpDelete("loan/delete")]
        public IActionResult DeleteLoan(int loanId, int institutionId)
        {
            try
            {
                using var con = _context.CreateConnection();
                var empId = con.ExecuteScalar<int>("SELECT EmployeeID FROM Employee_Loan WHERE EmployeeLoanID=@LoanID", new { LoanID = loanId });
                con.Execute("DELETE FROM Employee_Loan WHERE EmployeeLoanID=@LoanID AND InstitutionID=@InstitutionID",
                    new { LoanID = loanId, InstitutionID = institutionId });
                if (empId > 0) RecalcBalance(con, empId, institutionId);
                return Ok(new { success = true });
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }

        // ── Return records ────────────────────────────────────────────────────
        [HttpGet("return")]
        public IActionResult GetReturn(int employeeId, int institutionId,
            string? dateFrom = null, string? dateTo = null, int page = 1, int pageSize = 20)
        {
            try
            {
                using var con = _context.CreateConnection();
                var p = new
                {
                    EmployeeID = employeeId,
                    InstitutionID = institutionId,
                    DateFrom = string.IsNullOrEmpty(dateFrom) ? (DateTime?)null : DateTime.Parse(dateFrom),
                    DateTo = string.IsNullOrEmpty(dateTo) ? (DateTime?)null : DateTime.Parse(dateTo),
                    Offset = (page - 1) * pageSize,
                    PageSize = pageSize
                };
                var total = con.ExecuteScalar<int>(@"
                    SELECT COUNT(*) FROM Employee_Return
                    WHERE InstitutionID=@InstitutionID AND EmployeeID=@EmployeeID
                      AND (@DateFrom IS NULL OR ReturnDate >= @DateFrom)
                      AND (@DateTo   IS NULL OR ReturnDate <= @DateTo)", p);
                var data = con.Query(@"
                    SELECT EmployeeReturnID, ReturnFor, ReturnAmount,
                           CONVERT(varchar(10), ReturnDate, 23) AS ReturnDate
                    FROM Employee_Return
                    WHERE InstitutionID=@InstitutionID AND EmployeeID=@EmployeeID
                      AND (@DateFrom IS NULL OR ReturnDate >= @DateFrom)
                      AND (@DateTo   IS NULL OR ReturnDate <= @DateTo)
                    ORDER BY ReturnDate DESC
                    OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY", p);
                return Ok(new
                {
                    success = true,
                    total,
                    page,
                    pageSize,
                    totalPages = (int)Math.Ceiling((double)total / pageSize),
                    data
                });
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }

        [HttpPost("return/add")]
        public IActionResult AddReturn([FromBody] EmployeeReturnModel m)
        {
            try
            {
                using var con = _context.CreateConnection();
                con.Execute(@"INSERT INTO Employee_Return(EmployeeID,InstitutionID,RegistrationID,ReturnFor,ReturnAmount,ReturnDate)
                              VALUES(@EmployeeID,@InstitutionID,@RegistrationID,@ReturnFor,@ReturnAmount,@ReturnDate)",
                    new { m.EmployeeID, m.InstitutionID, m.RegistrationID, m.ReturnFor, m.ReturnAmount, ReturnDate = DateTime.Parse(m.ReturnDate) });
                RecalcBalance(con, m.EmployeeID, m.InstitutionID);
                return Ok(new { success = true });
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }

        [HttpDelete("return/delete")]
        public IActionResult DeleteReturn(int returnId, int institutionId)
        {
            try
            {
                using var con = _context.CreateConnection();
                var empId = con.ExecuteScalar<int>("SELECT EmployeeID FROM Employee_Return WHERE EmployeeReturnID=@ReturnID", new { ReturnID = returnId });
                con.Execute("DELETE FROM Employee_Return WHERE EmployeeReturnID=@ReturnID AND InstitutionID=@InstitutionID",
                    new { ReturnID = returnId, InstitutionID = institutionId });
                if (empId > 0) RecalcBalance(con, empId, institutionId);
                return Ok(new { success = true });
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }

        // ── Balance recalculate helper ────────────────────────────────────────
        private static void RecalcBalance(System.Data.IDbConnection con, int employeeId, int institutionId)
        {
            con.Execute(@"
                UPDATE Employee SET
                    WorkAmount   = ISNULL((SELECT SUM(WorkAmount)   FROM Employee_Work   WHERE EmployeeID=@EID AND InstitutionID=@IID), 0),
                    LoanAmount   = ISNULL((SELECT SUM(LoanAmount)   FROM Employee_Loan   WHERE EmployeeID=@EID AND InstitutionID=@IID), 0),
                    ReturnAmount = ISNULL((SELECT SUM(ReturnAmount) FROM Employee_Return WHERE EmployeeID=@EID AND InstitutionID=@IID), 0)
                WHERE EmployeeID=@EID AND InstitutionID=@IID",
                new { EID = employeeId, IID = institutionId });
        }
    }

    // ── Models ────────────────────────────────────────────────────────────────
    public class EmployeeAddModel    { public int InstitutionID { get; set; } public int RegistrationID { get; set; } public string Name { get; set; } = ""; public string? Phone { get; set; } public string? Designation { get; set; } }
    public class EmployeeUpdateModel { public int EmployeeID { get; set; } public int InstitutionID { get; set; } public string Name { get; set; } = ""; public string? Phone { get; set; } public string? Designation { get; set; } }
    public class EmployeeWorkModel   { public int EmployeeID { get; set; } public int InstitutionID { get; set; } public int RegistrationID { get; set; } public string WorkFor { get; set; } = ""; public decimal WorkAmount { get; set; } public string WorkDate { get; set; } = ""; }
    public class EmployeeLoanModel   { public int EmployeeID { get; set; } public int InstitutionID { get; set; } public int RegistrationID { get; set; } public string LoanFor { get; set; } = ""; public decimal LoanAmount { get; set; } public string LoanDate { get; set; } = ""; }
    public class EmployeeReturnModel { public int EmployeeID { get; set; } public int InstitutionID { get; set; } public int RegistrationID { get; set; } public string ReturnFor { get; set; } = ""; public decimal ReturnAmount { get; set; } public string ReturnDate { get; set; } = ""; }
}
