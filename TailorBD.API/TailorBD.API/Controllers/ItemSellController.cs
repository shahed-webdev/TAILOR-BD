using Microsoft.AspNetCore.Mvc;
using Dapper;
using TailorBD.API.Data;
using System.Data;
using System.Linq;

namespace TailorBD.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ItemSellController : ControllerBase
    {
        private readonly TailorBdContext _context;
        public ItemSellController(TailorBdContext context) => _context = context;

        // GET: api/ItemSell/search?institutionId=&prefix=
        [HttpGet("search")]
        public IActionResult SearchItem([FromQuery] int institutionId, [FromQuery] string prefix = "")
        {
            try
            {
                using var con = _context.CreateConnection();
                var rows = con.Query<dynamic>(@"
                    SELECT TOP 8
                        f.FabricID   AS FabricId,
                        f.FabricCode,
                        f.FabricsName,
                        f.SellingUnitPrice,
                        f.CurrentBuyingUnitPrice,
                        ISNULL(f.StockFabricQuantity,0) AS StockFabricQuantity,
                        ISNULL(u.UnitName,'')           AS UnitName,
                        ISNULL(b.FabricsBrandName,'')   AS BrandName,
                        ISNULL(c.FabricsCategoryName,'') AS CategoryName
                    FROM Fabrics f
                    LEFT JOIN Fabrics_Mesurement_Unit u ON f.FabricMesurementUnitID = u.FabricMesurementUnitID
                    LEFT JOIN Fabrics_Brand           b ON f.FabricsBrandID         = b.FabricsBrandID
                    LEFT JOIN Fabrics_Category        c ON f.FabricsCategoryID      = c.FabricsCategoryID
                    WHERE f.InstitutionID = @InstitutionID
                      AND f.StockFabricQuantity > 0
                      AND (f.FabricCode LIKE @Prefix + '%' OR f.FabricsName LIKE '%' + @Prefix + '%')
                    ORDER BY f.FabricCode",
                    new { InstitutionID = institutionId, Prefix = prefix });

                return Ok(new { success = true, data = rows });
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }

        // GET: api/ItemSell/by-code?institutionId=&code=
        [HttpGet("by-code")]
        public IActionResult GetByCode([FromQuery] int institutionId, [FromQuery] string code = "")
        {
            try
            {
                using var con = _context.CreateConnection();
                var row = con.QueryFirstOrDefault<dynamic>(@"
                    SELECT
                        f.FabricID   AS FabricId,
                        f.FabricCode,
                        f.FabricsName,
                        f.SellingUnitPrice,
                        f.CurrentBuyingUnitPrice,
                        ISNULL(f.StockFabricQuantity,0) AS StockFabricQuantity,
                        ISNULL(u.UnitName,'')           AS UnitName,
                        ISNULL(b.FabricsBrandName,'')   AS BrandName,
                        ISNULL(c.FabricsCategoryName,'') AS CategoryName
                    FROM Fabrics f
                    LEFT JOIN Fabrics_Mesurement_Unit u ON f.FabricMesurementUnitID = u.FabricMesurementUnitID
                    LEFT JOIN Fabrics_Brand           b ON f.FabricsBrandID         = b.FabricsBrandID
                    LEFT JOIN Fabrics_Category        c ON f.FabricsCategoryID      = c.FabricsCategoryID
                    WHERE f.InstitutionID = @InstitutionID AND f.FabricCode = @Code",
                    new { InstitutionID = institutionId, Code = code });

                if (row == null) return Ok(new { success = false, message = "Item not found" });
                return Ok(new { success = true, data = row });
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }

        // GET: api/ItemSell/accounts?institutionId=
        [HttpGet("accounts")]
        public IActionResult GetAccounts([FromQuery] int institutionId)
        {
            try
            {
                using var con = _context.CreateConnection();
                var rows = con.Query<dynamic>(@"
                    SELECT AccountID AS AccountId, AccountName,
                           CAST(Default_Status AS BIT) AS IsDefault
                    FROM Account WHERE InstitutionID=@InstitutionID ORDER BY AccountName",
                    new { InstitutionID = institutionId });
                return Ok(new { success = true, data = rows });
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }

        // GET: api/ItemSell/search-customer?institutionId=&prefix=
        [HttpGet("search-customer")]
        public IActionResult SearchCustomer([FromQuery] int institutionId, [FromQuery] string prefix = "")
        {
            try
            {
                using var con = _context.CreateConnection();
                var rows = con.Query<dynamic>(@"
                    SELECT TOP 5 CustomerID, CustomerName, Phone, Address,
                           ISNULL(Description,'') AS Description,
                           Cloth_For_ID AS ClothForId
                    FROM Customer
                    WHERE InstitutionID=@InstitutionID
                      AND (Phone LIKE @P+'%' OR CustomerName LIKE '%'+@P+'%')
                    ORDER BY CustomerName",
                    new { InstitutionID = institutionId, P = prefix });
                return Ok(new { success = true, data = rows });
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }

        // POST: api/ItemSell/add-customer
        [HttpPost("add-customer")]
        public IActionResult AddCustomer([FromBody] AddCustomerDto dto)
        {
            try
            {
                using var con = _context.CreateConnection();
                var exists = con.ExecuteScalar<int>(
                    "SELECT COUNT(*) FROM Customer WHERE InstitutionID=@InstitutionID AND CustomerName=@Name AND Phone=@Phone",
                    new { InstitutionID = dto.InstitutionID, Name = dto.CustomerName.Trim(), Phone = dto.Phone.Trim() });
                if (exists > 0)
                    return Ok(new { success = false, message = dto.CustomerName + " মোবাইল: " + dto.Phone + " পূর্বে নিবন্ধিত" });

                var customerId = con.ExecuteScalar<int>(@"
                    INSERT INTO Customer (RegistrationID, InstitutionID, Cloth_For_ID, CustomerName, Phone,
                                         Address, Description, Date, CustomerNumber)
                    VALUES (@RegistrationID, @InstitutionID, @ClothForId, @CustomerName, @Phone,
                            @Address, @Description, GETDATE(),
                            (SELECT [dbo].[CustomeSerialNumber](@InstitutionID)));
                    SELECT CAST(SCOPE_IDENTITY() AS INT);",
                    new {
                        RegistrationID = dto.RegistrationID,
                        InstitutionID  = dto.InstitutionID,
                        ClothForId     = dto.ClothForId,
                        CustomerName   = dto.CustomerName.Trim(),
                        Phone          = dto.Phone.Trim(),
                        Address        = dto.Address?.Trim() ?? "",
                        Description    = dto.Description?.Trim() ?? ""
                    });

                con.Execute(
                    "UPDATE Institution SET TotalCustomer=[dbo].[CustomeSerialNumber](@ID) WHERE InstitutionID=@ID",
                    new { ID = dto.InstitutionID });

                return Ok(new { success = true, message = "Customer added", customerId });
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }

        // POST: api/ItemSell/submit
        [HttpPost("submit")]
        public IActionResult Submit([FromBody] SellSubmitDto dto)
        {
            try
            {
                using var con = _context.CreateConnection();
                con.Open();

                // SP uses OPENJSON — pass a JSON array
                var fabricJson = System.Text.Json.JsonSerializer.Serialize(
                    dto.Items.Select(i => new
                    {
                        FabricID         = i.FabricId,
                        SellingQuantity  = i.Quantity,
                        SellingUnitPrice = i.UnitPrice
                    }));

                using var cmd = new System.Data.SqlClient.SqlCommand();
                cmd.CommandText = "SP_Fabrics_Sell";
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Connection = (System.Data.SqlClient.SqlConnection)con;

                cmd.Parameters.AddWithValue("@InstitutionID", dto.InstitutionID);
                cmd.Parameters.AddWithValue("@RegistrationID", dto.RegistrationID);
                cmd.Parameters.AddWithValue("@AccountID", dto.AccountId);
                cmd.Parameters.AddWithValue("@CustomerID", dto.CustomerId == 0 ? (object)DBNull.Value : dto.CustomerId);
                cmd.Parameters.AddWithValue("@SellingPaidAmount", dto.PaidAmount);
                cmd.Parameters.AddWithValue("@SellingDiscountAmount", dto.DiscountAmount);
                cmd.Parameters.AddWithValue("@FabricList", fabricJson);

                var sellingId = Convert.ToInt32(cmd.ExecuteScalar());

                return Ok(new { success = true, sellingId });
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }

        // GET: api/ItemSell/invoice?sellingId=
        [HttpGet("invoice")]
        public IActionResult GetInvoice([FromQuery] int sellingId)
        {
            try
            {
                using var con = _context.CreateConnection();
                var header = con.QueryFirstOrDefault<dynamic>(@"
                    SELECT
                        fs.FabricsSellingID, fs.Selling_SN AS SellingSN,
                        fs.SellingTotalPrice, fs.SellingDiscountAmount,
                        fs.SellingPaidAmount - ISNULL(fs.SellingReturnAmount, 0) AS SellingPaidAmount,
                        fs.SellingDueAmount, fs.SellingDate,
                        ISNULL(c.CustomerName,'') AS CustomerName,
                        ISNULL(c.Phone,'')        AS CustomerPhone,
                        i.InstitutionName,
                        ISNULL(i.Phone,'')        AS InstitutionPhone,
                        ISNULL(i.Address,'')      AS InstitutionAddress,
                        ISNULL(i.Dialog_Title,'') AS InstitutionSubTitle
                    FROM Fabrics_Selling fs WITH (NOLOCK)
                    JOIN Institution i WITH (NOLOCK) ON fs.InstitutionID = i.InstitutionID
                    LEFT JOIN Customer c WITH (NOLOCK) ON fs.CustomerID = c.CustomerID
                    WHERE fs.FabricsSellingID = @SellingId",
                    new { SellingId = sellingId });

                if (header == null)
                    return NotFound(new { success = false, message = "Invoice not found" });

                var items = con.Query<dynamic>(@"
                    SELECT f.FabricCode, f.FabricsName,
                           sl.SellingQuantity, sl.SellingUnitPrice, sl.SellingPrice,
                           ISNULL(u.UnitName,'') AS UnitName
                    FROM Fabrics_Selling_List sl WITH (NOLOCK)
                    JOIN Fabrics f WITH (NOLOCK) ON sl.FabricID = f.FabricID
                    LEFT JOIN Fabrics_Mesurement_Unit u WITH (NOLOCK) ON f.FabricMesurementUnitID = u.FabricMesurementUnitID
                    WHERE sl.FabricsSellingID = @SellingId",
                    new { SellingId = sellingId });

                return Ok(new { success = true, header, items });
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }

        // GET: api/ItemSell/records?institutionId=&page=&pageSize=&dateFrom=&dateTo=&customer=&sellingSN=
        [HttpGet("records")]
        public IActionResult GetRecords(
            [FromQuery] int    institutionId,
            [FromQuery] int    page      = 1,
            [FromQuery] int    pageSize  = 20,
            [FromQuery] string dateFrom  = "",
            [FromQuery] string dateTo    = "",
            [FromQuery] string customer  = "",
            [FromQuery] string sellingSN = "")
        {
            try
            {
                using var con = _context.CreateConnection();

                var sql = @"
                    SELECT
                        fs.FabricsSellingID  AS SellingId,
                        fs.Selling_SN        AS SellingSN,
                        CONVERT(varchar(10), fs.SellingDate, 23) AS SellingDate,
                        fs.SellingTotalPrice,
                        fs.SellingDiscountAmount,
                        fs.SellingPaidAmount - ISNULL(fs.SellingReturnAmount, 0) AS SellingPaidAmount,
                        fs.SellingDueAmount,
                        ISNULL(c.CustomerName,'') AS CustomerName,
                        ISNULL(c.Phone,'')        AS CustomerPhone
                    FROM Fabrics_Selling fs WITH (NOLOCK)
                    LEFT JOIN Customer c WITH (NOLOCK) ON fs.CustomerID = c.CustomerID
                    WHERE fs.InstitutionID = @InstitutionID
                      AND (@DateFrom = '' OR CAST(fs.SellingDate AS DATE) >= @DateFrom)
                      AND (@DateTo   = '' OR CAST(fs.SellingDate AS DATE) <= @DateTo)
                      AND (@Customer = '' OR c.CustomerName LIKE '%' + @Customer + '%'
                                         OR c.Phone        LIKE  @Customer + '%')
                      AND (@SellingSN = '' OR CAST(fs.Selling_SN AS VARCHAR) LIKE @SellingSN + '%')";

                var countSql = $"SELECT COUNT(*) FROM ({sql}) AS T";
                var sumSql   = $@"SELECT
                        ISNULL(SUM(SellingTotalPrice),0)    AS TotalAmount,
                        ISNULL(SUM(SellingPaidAmount),0)    AS TotalPaid,
                        ISNULL(SUM(SellingDueAmount),0)     AS TotalDue
                    FROM ({sql}) AS T";

                var p = new { InstitutionID = institutionId, DateFrom = dateFrom, DateTo = dateTo,
                              Customer = customer, SellingSN = sellingSN };

                var totalCount = con.ExecuteScalar<int>(countSql, p);
                var summary    = con.QueryFirstOrDefault<dynamic>(sumSql, p);

                var pagedSql = sql + " ORDER BY fs.Selling_SN DESC OFFSET @Skip ROWS FETCH NEXT @Take ROWS ONLY";
                var data     = con.Query<dynamic>(pagedSql,
                    new { InstitutionID = institutionId, DateFrom = dateFrom, DateTo = dateTo,
                          Customer = customer, SellingSN = sellingSN,
                          Skip = (page - 1) * pageSize, Take = pageSize });

                return Ok(new {
                    success    = true,
                    totalCount,
                    totalPages = (int)Math.Ceiling((double)totalCount / pageSize),
                    summary,
                    data
                });
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }

        // GET: api/ItemSell/record-detail?sellingId=
        [HttpGet("record-detail")]
        public IActionResult GetRecordDetail([FromQuery] int sellingId)
        {
            try
            {
                using var con = _context.CreateConnection();
                var data = con.Query<dynamic>(@"
                    SELECT
                        f.FabricCode   AS ItemCode,
                        f.FabricsName  AS ItemName,
                        ISNULL(u.UnitName,'') AS UnitName,
                        sl.SellingQuantity  AS Quantity,
                        sl.SellingUnitPrice AS UnitPrice,
                        sl.SellingPrice     AS TotalPrice
                    FROM Fabrics_Selling_List sl WITH (NOLOCK)
                    JOIN Fabrics f WITH (NOLOCK) ON sl.FabricID = f.FabricID
                    LEFT JOIN Fabrics_Mesurement_Unit u WITH (NOLOCK) ON f.FabricMesurementUnitID = u.FabricMesurementUnitID
                    WHERE sl.FabricsSellingID = @SellingId",
                    new { SellingId = sellingId });
                return Ok(new { success = true, data });
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }

        // GET: api/ItemSell/return-info?institutionId=&sellingSN=
        [HttpGet("return-info")]
        public IActionResult GetReturnInfo([FromQuery] int institutionId, [FromQuery] string sellingSN = "")
        {
            try
            {
                using var con = _context.CreateConnection();
                var header = con.QueryFirstOrDefault<dynamic>(@"
                    SELECT
                        fs.FabricsSellingID AS SellingId,
                        fs.Selling_SN       AS SellingSN,
                        fs.SellingTotalPrice,
                        fs.SellingDiscountAmount,
                        fs.SellingDiscountPercentage,
                        fs.SellingPaidAmount - ISNULL(fs.SellingReturnAmount, 0) AS SellingPaidAmount,
                        fs.SellingDueAmount,
                        ISNULL(fs.SellingReturnAmount, 0) AS SellingReturnAmount,
                        CONVERT(varchar(10), fs.SellingDate, 23) AS SellingDate,
                        ISNULL(c.CustomerName,'') AS CustomerName,
                        ISNULL(c.Phone,'')        AS CustomerPhone
                    FROM Fabrics_Selling fs WITH (NOLOCK)
                    LEFT JOIN Customer c WITH (NOLOCK) ON fs.CustomerID = c.CustomerID
                    WHERE fs.InstitutionID = @InstitutionID
                      AND fs.Selling_SN = @SellingSN",
                    new { InstitutionID = institutionId, SellingSN = sellingSN });

                if (header == null)
                    return Ok(new { success = false, message = "রশিদ পাওয়া যায়নি" });

                var sellingId = (int)header.SellingId;
                var items = con.Query<dynamic>(@"
                    SELECT
                        sl.FabricID,
                        f.FabricCode,
                        f.FabricsName,
                        ISNULL(u.UnitName,'') AS UnitName,
                        sl.SellingQuantity,
                        sl.SellingUnitPrice,
                        sl.SellingPrice
                    FROM Fabrics_Selling_List sl WITH (NOLOCK)
                    JOIN Fabrics f WITH (NOLOCK) ON sl.FabricID = f.FabricID
                    LEFT JOIN Fabrics_Mesurement_Unit u WITH (NOLOCK) ON f.FabricMesurementUnitID = u.FabricMesurementUnitID
                    WHERE sl.FabricsSellingID = @SellingId",
                    new { SellingId = sellingId });

                var accounts = con.Query<dynamic>(@"
                    SELECT AccountID,
                           AccountName + ' (' + CONVERT(VARCHAR, CAST(AccountBalance AS DECIMAL(18,2))) + ' Tk)' AS AccountName,
                           CAST(Default_Status AS BIT) AS IsDefault
                    FROM Account
                    WHERE InstitutionID = @InstitutionID AND AccountBalance > 0
                    ORDER BY Default_Status DESC, AccountName",
                    new { InstitutionID = institutionId });

                return Ok(new { success = true, header, items, accounts });
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }

        // POST: api/ItemSell/submit-return
        [HttpPost("submit-return")]
        public IActionResult SubmitReturn([FromBody] SellReturnDto dto)
        {
            try
            {
                using var con = _context.CreateConnection();
                con.Open();
                using var tx = con.BeginTransaction();
                try
                {
                    // Save original paid amount BEFORE any SP call (SP may overwrite it)
                    var originalPaid = con.ExecuteScalar<double>(
                        "SELECT ISNULL(SellingPaidAmount, 0) FROM Fabrics_Selling WHERE FabricsSellingID = @Id",
                        new { Id = dto.SellingId }, transaction: tx);

                    // 1. Each returned item → SP_Fabrics_Selling_Return_Quantity
                    //    @Change_Quantity = KEPT quantity (sold - returned), as the SP expects
                    foreach (var item in dto.ReturnItems)
                    {
                        var soldQty = con.ExecuteScalar<double>(
                            "SELECT ISNULL(SellingQuantity, 0) FROM Fabrics_Selling_List WHERE FabricsSellingID = @SellingId AND FabricID = @FabricId",
                            new { SellingId = dto.SellingId, FabricId = item.FabricId }, transaction: tx);

                        var keepQty = soldQty - item.ReturnQuantity;

                        var p1 = new DynamicParameters();
                        p1.Add("@FabricID",        item.FabricId);
                        p1.Add("@InstitutionID",    dto.InstitutionID);
                        p1.Add("@RegistrationID",   dto.RegistrationID);
                        p1.Add("@FabricsSellingID", dto.SellingId);
                        p1.Add("@ReturnDate",       dto.ReturnDate);
                        p1.Add("@Change_Quantity",  keepQty);
                        p1.Add("@SellingUnitPrice", item.SellingUnitPrice);
                        p1.Add("@Add_To_Stock",     dto.AddToStock ? "Yes" : "No");
                        con.Execute("SP_Fabrics_Selling_Return_Quantity", p1,
                            commandType: CommandType.StoredProcedure, transaction: tx);
                    }

                    // 2. Build @IDs for SP_Fabrics_Selling_Return_Price (kept items)
                    var allFabricIds = con.Query<int>(
                        "SELECT FabricID FROM Fabrics_Selling_List WHERE FabricsSellingID = @SellingId",
                        new { SellingId = dto.SellingId }, transaction: tx).ToList();
                    var keptIds = con.Query<int>(
                        "SELECT FabricID FROM Fabrics_Selling_List WHERE FabricsSellingID = @SellingId AND SellingQuantity > 0",
                        new { SellingId = dto.SellingId }, transaction: tx).ToList();
                    var ids = keptIds.Any()
                        ? string.Join(", ", keptIds)
                        : string.Join(", ", allFabricIds);

                    var p2 = new DynamicParameters();
                    p2.Add("@InstitutionID",        dto.InstitutionID);
                    p2.Add("@RegistrationID",        dto.RegistrationID);
                    p2.Add("@FabricsSellingID",      dto.SellingId);
                    p2.Add("@Return_Date",           dto.ReturnDate);
                    p2.Add("@ReturnDate",            dto.ReturnDate);
                    p2.Add("@SellingDiscountAmount", dto.DiscountAmount);
                    p2.Add("@AccountID",
                        dto.AccountId > 0 ? (object)dto.AccountId : DBNull.Value);
                    p2.Add("@Add_To_Stock",          dto.AddToStock ? "Yes" : "No");
                    p2.Add("@IDs",                   ids);
                    con.Execute("SP_Fabrics_Selling_Return_Price", p2,
                        commandType: CommandType.StoredProcedure, transaction: tx);

                    // 3. Restore original paid amount (SP may have overwritten it),
                    //    then add the new additional payment on top
                    double finalPaid = originalPaid + (dto.NewPaidAmount > 0 ? dto.NewPaidAmount : 0);
                    con.Execute(
                        "UPDATE Fabrics_Selling SET SellingPaidAmount = @Paid WHERE FabricsSellingID = @Id",
                        new { Paid = finalPaid, Id = dto.SellingId },
                        transaction: tx);

                    tx.Commit();
                    return Ok(new { success = true, sellingId = dto.SellingId });
                }
                catch
                {
                    tx.Rollback();
                    throw;
                }
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }

        // GET: api/ItemSell/report?institutionId=&dateFrom=&dateTo=
        [HttpGet("report")]
        public IActionResult GetReport(
            [FromQuery] int institutionId,
            [FromQuery] string? dateFrom = null,
            [FromQuery] string? dateTo   = null)
        {
            try
            {
                using var con = _context.CreateConnection();
                var p = new { InstitutionID = institutionId, DateFrom = dateFrom, DateTo = dateTo };

                // 1. Overall Summary
                var summary = con.QuerySingle<dynamic>(@"
                    SELECT
                        COUNT(DISTINCT fs.FabricsSellingID)              AS TotalSales,
                        ISNULL(SUM(fs.SellingTotalPrice),0)              AS TotalAmount,
                        ISNULL(SUM(fs.SellingPaidAmount),0)              AS TotalPaid,
                        ISNULL(SUM(fs.SellingDueAmount),0)               AS TotalDue,
                        ISNULL(SUM(fs.SellingDiscountAmount),0)          AS TotalDiscount,
                        ISNULL(SUM(sl.SellingQuantity),0)                AS TotalQuantity,
                        COUNT(DISTINCT fs.CustomerID)                    AS TotalCustomers
                    FROM Fabrics_Selling fs
                    LEFT JOIN Fabrics_Selling_List sl ON fs.FabricsSellingID = sl.FabricsSellingID
                    WHERE fs.InstitutionID = @InstitutionID
                      AND (@DateFrom IS NULL OR fs.SellingDate >= @DateFrom)
                      AND (@DateTo   IS NULL OR fs.SellingDate <= @DateTo)", p);

                // 2. Return Summary
                var returnSummary = con.QuerySingle<dynamic>(@"
                    SELECT
                        ISNULL(SUM(r.ReturnSellingQuantity),0)  AS TotalReturnQty,
                        ISNULL(SUM(rp.SellingReturnPrice),0)    AS TotalReturnPrice,
                        COUNT(DISTINCT r.FabricsSellingID)      AS TotalReturnOrders
                    FROM Fabrics_Selling_Return_Quantity r
                    LEFT JOIN Fabrics_Selling_Return_Price rp
                        ON r.FabricsSellingID = rp.FabricsSellingID
                        AND r.InstitutionID   = rp.InstitutionID
                    WHERE r.InstitutionID = @InstitutionID
                      AND (@DateFrom IS NULL OR r.ReturnDate >= @DateFrom)
                      AND (@DateTo   IS NULL OR r.ReturnDate <= @DateTo)", p);

                // 3. Top Sold Items
                var topItems = con.Query<dynamic>(@"
                    SELECT TOP 10
                        f.FabricCode AS ItemCode, f.FabricsName AS ItemName,
                        ISNULL(u.UnitName,'') AS UnitName,
                        SUM(sl.SellingQuantity)                                                        AS TotalQty,
                        ROUND(SUM(sl.SellingPrice) / NULLIF(SUM(sl.SellingQuantity),0), 2)             AS AvgUnitPrice,
                        SUM(sl.SellingPrice)                                                           AS TotalPrice,
                        f.StockFabricQuantity                                                          AS CurrentStock
                    FROM Fabrics_Selling_List sl
                    INNER JOIN Fabrics_Selling fs ON sl.FabricsSellingID = fs.FabricsSellingID
                    INNER JOIN Fabrics f           ON sl.FabricID = f.FabricID
                    LEFT  JOIN Fabrics_Mesurement_Unit u ON f.FabricMesurementUnitID = u.FabricMesurementUnitID
                    WHERE sl.InstitutionID = @InstitutionID
                      AND (@DateFrom IS NULL OR fs.SellingDate >= @DateFrom)
                      AND (@DateTo   IS NULL OR fs.SellingDate <= @DateTo)
                    GROUP BY f.FabricCode, f.FabricsName, u.UnitName, f.StockFabricQuantity
                    ORDER BY TotalQty DESC", p);

                // 4. Top Customers
                var topCustomers = con.Query<dynamic>(@"
                    SELECT TOP 8
                        c.CustomerName, ISNULL(c.Phone,'') AS Phone,
                        COUNT(DISTINCT fs.FabricsSellingID)     AS TotalOrders,
                        ISNULL(SUM(fs.SellingTotalPrice),0)     AS TotalAmount,
                        ISNULL(SUM(fs.SellingPaidAmount),0)     AS TotalPaid,
                        ISNULL(SUM(fs.SellingDueAmount),0)      AS TotalDue
                    FROM Fabrics_Selling fs
                    INNER JOIN Customer c ON fs.CustomerID = c.CustomerID
                    WHERE fs.InstitutionID = @InstitutionID
                      AND (@DateFrom IS NULL OR fs.SellingDate >= @DateFrom)
                      AND (@DateTo   IS NULL OR fs.SellingDate <= @DateTo)
                    GROUP BY c.CustomerName, c.Phone
                    ORDER BY TotalAmount DESC", p);

                // 5. Monthly Trend (last 12 months)
                var monthlyTrend = con.Query<dynamic>(@"
                    SELECT
                        FORMAT(fs.SellingDate,'yyyy-MM')         AS Month,
                        COUNT(DISTINCT fs.FabricsSellingID)      AS Orders,
                        ISNULL(SUM(fs.SellingTotalPrice),0)      AS Amount
                    FROM Fabrics_Selling fs
                    WHERE fs.InstitutionID = @InstitutionID
                      AND fs.SellingDate >= DATEADD(MONTH, -11, DATEFROMPARTS(YEAR(GETDATE()), MONTH(GETDATE()), 1))
                    GROUP BY FORMAT(fs.SellingDate,'yyyy-MM')
                    ORDER BY Month", new { InstitutionID = institutionId });

                // 6. Return Items Detail
                var returnItems = con.Query<dynamic>(@"
                    SELECT TOP 10
                        f.FabricCode AS ItemCode, f.FabricsName AS ItemName,
                        ISNULL(u.UnitName,'') AS UnitName,
                        SUM(r.ReturnSellingQuantity) AS TotalReturnQty
                    FROM Fabrics_Selling_Return_Quantity r
                    INNER JOIN Fabrics f ON r.FabricID = f.FabricID
                    LEFT  JOIN Fabrics_Mesurement_Unit u ON f.FabricMesurementUnitID = u.FabricMesurementUnitID
                    WHERE r.InstitutionID = @InstitutionID
                      AND (@DateFrom IS NULL OR r.ReturnDate >= @DateFrom)
                      AND (@DateTo   IS NULL OR r.ReturnDate <= @DateTo)
                    GROUP BY f.FabricCode, f.FabricsName, u.UnitName
                    ORDER BY TotalReturnQty DESC", p);

                return Ok(new
                {
                    success = true,
                    summary,
                    returnSummary,
                    topItems,
                    topCustomers,
                    monthlyTrend,
                    returnItems
                });
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }
    }

    public class AddCustomerDto
    {
        public int    InstitutionID  { get; set; }
        public int    RegistrationID { get; set; }
        public string CustomerName   { get; set; } = "";
        public string Phone          { get; set; } = "";
        public string? Address       { get; set; }
        public string? Description   { get; set; }
        public int    ClothForId     { get; set; } = 1;
    }

    public class SellItemDto
    {
        public int    FabricId  { get; set; }
        public double Quantity  { get; set; }
        public double UnitPrice { get; set; }
    }

    public class SellSubmitDto
    {
        public int    InstitutionID  { get; set; }
        public int    RegistrationID { get; set; }
        public int    AccountId      { get; set; }
        public int    CustomerId     { get; set; }
        public double PaidAmount     { get; set; }
        public double DiscountAmount { get; set; }
        public List<SellItemDto> Items { get; set; } = new();
    }

    public class ReturnItemDto
    {
        public int    FabricId        { get; set; }
        public double ReturnQuantity  { get; set; }
        public double SellingUnitPrice { get; set; }
    }

    public class SellReturnDto
    {
        public int    InstitutionID  { get; set; }
        public int    RegistrationID { get; set; }
        public int    SellingId      { get; set; }
        public string ReturnDate     { get; set; } = "";
        public double DiscountAmount { get; set; }
        public int    AccountId      { get; set; }
        public bool   AddToStock     { get; set; } = true;
        public double NewPaidAmount  { get; set; } = -1; // -1 = not specified (SP default)
        public List<ReturnItemDto> ReturnItems { get; set; } = new();
    }
}
