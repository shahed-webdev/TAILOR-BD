using Microsoft.AspNetCore.Mvc;
using Dapper;
using TailorBD.API.Data;

namespace TailorBD.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ItemPurchaseController : ControllerBase
    {
        private readonly TailorBdContext _context;
        public ItemPurchaseController(TailorBdContext context) => _context = context;

        // GET: api/ItemPurchase/search-item?institutionId=&prefix=
        [HttpGet("search-item")]
        public IActionResult SearchItem([FromQuery] int institutionId, [FromQuery] string prefix = "")
        {
            try
            {
                using var con = _context.CreateConnection();
                var rows = con.Query<dynamic>(@"
                    SELECT TOP(6) f.FabricID AS ItemID, f.FabricCode AS ItemCode,
                           f.FabricsName AS ItemName, f.SellingUnitPrice,
                           f.StockFabricQuantity AS StockQuantity,
                           u.UnitName
                    FROM Fabrics f
                    INNER JOIN Fabrics_Mesurement_Unit u ON f.FabricMesurementUnitID = u.FabricMesurementUnitID
                    WHERE f.InstitutionID = @InstitutionID
                      AND (f.FabricCode LIKE @Prefix + '%' OR f.FabricsName LIKE '%' + @Prefix + '%')
                    ORDER BY f.FabricCode",
                    new { InstitutionID = institutionId, Prefix = prefix });
                return Ok(new { success = true, data = rows });
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }

        // GET: api/ItemPurchase/suppliers?institutionId=
        [HttpGet("suppliers")]
        public IActionResult GetSuppliers([FromQuery] int institutionId)
        {
            try
            {
                using var con = _context.CreateConnection();
                var rows = con.Query<dynamic>(@"
                    SELECT FabricsSupplierID AS SupplierID, SupplierName,
                           SupplierCompanyName, SupplierPhone, SupplierAddress,
                           ISNULL(SupplierDue,0) AS SupplierDue
                    FROM Fabrics_Supplier
                    WHERE InstitutionID = @InstitutionID
                    ORDER BY SupplierName",
                    new { InstitutionID = institutionId });
                return Ok(new { success = true, data = rows });
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }

        // GET: api/ItemPurchase/accounts?institutionId=
        [HttpGet("accounts")]
        public IActionResult GetAccounts([FromQuery] int institutionId)
        {
            try
            {
                using var con = _context.CreateConnection();
                var rows = con.Query<dynamic>(@"
                    SELECT AccountID, AccountName, AccountBalance,
                           ISNULL(Default_Status,0) AS IsDefault
                    FROM Account
                    WHERE InstitutionID = @InstitutionID AND AccountBalance > 0
                    ORDER BY AccountName",
                    new { InstitutionID = institutionId });
                return Ok(new { success = true, data = rows });
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }

        // GET: api/ItemPurchase/records?institutionId=&page=1&pageSize=20&dateFrom=&dateTo=&supplier=&billNo=
        [HttpGet("records")]
        public IActionResult GetRecords(
            [FromQuery] int institutionId,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20,
            [FromQuery] string? dateFrom = null,
            [FromQuery] string? dateTo = null,
            [FromQuery] string? supplier = null,
            [FromQuery] string? billNo = null)
        {
            try
            {
                using var con = _context.CreateConnection();
                var offset = (page - 1) * pageSize;

                var where = "WHERE fb.InstitutionID = @InstitutionID";
                if (!string.IsNullOrWhiteSpace(dateFrom)) where += " AND fb.BuyingDate >= @DateFrom";
                if (!string.IsNullOrWhiteSpace(dateTo))   where += " AND fb.BuyingDate <= @DateTo";
                if (!string.IsNullOrWhiteSpace(supplier)) where += " AND (s.SupplierName LIKE '%'+@Supplier+'%' OR s.SupplierPhone LIKE '%'+@Supplier+'%')";
                if (!string.IsNullOrWhiteSpace(billNo))   where += " AND fb.BillNo LIKE '%'+@BillNo+'%'";

                var sql = $@"
                    SELECT fb.FabricBuyingID AS PurchaseID,
                           fb.Buying_SN AS PurchaseSN,
                           CONVERT(varchar(10), fb.BuyingDate, 23) AS BuyingDate,
                           ISNULL(fb.BillNo,'') AS BillNo,
                           ISNULL(fb.BuyingTotalPrice,0) AS BuyingTotalPrice,
                           ISNULL(fb.BuyingDiscountAmount,0) AS BuyingDiscountAmount,
                           ISNULL(fb.BuyingPaidAmount,0) AS BuyingPaidAmount,
                           ISNULL(fb.BuyingDueAmount,0) AS BuyingDueAmount,
                           ISNULL(s.SupplierName,'—') AS SupplierName,
                           ISNULL(s.SupplierPhone,'') AS SupplierPhone
                    FROM Fabrics_Buying fb
                    LEFT JOIN Fabrics_Supplier s ON fb.FabricsSupplierID = s.FabricsSupplierID
                    {where}
                    ORDER BY fb.FabricBuyingID DESC
                    OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY";

                var countSql = $@"SELECT COUNT(*) FROM Fabrics_Buying fb
                    LEFT JOIN Fabrics_Supplier s ON fb.FabricsSupplierID = s.FabricsSupplierID
                    {where}";

                var sumSql = $@"SELECT ISNULL(SUM(fb.BuyingTotalPrice),0) AS TotalAmount,
                           ISNULL(SUM(fb.BuyingPaidAmount),0) AS TotalPaid,
                           ISNULL(SUM(fb.BuyingDueAmount),0) AS TotalDue
                    FROM Fabrics_Buying fb
                    LEFT JOIN Fabrics_Supplier s ON fb.FabricsSupplierID = s.FabricsSupplierID
                    {where}";

                var param = new
                {
                    InstitutionID = institutionId,
                    Offset = offset, PageSize = pageSize,
                    DateFrom = dateFrom, DateTo = dateTo,
                    Supplier = supplier, BillNo = billNo
                };

                var rows    = con.Query<dynamic>(sql, param);
                var total   = con.ExecuteScalar<int>(countSql, param);
                var summary = con.QuerySingle<dynamic>(sumSql, param);

                return Ok(new
                {
                    success = true,
                    data = rows,
                    totalCount = total,
                    totalPages = (int)Math.Ceiling((double)total / pageSize),
                    summary = new
                    {
                        totalAmount = (double)summary.TotalAmount,
                        totalPaid   = (double)summary.TotalPaid,
                        totalDue    = (double)summary.TotalDue
                    }
                });
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }

        // GET: api/ItemPurchase/record-detail?purchaseId=
        [HttpGet("record-detail")]
        public IActionResult GetRecordDetail([FromQuery] int purchaseId)
        {
            try
            {
                using var con = _context.CreateConnection();
                var rows = con.Query<dynamic>(@"
                    SELECT f.FabricCode AS ItemCode, f.FabricsName AS ItemName,
                           u.UnitName,
                           bl.BuyingQuantity AS Quantity,
                           ROUND(bl.BuyingPrice / NULLIF(bl.BuyingQuantity,0), 2) AS UnitPrice,
                           bl.BuyingPrice AS TotalPrice
                    FROM Fabrics_Buying_List bl
                    INNER JOIN Fabrics f ON bl.FabricID = f.FabricID
                    LEFT JOIN Fabrics_Mesurement_Unit u ON f.FabricMesurementUnitID = u.FabricMesurementUnitID
                    WHERE bl.FabricBuyingID = @PurchaseID
                    ORDER BY bl.FabricBuyingListID",
                    new { PurchaseID = purchaseId });
                return Ok(new { success = true, data = rows });
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }

        // POST: api/ItemPurchase/add-supplier
        [HttpPost("add-supplier")]
        public IActionResult AddSupplier([FromBody] SupplierDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.SupplierName))
                return BadRequest(new { success = false, message = "সাপ্লায়ারের নাম দিন" });
            try
            {
                using var con = _context.CreateConnection();
                var id = con.QuerySingle<int>(@"
                    INSERT INTO Fabrics_Supplier
                        (InstitutionID, RegistrationID, SupplierName, SupplierPhone, SupplierAddress, SupplierCompanyName)
                    VALUES
                        (@InstitutionID, @RegistrationID, @SupplierName, @SupplierPhone, @SupplierAddress, @SupplierCompanyName);
                    SELECT CAST(SCOPE_IDENTITY() AS INT)",
                    new
                    {
                        dto.InstitutionID, dto.RegistrationID,
                        dto.SupplierName, dto.SupplierPhone,
                        dto.SupplierAddress, dto.SupplierCompanyName
                    });
                return Ok(new { success = true, message = "সাপ্লায়ার সফলভাবে যুক্ত হয়েছে", data = new { SupplierID = id, dto.SupplierName } });
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }

        // POST: api/ItemPurchase/submit
        [HttpPost("submit")]
        public IActionResult Submit([FromBody] PurchaseSubmitDto dto)
        {
            if (dto.Items == null || dto.Items.Count == 0)
                return BadRequest(new { success = false, message = "কমপক্ষে একটি আইটেম যোগ করুন" });
            if (dto.BuyingDate == default)
                return BadRequest(new { success = false, message = "ক্রয়ের তারিখ দিন" });

            try
            {
                using var con = _context.CreateConnection();
                con.Open();
                using var tran = con.BeginTransaction();
                try
                {
                    // 1. Insert Fabrics_Buying header
                    var buyingId = con.QuerySingle<int>(@"
                        INSERT INTO Fabrics_Buying
                            (InstitutionID, RegistrationID, FabricsSupplierID, Buying_SN, BillNo, BuyingDate)
                        VALUES
                            (@InstitutionID, @RegistrationID, NULLIF(@SupplierID,0),
                             dbo.Fabric_Buying_SerialNumber(@InstitutionID),
                             @BillNo, @BuyingDate);
                        SELECT CAST(SCOPE_IDENTITY() AS INT)",
                        new
                        {
                            dto.InstitutionID, dto.RegistrationID,
                            dto.SupplierID, dto.BillNo, dto.BuyingDate
                        }, tran);

                    // 2. Insert list items & optionally update new fabric or selling price
                    foreach (var item in dto.Items)
                    {
                        // If new item: insert to Fabrics
                        if (item.ItemID == 0)
                        {
                            item.ItemID = con.QuerySingle<int>(@"
                                IF NOT EXISTS (SELECT 1 FROM Fabrics WHERE FabricCode=@ItemCode AND InstitutionID=@InstitutionID)
                                BEGIN
                                    INSERT INTO Fabrics
                                        (InstitutionID,RegistrationID,FabricMesurementUnitID,FabricsBrandID,FabricsCategoryID,
                                         Fabric_SN,FabricCode,FabricsName,SellingUnitPrice,CurrentBuyingUnitPrice)
                                    VALUES
                                        (@InstitutionID,@RegistrationID,@UnitID,NULLIF(@BrandID,0),NULLIF(@CategoryID,0),
                                         dbo.Fabric_SerialNumber(@InstitutionID),@ItemCode,@ItemName,@SellingUnitPrice,ROUND(@BuyingUnitPrice,2))
                                    SELECT CAST(SCOPE_IDENTITY() AS INT)
                                END
                                ELSE
                                BEGIN
                                    SELECT FabricID FROM Fabrics WHERE FabricCode=@ItemCode AND InstitutionID=@InstitutionID
                                END",
                                new
                                {
                                    dto.InstitutionID, dto.RegistrationID,
                                    item.UnitID, item.BrandID, item.CategoryID,
                                    item.ItemCode, item.ItemName,
                                    item.SellingUnitPrice, item.BuyingUnitPrice
                                }, tran);
                        }
                        else
                        {
                            // Update selling price if changed
                            if (item.SellingUnitPrice > 0)
                            {
                                con.Execute(
                                    "UPDATE Fabrics SET SellingUnitPrice=@SellingUnitPrice WHERE FabricID=@ItemID",
                                    new { item.SellingUnitPrice, item.ItemID }, tran);
                            }
                        }

                        // Insert buying list
                        con.Execute(@"
                            INSERT INTO Fabrics_Buying_List
                                (InstitutionID, RegistrationID, FabricBuyingID, FabricID,
                                 BuyingQuantity, BuyingPrice, FabricsSupplierID)
                            VALUES
                                (@InstitutionID, @RegistrationID, @BuyingID, @ItemID,
                                 @Quantity, ROUND(@TotalPrice,2), NULLIF(@SupplierID,0))",
                            new
                            {
                                dto.InstitutionID, dto.RegistrationID,
                                BuyingID = buyingId, item.ItemID,
                                item.Quantity, item.TotalPrice, dto.SupplierID
                            }, tran);

                        // Update current buying price if requested
                        if (dto.UpdateBuyingPrice)
                        {
                            con.Execute(
                                "UPDATE Fabrics SET CurrentBuyingUnitPrice=ROUND(@BuyingUnitPrice,2) WHERE FabricID=@ItemID",
                                new { item.BuyingUnitPrice, item.ItemID }, tran);
                        }
                    }

                    // 3. Update header totals
                    con.Execute(@"
                        UPDATE Fabrics_Buying
                        SET BuyingDiscountAmount = @DiscountAmount
                        WHERE FabricBuyingID = @BuyingID",
                        new { dto.DiscountAmount, BuyingID = buyingId }, tran);

                    // 4. Payment record
                    if (dto.PaidAmount > 0)
                    {
                        con.Execute(@"
                            INSERT INTO Fabrics_Buying_PaymentRecord
                                (FabricBuyingID, RegistrationID, InstitutionID, FabricsSupplierID,
                                 BuyingPaidAmount, AccountID, Payment_Situation, BuyingPaid_Date, InsertDate)
                            VALUES
                                (@BuyingID, @RegistrationID, @InstitutionID, NULLIF(@SupplierID,0),
                                 @PaidAmount, NULLIF(@AccountID,0), 'Buying', @BuyingDate, GETDATE())",
                            new
                            {
                                BuyingID = buyingId,
                                dto.RegistrationID, dto.InstitutionID,
                                dto.SupplierID, dto.PaidAmount,
                                dto.AccountID, dto.BuyingDate
                            }, tran);
                    }

                    tran.Commit();
                    return Ok(new { success = true, message = "ক্রয় সফলভাবে সম্পন্ন হয়েছে", data = new { PurchaseID = buyingId } });
                }
                catch
                {
                    tran.Rollback();
                    throw;
                }
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }

        // GET: api/ItemPurchase/check-code?institutionId=&code=
        [HttpGet("check-code")]
        public IActionResult CheckCode([FromQuery] int institutionId, [FromQuery] string code = "")
        {
            try
            {
                using var con = _context.CreateConnection();
                var exists = con.ExecuteScalar<int>(
                    "SELECT COUNT(1) FROM Fabrics WHERE FabricCode = @Code AND InstitutionID = @InstitutionID",
                    new { Code = code, InstitutionID = institutionId });
                return Ok(new { exists = exists > 0 });
            }
            catch (Exception ex) { return BadRequest(new { exists = false, message = ex.Message }); }
        }

        // GET: api/ItemPurchase/units?institutionId=
        [HttpGet("units")]
        public IActionResult GetUnits([FromQuery] int institutionId)
        {
            try
            {
                using var con = _context.CreateConnection();
                var rows = con.Query<dynamic>(
                    "SELECT FabricMesurementUnitID AS ItemMeasurementUnitID, UnitName FROM Fabrics_Mesurement_Unit WHERE InstitutionID = @InstitutionID ORDER BY UnitName",
                    new { InstitutionID = institutionId });
                return Ok(new { success = true, data = rows });
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }

        // GET: api/ItemPurchase/categories?institutionId=
        [HttpGet("categories")]
        public IActionResult GetCategories([FromQuery] int institutionId)
        {
            try
            {
                using var con = _context.CreateConnection();
                var rows = con.Query<dynamic>(
                    "SELECT FabricsCategoryID AS ItemCategoryID, FabricsCategoryName AS CategoryName FROM Fabrics_Category WHERE InstitutionID = @InstitutionID ORDER BY FabricsCategoryName",
                    new { InstitutionID = institutionId });
                return Ok(new { success = true, data = rows });
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }

        // GET: api/ItemPurchase/brands?institutionId=
        [HttpGet("brands")]
        public IActionResult GetBrands([FromQuery] int institutionId)
        {
            try
            {
                using var con = _context.CreateConnection();
                var rows = con.Query<dynamic>(
                    "SELECT FabricsBrandID AS ItemBrandID, FabricsBrandName AS BrandName FROM Fabrics_Brand WHERE InstitutionID = @InstitutionID ORDER BY FabricsBrandName",
                    new { InstitutionID = institutionId });
                return Ok(new { success = true, data = rows });
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }

        // GET: api/ItemPurchase/return-search?institutionId=&prefix=
        [HttpGet("return-search")]
        public IActionResult ReturnSearch([FromQuery] int institutionId, [FromQuery] string prefix = "")
        {
            try
            {
                using var con = _context.CreateConnection();
                var rows = con.Query<dynamic>(@"
                    SELECT TOP(8) f.FabricID AS ItemID, f.FabricCode AS ItemCode,
                           f.FabricsName AS ItemName,
                           f.StockFabricQuantity AS StockQuantity,
                           u.UnitName,
                           f.CurrentBuyingUnitPrice AS BuyingUnitPrice
                    FROM Fabrics f
                    LEFT JOIN Fabrics_Mesurement_Unit u ON f.FabricMesurementUnitID = u.FabricMesurementUnitID
                    WHERE f.InstitutionID = @InstitutionID
                      AND f.StockFabricQuantity > 0
                      AND (f.FabricCode LIKE @Prefix + '%' OR f.FabricsName LIKE '%' + @Prefix + '%')
                    ORDER BY f.FabricCode",
                    new { InstitutionID = institutionId, Prefix = prefix });
                return Ok(new { success = true, data = rows });
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }

        // GET: api/ItemPurchase/return-search-buying?institutionId=&sn=
        [HttpGet("return-search-buying")]
        public IActionResult ReturnSearchBuying([FromQuery] int institutionId, [FromQuery] string sn = "")
        {
            try
            {
                using var con = _context.CreateConnection();
                var rows = con.Query<dynamic>(@"
                    SELECT TOP(6) fb.FabricBuyingID, fb.Buying_SN AS PurchaseSN,
                           CONVERT(varchar(10), fb.BuyingDate, 23) AS BuyingDate,
                           ISNULL(fb.BillNo,'') AS BillNo,
                           ISNULL(s.SupplierName,'—') AS SupplierName
                    FROM Fabrics_Buying fb
                    LEFT JOIN Fabrics_Supplier s ON fb.FabricsSupplierID = s.FabricsSupplierID
                    WHERE fb.InstitutionID = @InstitutionID
                      AND fb.Buying_SN LIKE @SN + '%'
                    ORDER BY fb.FabricBuyingID DESC",
                    new { InstitutionID = institutionId, SN = sn });
                return Ok(new { success = true, data = rows });
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }

        // GET: api/ItemPurchase/return-buying-items?buyingId=
        [HttpGet("return-buying-items")]
        public IActionResult GetReturnBuyingItems([FromQuery] int buyingId)
        {
            try
            {
                using var con = _context.CreateConnection();
                var rows = con.Query<dynamic>(@"
                    SELECT bl.FabricBuyingListID, bl.FabricID,
                           f.FabricCode AS ItemCode, f.FabricsName AS ItemName,
                           u.UnitName,
                           bl.BuyingQuantity,
                           ROUND(bl.BuyingPrice / NULLIF(bl.BuyingQuantity,0), 2) AS BuyingUnitPrice,
                           f.StockFabricQuantity AS CurrentStock,
                           ISNULL((SELECT SUM(r.ReturnBuyingQuantity)
                                   FROM Fabrics_Buying_Return_Quantity r
                                   WHERE r.FabricBuyingListID = bl.FabricBuyingListID), 0) AS AlreadyReturned
                    FROM Fabrics_Buying_List bl
                    INNER JOIN Fabrics f ON bl.FabricID = f.FabricID
                    LEFT JOIN Fabrics_Mesurement_Unit u ON f.FabricMesurementUnitID = u.FabricMesurementUnitID
                    WHERE bl.FabricBuyingID = @BuyingID
                    ORDER BY bl.FabricBuyingListID",
                    new { BuyingID = buyingId });
                return Ok(new { success = true, data = rows });
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }

        // POST: api/ItemPurchase/return
        [HttpPost("return")]
        public IActionResult SubmitReturn([FromBody] PurchaseReturnDto dto)
        {
            if (dto.Items == null || dto.Items.Count == 0)
                return BadRequest(new { success = false, message = "কমপক্ষে একটি আইটেম যোগ করুন" });
            if (dto.ReturnDate == default)
                return BadRequest(new { success = false, message = "ফেরতের তারিখ দিন" });

            try
            {
                using var con = _context.CreateConnection();
                con.Open();
                using var tran = con.BeginTransaction();
                try
                {
                    foreach (var item in dto.Items)
                    {
                        // Stock validation
                        var stock = con.ExecuteScalar<double>(
                            "SELECT ISNULL(StockFabricQuantity, 0) FROM Fabrics WHERE FabricID=@ItemID AND InstitutionID=@InstitutionID",
                            new { item.ItemID, dto.InstitutionID }, tran);
                        if (item.ReturnQuantity > stock)
                            return BadRequest(new { success = false, message = $"'{item.ItemCode}' এর বর্তমান স্টক ({stock}) এর বেশি ফেরত সম্ভব নয়" });

                        // SP এ Change_Quantity = রাখার পরিমান = BuyingQuantity - ReturnQuantity
                        var buyingQty = con.ExecuteScalar<double>(
                            "SELECT ISNULL(BuyingQuantity, 0) FROM Fabrics_Buying_List WHERE FabricBuyingListID=@ListID",
                            new { ListID = item.BuyingListID }, tran);

                        var keepQuantity = buyingQty - item.ReturnQuantity;

                        // SP call: Change_Quantity = keep quantity (রাখার পরিমান)
                        con.Execute("SP_Fabrics_Buying_Return_Quantity",
                            new
                            {
                                FabricID       = item.ItemID,
                                InstitutionID  = dto.InstitutionID,
                                RegistrationID = dto.RegistrationID,
                                FabricBuyingID = dto.BuyingID,
                                ReturnDate     = dto.ReturnDate,
                                Change_Quantity = keepQuantity,
                                BuyingPrice    = keepQuantity
                            },
                            tran,
                            commandType: System.Data.CommandType.StoredProcedure);
                    }

                    tran.Commit();
                    return Ok(new { success = true, message = $"{dto.Items.Count} টি আইটেম সফলভাবে ফেরত দেওয়া হয়েছে" });
                }
                catch { tran.Rollback(); throw; }
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }

        // GET: api/ItemPurchase/return-records?institutionId=&pageSize=100
        [HttpGet("return-records")]
        public IActionResult GetReturnRecords(
            [FromQuery] int institutionId,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 100)
        {
            try
            {
                using var con = _context.CreateConnection();
                var offset = (page - 1) * pageSize;
                var rows = con.Query<dynamic>(@"
                    SELECT r.FabricsBuyingReturnQuantityID AS ReturnID,
                           CONVERT(varchar(10), r.ReturnDate, 23) AS ReturnDate,
                           fb.Buying_SN AS PurchaseSN,
                           f.FabricCode AS ItemCode,
                           f.FabricsName AS ItemName,
                           u.UnitName,
                           r.ReturnBuyingQuantity AS ReturnQuantity,
                           ISNULL(s.SupplierName,'—') AS SupplierName
                    FROM Fabrics_Buying_Return_Quantity r
                    INNER JOIN Fabrics f ON r.FabricID = f.FabricID
                    LEFT JOIN Fabrics_Mesurement_Unit u ON f.FabricMesurementUnitID = u.FabricMesurementUnitID
                    LEFT JOIN Fabrics_Supplier s ON r.FabricsSupplierID = s.FabricsSupplierID
                    LEFT JOIN Fabrics_Buying fb ON r.FabricBuyingID = fb.FabricBuyingID
                    WHERE r.InstitutionID = @InstitutionID
                    ORDER BY r.FabricsBuyingReturnQuantityID DESC
                    OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY",
                    new { InstitutionID = institutionId, Offset = offset, PageSize = pageSize });
                return Ok(new { success = true, data = rows });
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }

        // GET: api/ItemPurchase/report?institutionId=&dateFrom=&dateTo=
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
                        COUNT(DISTINCT fb.FabricBuyingID)               AS TotalPurchases,
                        ISNULL(SUM(fb.BuyingTotalPrice),0)               AS TotalAmount,
                        ISNULL(SUM(fb.BuyingPaidAmount),0)               AS TotalPaid,
                        ISNULL(SUM(fb.BuyingDueAmount),0)                AS TotalDue,
                        ISNULL(SUM(fb.BuyingDiscountAmount),0)           AS TotalDiscount,
                        ISNULL(SUM(bl.BuyingQuantity),0)                 AS TotalQuantity,
                        COUNT(DISTINCT fb.FabricsSupplierID)             AS TotalSuppliers
                    FROM Fabrics_Buying fb
                    LEFT JOIN Fabrics_Buying_List bl ON fb.FabricBuyingID = bl.FabricBuyingID
                    WHERE fb.InstitutionID = @InstitutionID
                      AND (@DateFrom IS NULL OR fb.BuyingDate >= @DateFrom)
                      AND (@DateTo   IS NULL OR fb.BuyingDate <= @DateTo)", p);

                // 2. Return Summary
                var returnSummary = con.QuerySingle<dynamic>(@"
                    SELECT
                        ISNULL(SUM(r.ReturnBuyingQuantity),0)   AS TotalReturnQty,
                        ISNULL(SUM(rp.BuyingReturnPrice),0)     AS TotalReturnPrice,
                        COUNT(DISTINCT r.FabricBuyingID)        AS TotalReturnOrders
                    FROM Fabrics_Buying_Return_Quantity r
                    LEFT JOIN Fabrics_Buying_Return_Price rp
                        ON r.FabricBuyingID = rp.FabricBuyingID
                        AND r.InstitutionID = rp.InstitutionID
                    WHERE r.InstitutionID = @InstitutionID
                      AND (@DateFrom IS NULL OR r.ReturnDate >= @DateFrom)
                      AND (@DateTo   IS NULL OR r.ReturnDate <= @DateTo)", p);

                // 3. Top Purchased Items
                var topItems = con.Query<dynamic>(@"
                    SELECT TOP 10
                        f.FabricCode AS ItemCode, f.FabricsName AS ItemName,
                        u.UnitName,
                        SUM(bl.BuyingQuantity)                          AS TotalQty,
                        ROUND(SUM(bl.BuyingPrice) / NULLIF(SUM(bl.BuyingQuantity),0), 2) AS AvgUnitPrice,
                        SUM(bl.BuyingPrice)                             AS TotalPrice,
                        f.StockFabricQuantity                           AS CurrentStock
                    FROM Fabrics_Buying_List bl
                    INNER JOIN Fabrics_Buying fb  ON bl.FabricBuyingID = fb.FabricBuyingID
                    INNER JOIN Fabrics f          ON bl.FabricID = f.FabricID
                    LEFT  JOIN Fabrics_Mesurement_Unit u ON f.FabricMesurementUnitID = u.FabricMesurementUnitID
                    WHERE bl.InstitutionID = @InstitutionID
                      AND (@DateFrom IS NULL OR fb.BuyingDate >= @DateFrom)
                      AND (@DateTo   IS NULL OR fb.BuyingDate <= @DateTo)
                    GROUP BY f.FabricCode, f.FabricsName, u.UnitName, f.StockFabricQuantity
                    ORDER BY TotalQty DESC", p);

                // 4. Top Suppliers
                var topSuppliers = con.Query<dynamic>(@"
                    SELECT TOP 8
                        s.SupplierName, s.SupplierPhone,
                        COUNT(DISTINCT fb.FabricBuyingID)       AS TotalOrders,
                        ISNULL(SUM(fb.BuyingTotalPrice),0)      AS TotalAmount,
                        ISNULL(SUM(fb.BuyingPaidAmount),0)      AS TotalPaid,
                        ISNULL(SUM(fb.BuyingDueAmount),0)       AS TotalDue
                    FROM Fabrics_Buying fb
                    INNER JOIN Fabrics_Supplier s ON fb.FabricsSupplierID = s.FabricsSupplierID
                    WHERE fb.InstitutionID = @InstitutionID
                      AND (@DateFrom IS NULL OR fb.BuyingDate >= @DateFrom)
                      AND (@DateTo   IS NULL OR fb.BuyingDate <= @DateTo)
                    GROUP BY s.SupplierName, s.SupplierPhone
                    ORDER BY TotalAmount DESC", p);

                // 5. Monthly Trend (last 12 months)
                var monthlyTrend = con.Query<dynamic>(@"
                    SELECT
                        FORMAT(fb.BuyingDate,'yyyy-MM')          AS Month,
                        COUNT(DISTINCT fb.FabricBuyingID)        AS Orders,
                        ISNULL(SUM(fb.BuyingTotalPrice),0)       AS Amount
                    FROM Fabrics_Buying fb
                    WHERE fb.InstitutionID = @InstitutionID
                      AND fb.BuyingDate >= DATEADD(MONTH, -11, DATEFROMPARTS(YEAR(GETDATE()), MONTH(GETDATE()), 1))
                    GROUP BY FORMAT(fb.BuyingDate,'yyyy-MM')
                    ORDER BY Month", new { InstitutionID = institutionId });

                // 6. Return Items Detail
                var returnItems = con.Query<dynamic>(@"
                    SELECT TOP 10
                        f.FabricCode AS ItemCode, f.FabricsName AS ItemName,
                        u.UnitName,
                        SUM(r.ReturnBuyingQuantity) AS TotalReturnQty
                    FROM Fabrics_Buying_Return_Quantity r
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
                    topSuppliers,
                    monthlyTrend,
                    returnItems
                });
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }

        // GET: api/ItemPurchase/suppliers-list?institutionId=
        [HttpGet("suppliers-list")]
        public IActionResult GetSuppliersList([FromQuery] int institutionId)
        {
            try
            {
                using var con = _context.CreateConnection();
                var rows = con.Query<dynamic>(@"
                    SELECT FabricsSupplierID AS SupplierID,
                           ISNULL(SupplierCompanyName,'') AS SupplierCompanyName,
                           SupplierName,
                           ISNULL(SupplierPhone,'')   AS SupplierPhone,
                           ISNULL(SupplierAddress,'') AS SupplierAddress,
                           ISNULL(SupplierTotalAmount,0)    AS TotalAmount,
                           ISNULL(SupplierPaid,0)           AS TotalPaid,
                           ISNULL(SupplierDue,0)            AS TotalDue,
                           ISNULL(TotalReturnFabricsPrice,0) AS TotalReturn
                    FROM Fabrics_Supplier
                    WHERE InstitutionID = @InstitutionID
                    ORDER BY SupplierName",
                    new { InstitutionID = institutionId });
                return Ok(new { success = true, data = rows });
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }

        // PUT: api/ItemPurchase/update-supplier
        [HttpPut("update-supplier")]
        public IActionResult UpdateSupplier([FromBody] UpdateSupplierDto dto)
        {
            try
            {
                using var con = _context.CreateConnection();
                con.Execute(@"
                    UPDATE Fabrics_Supplier
                    SET SupplierName        = @SupplierName,
                        SupplierPhone       = @SupplierPhone,
                        SupplierAddress     = @SupplierAddress,
                        SupplierCompanyName = @SupplierCompanyName
                    WHERE FabricsSupplierID = @SupplierID AND InstitutionID = @InstitutionID",
                    new {
                        dto.SupplierID, dto.InstitutionID,
                        dto.SupplierName, dto.SupplierPhone,
                        dto.SupplierAddress, dto.SupplierCompanyName
                    });
                return Ok(new { success = true, message = "সাপ্লায়ার আপডেট হয়েছে" });
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }

        // DELETE: api/ItemPurchase/delete-supplier?supplierId=&institutionId=
        [HttpDelete("delete-supplier")]
        public IActionResult DeleteSupplier([FromQuery] int supplierId, [FromQuery] int institutionId)
        {
            try
            {
                using var con = _context.CreateConnection();
                var hasBuying = con.ExecuteScalar<int>(
                    "SELECT COUNT(*) FROM Fabrics_Buying WHERE FabricsSupplierID=@ID AND InstitutionID=@InstitutionID",
                    new { ID = supplierId, InstitutionID = institutionId });
                if (hasBuying > 0)
                    return Ok(new { success = false, message = "এই সাপ্লায়ারের ক্রয় রেকর্ড আছে, ডিলিট করা যাবে না" });

                con.Execute(
                    "DELETE FROM Fabrics_Supplier WHERE FabricsSupplierID=@ID AND InstitutionID=@InstitutionID",
                    new { ID = supplierId, InstitutionID = institutionId });
                return Ok(new { success = true, message = "সাপ্লায়ার ডিলিট হয়েছে" });
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }

        // GET: api/ItemPurchase/supplier-details?supplierId=&institutionId=
        [HttpGet("supplier-details")]
        public IActionResult GetSupplierDetails([FromQuery] int supplierId, [FromQuery] int institutionId)
        {
            try
            {
                using var con = _context.CreateConnection();
                var info = con.QueryFirstOrDefault<dynamic>(@"
                    SELECT FabricsSupplierID AS SupplierID,
                           ISNULL(SupplierCompanyName,'') AS SupplierCompanyName,
                           SupplierName,
                           ISNULL(SupplierPhone,'')   AS SupplierPhone,
                           ISNULL(SupplierAddress,'') AS SupplierAddress,
                           ISNULL(SupplierTotalAmount,0)    AS TotalAmount,
                           ISNULL(SupplierPaid,0)           AS TotalPaid,
                           ISNULL(SupplierDue,0)            AS TotalDue,
                           ISNULL(TotalReturnFabricsPrice,0) AS TotalReturn
                    FROM Fabrics_Supplier
                    WHERE FabricsSupplierID=@SupplierID AND InstitutionID=@InstitutionID",
                    new { SupplierID = supplierId, InstitutionID = institutionId });

                if (info == null)
                    return Ok(new { success = false, message = "সাপ্লায়ার পাওয়া যায়নি" });

                // Due purchases
                var duePurchases = con.Query<dynamic>(@"
                    SELECT FabricBuyingID, Buying_SN AS PurchaseSN,
                           ISNULL(BillNo,'') AS BillNo,
                           ISNULL(BuyingTotalPrice,0)    AS TotalPrice,
                           ISNULL(BuyingDiscountAmount,0) AS DiscountAmount,
                           ISNULL(BuyingReturnAmount,0)  AS ReturnAmount,
                           ISNULL(BuyingPaidAmount,0)    AS PaidAmount,
                           ISNULL(BuyingDueAmount,0)     AS DueAmount,
                           CONVERT(varchar(10),BuyingDate,23) AS BuyingDate
                    FROM Fabrics_Buying
                    WHERE FabricsSupplierID=@SupplierID AND InstitutionID=@InstitutionID
                      AND BuyingPaymentStatus='Due'
                    ORDER BY FabricBuyingID DESC",
                    new { SupplierID = supplierId, InstitutionID = institutionId });

                // Payment history
                var payHistory = con.Query<dynamic>(@"
                    SELECT TOP 20
                        pr.BuyingPaidAmount AS PaidAmount,
                        CONVERT(varchar(10), pr.BuyingPaid_Date, 23) AS PaidDate,
                        pr.Payment_Situation AS Situation,
                        ISNULL(a.AccountName,'') AS AccountName,
                        fb.Buying_SN AS PurchaseSN
                    FROM Fabrics_Buying_PaymentRecord pr
                    LEFT JOIN Account a ON pr.AccountID = a.AccountID
                    LEFT JOIN Fabrics_Buying fb ON pr.FabricBuyingID = fb.FabricBuyingID
                    WHERE pr.FabricsSupplierID=@SupplierID AND pr.InstitutionID=@InstitutionID
                    ORDER BY pr.BuyingPaid_Date DESC",
                    new { SupplierID = supplierId, InstitutionID = institutionId });

                // Accounts
                var accounts = con.Query<dynamic>(@"
                    SELECT AccountID,
                           AccountName + ' (' + CONVERT(VARCHAR,CAST(AccountBalance AS DECIMAL(18,2))) + ' Tk)' AS AccountName,
                           CAST(Default_Status AS BIT) AS IsDefault
                    FROM Account
                    WHERE InstitutionID=@InstitutionID
                    ORDER BY Default_Status DESC, AccountName",
                    new { InstitutionID = institutionId });

                return Ok(new { success = true, info, duePurchases, payHistory, accounts });
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }

        // POST: api/ItemPurchase/pay-due
        [HttpPost("pay-due")]
        public IActionResult PayDue([FromBody] PayDueDto dto)
        {
            if (dto.Payments == null || dto.Payments.Count == 0)
                return BadRequest(new { success = false, message = "কোনো পেমেন্ট নেই" });
            try
            {
                using var con = _context.CreateConnection();
                con.Open();
                using var tran = con.BeginTransaction();
                try
                {
                    int paidCount = 0;
                    foreach (var pay in dto.Payments)
                    {
                        if (pay.PaidAmount <= 0) continue;

                        var due = con.ExecuteScalar<double>(
                            "SELECT ISNULL(BuyingDueAmount,0) FROM Fabrics_Buying WHERE FabricBuyingID=@ID AND InstitutionID=@InstitutionID",
                            new { ID = pay.BuyingId, InstitutionID = dto.InstitutionID }, tran);

                        if (pay.PaidAmount > due)
                            return Ok(new { success = false, message = $"পেমেন্ট (৳{pay.PaidAmount}) বাকির (৳{due}) চেয়ে বেশি হতে পারবে না" });

                        con.Execute(@"
                            INSERT INTO Fabrics_Buying_PaymentRecord
                                (FabricBuyingID, RegistrationID, InstitutionID, FabricsSupplierID,
                                 BuyingPaidAmount, AccountID, Payment_Situation, BuyingPaid_Date, InsertDate)
                            VALUES
                                (@BuyingId, @RegistrationID, @InstitutionID, @SupplierID,
                                 @PaidAmount, NULLIF(@AccountID,0), 'Supplier Due Paid', @PayDate, GETDATE())",
                            new {
                                pay.BuyingId, dto.RegistrationID, dto.InstitutionID,
                                dto.SupplierID, pay.PaidAmount, dto.AccountID,
                                PayDate = dto.PayDate
                            }, tran);
                        paidCount++;
                    }

                    tran.Commit();
                    return Ok(new { success = true, message = $"{paidCount} টি পেমেন্ট সফলভাবে সম্পন্ন হয়েছে" });
                }
                catch { tran.Rollback(); throw; }
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }

        // ─── DAMAGE APIs ──────────────────────────────────────────────────────

        // GET: api/ItemPurchase/fabric-stock-list?institutionId=&prefix=
        [HttpGet("fabric-stock-list")]
        public IActionResult GetFabricStockList([FromQuery] int institutionId, [FromQuery] string prefix = "")
        {
            try
            {
                using var con = _context.CreateConnection();
                var sql = string.IsNullOrWhiteSpace(prefix)
                    ? @"SELECT TOP(50) f.FabricID, f.FabricCode, f.FabricsName,
                               f.StockFabricQuantity AS StockQty,
                               f.SellingUnitPrice,
                               f.CurrentBuyingUnitPrice AS BuyingUnitPrice,
                               u.UnitName
                        FROM Fabrics f
                        LEFT JOIN Fabrics_Mesurement_Unit u ON f.FabricMesurementUnitID = u.FabricMesurementUnitID
                        WHERE f.InstitutionID = @InstitutionID AND f.StockFabricQuantity > 0
                        ORDER BY f.FabricCode"
                    : @"SELECT TOP(10) f.FabricID, f.FabricCode, f.FabricsName,
                               f.StockFabricQuantity AS StockQty,
                               f.SellingUnitPrice,
                               f.CurrentBuyingUnitPrice AS BuyingUnitPrice,
                               u.UnitName
                        FROM Fabrics f
                        LEFT JOIN Fabrics_Mesurement_Unit u ON f.FabricMesurementUnitID = u.FabricMesurementUnitID
                        WHERE f.InstitutionID = @InstitutionID AND f.StockFabricQuantity > 0
                          AND (f.FabricCode LIKE @Prefix + '%' OR f.FabricsName LIKE '%' + @Prefix + '%')
                        ORDER BY f.FabricCode";

                var rows = con.Query<dynamic>(sql, new { InstitutionID = institutionId, Prefix = prefix });
                return Ok(new { success = true, data = rows });
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }

        // GET: api/ItemPurchase/damage-records?institutionId=&page=&pageSize=&dateFrom=&dateTo=&fabricCode=
        [HttpGet("damage-records")]
        public IActionResult GetDamageRecords(
            [FromQuery] int institutionId,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 30,
            [FromQuery] string? dateFrom = null,
            [FromQuery] string? dateTo   = null,
            [FromQuery] string? fabricCode = null)
        {
            try
            {
                using var con = _context.CreateConnection();
                var offset = (page - 1) * pageSize;

                var where = "WHERE d.InstitutionID = @InstitutionID";
                if (!string.IsNullOrWhiteSpace(dateFrom))   where += " AND d.Damage_Date >= @DateFrom";
                if (!string.IsNullOrWhiteSpace(dateTo))     where += " AND d.Damage_Date <= @DateTo";
                if (!string.IsNullOrWhiteSpace(fabricCode)) where += " AND (f.FabricCode LIKE '%'+@FabricCode+'%' OR f.FabricsName LIKE '%'+@FabricCode+'%')";

                var sql = $@"
                    SELECT d.FabricsDamageID AS DamageID,
                           f.FabricCode, f.FabricsName AS FabricName,
                           u.UnitName,
                           d.DamageQuantity,
                           ISNULL(d.DamageFabricsPrice, 0) AS DamagePrice,
                           CONVERT(varchar(10), d.Damage_Date, 23) AS DamageDate
                    FROM Fabrics_Damage d
                    INNER JOIN Fabrics f ON d.FabricID = f.FabricID
                    LEFT  JOIN Fabrics_Mesurement_Unit u ON f.FabricMesurementUnitID = u.FabricMesurementUnitID
                    {where}
                    ORDER BY d.FabricsDamageID DESC
                    OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY";

                var countSql = $@"SELECT COUNT(*) FROM Fabrics_Damage d
                    INNER JOIN Fabrics f ON d.FabricID = f.FabricID {where}";

                var sumSql = $@"
                    SELECT ISNULL(SUM(d.DamageQuantity),0) AS TotalQty,
                           ISNULL(SUM(d.DamageFabricsPrice),0) AS TotalPrice,
                           COUNT(*) AS TotalRecords
                    FROM Fabrics_Damage d
                    INNER JOIN Fabrics f ON d.FabricID = f.FabricID {where}";

                var param = new { InstitutionID = institutionId, Offset = offset, PageSize = pageSize,
                                  DateFrom = dateFrom, DateTo = dateTo, FabricCode = fabricCode };

                var rows    = con.Query<dynamic>(sql, param);
                var total   = con.ExecuteScalar<int>(countSql, param);
                var summary = con.QuerySingle<dynamic>(sumSql, param);

                return Ok(new
                {
                    success    = true,
                    data       = rows,
                    totalCount = total,
                    totalPages = (int)Math.Ceiling((double)total / pageSize),
                    summary
                });
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }

        // GET: api/ItemPurchase/damage-summary?institutionId=
        [HttpGet("damage-summary")]
        public IActionResult GetDamageSummary([FromQuery] int institutionId)
        {
            try
            {
                using var con = _context.CreateConnection();

                var summary = con.QuerySingle<dynamic>(@"
                    SELECT
                        COUNT(*)                                         AS TotalRecords,
                        ISNULL(SUM(d.DamageQuantity),0)                 AS TotalQty,
                        ISNULL(SUM(d.DamageFabricsPrice),0)             AS TotalPrice,
                        COUNT(DISTINCT d.FabricID)                      AS TotalFabrics,
                        ISNULL(SUM(CASE WHEN MONTH(d.Damage_Date)=MONTH(GETDATE())
                                        AND YEAR(d.Damage_Date)=YEAR(GETDATE())
                                        THEN d.DamageFabricsPrice ELSE 0 END), 0) AS ThisMonthPrice
                    FROM Fabrics_Damage d
                    WHERE d.InstitutionID = @InstitutionID",
                    new { InstitutionID = institutionId });

                // Top damaged fabrics
                var topFabrics = con.Query<dynamic>(@"
                    SELECT TOP 5
                        f.FabricCode, f.FabricsName AS FabricName,
                        u.UnitName,
                        SUM(d.DamageQuantity)       AS TotalQty,
                        SUM(d.DamageFabricsPrice)   AS TotalPrice,
                        f.StockFabricQuantity        AS CurrentStock
                    FROM Fabrics_Damage d
                    INNER JOIN Fabrics f ON d.FabricID = f.FabricID
                    LEFT  JOIN Fabrics_Mesurement_Unit u ON f.FabricMesurementUnitID = u.FabricMesurementUnitID
                    WHERE d.InstitutionID = @InstitutionID
                    GROUP BY f.FabricCode, f.FabricsName, u.UnitName, f.StockFabricQuantity
                    ORDER BY TotalQty DESC",
                    new { InstitutionID = institutionId });

                return Ok(new { success = true, summary, topFabrics });
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }

        // POST: api/ItemPurchase/add-damage
        [HttpPost("add-damage")]
        public IActionResult AddDamage([FromBody] DamageDto dto)
        {
            if (dto.FabricID <= 0)
                return BadRequest(new { success = false, message = "কাপড় সিলেক্ট করুন" });
            if (dto.DamageQuantity <= 0)
                return BadRequest(new { success = false, message = "পরিমাণ ০ এর বেশি হতে হবে" });

            try
            {
                using var con = _context.CreateConnection();

                // Stock check
                var stock = con.ExecuteScalar<double>(
                    "SELECT ISNULL(StockFabricQuantity,0) FROM Fabrics WHERE FabricID=@FabricID AND InstitutionID=@InstitutionID",
                    new { dto.FabricID, dto.InstitutionID });

                if (dto.DamageQuantity > stock)
                    return Ok(new { success = false, message = $"বর্তমান স্টক ({stock}) এর বেশি ক্ষতির পরিমাণ দেওয়া যাবে না" });

                con.Execute(@"
                    INSERT INTO Fabrics_Damage
                        (FabricID, InstitutionID, RegistrationID, DamageQuantity, DamageFabricsPrice, Damage_Date)
                    VALUES
                        (@FabricID, @InstitutionID, @RegistrationID, @DamageQuantity, @DamagePrice, ISNULL(@DamageDate, GETDATE()))",
                    new
                    {
                        dto.FabricID, dto.InstitutionID, dto.RegistrationID,
                        dto.DamageQuantity, dto.DamagePrice,
                        DamageDate = string.IsNullOrWhiteSpace(dto.DamageDate) ? (object)DBNull.Value : dto.DamageDate
                    });

                // Return updated stock
                var newStock = con.ExecuteScalar<double>(
                    "SELECT ISNULL(StockFabricQuantity,0) FROM Fabrics WHERE FabricID=@FabricID",
                    new { dto.FabricID });

                return Ok(new { success = true, message = "ক্ষতির রেকর্ড যোগ হয়েছে", newStock });
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }

        // DELETE: api/ItemPurchase/delete-damage?damageId=&institutionId=
        [HttpDelete("delete-damage")]
        public IActionResult DeleteDamage([FromQuery] int damageId, [FromQuery] int institutionId)
        {
            try
            {
                using var con = _context.CreateConnection();
                con.Execute(
                    "DELETE FROM Fabrics_Damage WHERE FabricsDamageID=@ID AND InstitutionID=@InstitutionID",
                    new { ID = damageId, InstitutionID = institutionId });
                return Ok(new { success = true, message = "রেকর্ড ডিলিট হয়েছে" });
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }

    }

    // ─── DTOs ─────────────────────────────────────────────────────────────────
    public class SupplierDto
    {
        public int InstitutionID { get; set; }
        public int RegistrationID { get; set; }
        public string SupplierName { get; set; } = string.Empty;
        public string? SupplierPhone { get; set; }
        public string? SupplierAddress { get; set; }
        public string? SupplierCompanyName { get; set; }
    }

    public class PurchaseItemDto
    {
        public int ItemID { get; set; }
        public string ItemCode { get; set; } = string.Empty;
        public string ItemName { get; set; } = string.Empty;
        public int UnitID { get; set; }
        public int BrandID { get; set; }
        public int CategoryID { get; set; }
        public double SellingUnitPrice { get; set; }
        public double BuyingUnitPrice { get; set; }
        public double Quantity { get; set; }
        public double TotalPrice { get; set; }
    }

    public class PurchaseSubmitDto
    {
        public int InstitutionID { get; set; }
        public int RegistrationID { get; set; }
        public int SupplierID { get; set; }
        public int AccountID { get; set; }
        public string? BillNo { get; set; }
        public DateTime BuyingDate { get; set; }
        public double PaidAmount { get; set; }
        public double DiscountAmount { get; set; }
        public bool UpdateBuyingPrice { get; set; } = true;
        public List<PurchaseItemDto> Items { get; set; } = new();
    }

    public class PurchaseReturnItemDto
    {
        public int ItemID { get; set; }
        public string ItemCode { get; set; } = string.Empty;
        public int BuyingListID { get; set; }
        public double ReturnQuantity { get; set; }
    }

    public class PurchaseReturnDto
    {
        public int InstitutionID { get; set; }
        public int RegistrationID { get; set; }
        public int BuyingID { get; set; }
        public int SupplierID { get; set; }
        public DateTime ReturnDate { get; set; }
        public List<PurchaseReturnItemDto> Items { get; set; } = new();
    }

    public class UpdateSupplierDto
    {
        public int    SupplierID          { get; set; }
        public int    InstitutionID       { get; set; }
        public string SupplierName        { get; set; } = string.Empty;
        public string? SupplierPhone      { get; set; }
        public string? SupplierAddress    { get; set; }
        public string? SupplierCompanyName { get; set; }
    }

    public class DuePaymentItemDto
    {
        public int    BuyingId    { get; set; }
        public double PaidAmount  { get; set; }
    }

    public class PayDueDto
    {
        public int    InstitutionID  { get; set; }
        public int    RegistrationID { get; set; }
        public int    SupplierID     { get; set; }
        public int    AccountID      { get; set; }
        public string PayDate        { get; set; } = "";
        public List<DuePaymentItemDto> Payments { get; set; } = new();
    }

    public class DamageDto
    {
        public int    InstitutionID  { get; set; }
        public int    RegistrationID { get; set; }
        public int    FabricID       { get; set; }
        public double DamageQuantity { get; set; }
        public double DamagePrice    { get; set; }
        public string? DamageDate   { get; set; }
    }
}
