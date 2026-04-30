using Microsoft.AspNetCore.Mvc;
using System.Data;
using System.Data.SqlClient;
using TailorBD.API.Data;
using TailorBD.API.Models;
using Dapper;

namespace TailorBD.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DressController : ControllerBase
    {
        private readonly TailorBdContext _context;

        public DressController(TailorBdContext context)
        {
            _context = context;
        }

        // GET: api/Dress/list
        [HttpGet("list")]
        public IActionResult GetDressesByClothFor([FromQuery] int institutionId, [FromQuery] int clothForId)
        {
            try
            {
                using var connection = _context.CreateConnection();
                var query = @"SELECT DressID, Dress_Name, Cloth_For_ID, 
                            CASE WHEN EXISTS (
                                SELECT 1 FROM Measurement_Type 
                                WHERE Measurement_Type.DressID = Dress.DressID
                            ) THEN CAST(1 AS BIT) ELSE CAST(0 AS BIT) END AS IsMeasurementAvailable
                            FROM Dress 
                            WHERE InstitutionID = @InstitutionID 
                            AND Cloth_For_ID = @Cloth_For_ID
                            ORDER BY ISNULL(DressSerial, 99999)";

                var dresses = connection.Query<DressListDto>(query, new { InstitutionID = institutionId, Cloth_For_ID = clothForId });

                return Ok(new { success = true, data = dresses });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        // GET: api/Dress/{institutionId}
        [HttpGet("{institutionId}")]
        public IActionResult GetDresses(int institutionId)
        {
            try
            {
                using var connection = _context.CreateConnection();
                var query = @"SELECT DressID, Dress_Name, Cloth_For_ID, RegistrationID, InstitutionID, 
                            Description, Date, Image, DressSerial 
                            FROM Dress 
                            WHERE InstitutionID = @InstitutionID 
                            ORDER BY ISNULL(DressSerial, 99999)";

                var dresses = connection.Query(query, new { InstitutionID = institutionId });

                return Ok(new { success = true, data = dresses });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        // GET: api/Dress/single/{dressId}
        [HttpGet("single/{dressId}")]
        public IActionResult GetDress(int dressId)
        {
            try
            {
                using var connection = _context.CreateConnection();
                var query = @"SELECT DressID, Dress_Name, Cloth_For_ID, RegistrationID, InstitutionID, 
                            Description, Date, Image, DressSerial 
                            FROM Dress 
                            WHERE DressID = @DressID";

                var dress = connection.QueryFirstOrDefault(query, new { DressID = dressId });

                if (dress == null)
                {
                    return NotFound(new { success = false, message = "পোষাক পাওয়া যায়নি" });
                }

                return Ok(new { success = true, data = dress });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        // POST: api/Dress
        [HttpPost]
        public IActionResult CreateDress([FromBody] DressCreateModel model)
        {
            try
            {
                using var connection = _context.CreateConnection();
                var query = @"INSERT INTO Dress(Dress_Name, Cloth_For_ID, RegistrationID, InstitutionID, Date, DressSerial) 
                            VALUES (@Dress_Name, @Cloth_For_ID, @RegistrationID, @InstitutionID, GETDATE(), @DressSerial);
                            SELECT CAST(SCOPE_IDENTITY() as int)";

                var dressId = connection.ExecuteScalar<int>(query, model);

                return Ok(new { success = true, message = "????? ??????? ????? ??????", data = new { dressId } });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        // PUT: api/Dress/{id}
        [HttpPut("{id}")]
        public IActionResult UpdateDress(int id, [FromBody] DressUpdateModel model)
        {
            try
            {
                using var connection = _context.CreateConnection();
                var query = @"UPDATE Dress 
                            SET Dress_Name = @Dress_Name 
                            WHERE DressID = @DressID AND InstitutionID = @InstitutionID";

                connection.Execute(query, new { Dress_Name = model.Dress_Name, DressID = id, InstitutionID = model.InstitutionID });

                return Ok(new { success = true, message = "????? ??????? ????? ??????" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        // DELETE: api/Dress/{id}/{institutionId}
        [HttpDelete("{id}/{institutionId}")]
        public IActionResult DeleteDress(int id, int institutionId)
        {
            try
            {
                using var connection = _context.CreateConnection();
                var query = @"DELETE FROM Dress WHERE DressID = @DressID AND InstitutionID = @InstitutionID";

                connection.Execute(query, new { DressID = id, InstitutionID = institutionId });

                return Ok(new { success = true, message = "????? ??????? ????? ??????" });
            }
            catch (SqlException ex) when (ex.Number == 547) // Foreign key constraint
            {
                return BadRequest(new { success = false, message = "???? ?? ????? ?? ????? ???? ?????? ??! ???? ?? ??????? ??????!" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        // POST: api/Dress/{id}/image
        [HttpPost("{id}/image")]
        public async Task<IActionResult> UploadDressImage(int id, IFormFile image)
        {
            try
            {
                if (image == null || image.Length == 0)
                    return BadRequest(new { success = false, message = "??? ???????? ????" });

                // Validate file type
                var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif" };
                var extension = Path.GetExtension(image.FileName).ToLower();
                
                if (!allowedExtensions.Contains(extension))
                    return BadRequest(new { success = false, message = "????????? JPG, PNG ??? GIF ??? ????????" });

                // Read and resize image
                using var memoryStream = new MemoryStream();
                await image.CopyToAsync(memoryStream);
                memoryStream.Position = 0;

                byte[] imageBytes = ResizeImage(memoryStream.ToArray(), 400, 400);

                // Update database
                using var connection = _context.CreateConnection();
                var query = @"UPDATE Dress SET Image = @Image WHERE DressID = @DressID";

                connection.Execute(query, new { Image = imageBytes, DressID = id });

                return Ok(new { success = true, message = "??? ??????? ????? ??????" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        // GET: api/Dress/{id}/image
        [HttpGet("{id}/image")]
        public IActionResult GetDressImage(int id)
        {
            try
            {
                using var connection = _context.CreateConnection();
                var query = @"SELECT Image FROM Dress WHERE DressID = @DressID";

                var imageBytes = connection.ExecuteScalar<byte[]>(query, new { DressID = id });

                if (imageBytes == null || imageBytes.Length == 0)
                    return NotFound();

                return File(imageBytes, "image/jpeg");
            }
            catch
            {
                return NotFound();
            }
        }

        // PUT: api/Dress/update-serials
        [HttpPut("update-serials")]
        public IActionResult UpdateSerials([FromBody] List<DressSerialUpdateModel> serials)
        {
            try
            {
                using var connection = _context.CreateConnection();
                foreach (var item in serials)
                {
                    var query = @"UPDATE Dress SET DressSerial = @DressSerial 
                                WHERE DressID = @DressID AND InstitutionID = @InstitutionID";

                    connection.Execute(query, item);
                }

                return Ok(new { success = true, message = "???????? ??????? ????? ??????" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        // GET: api/Dress/cloth-for-list
        [HttpGet("cloth-for-list")]
        public IActionResult GetClothForList()
        {
            try
            {
                using var connection = _context.CreateConnection();
                var query = @"SELECT * FROM Cloth_For";
                var clothForList = connection.Query(query);

                return Ok(new { success = true, data = clothForList });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        // GET: api/Dress/{dressId}/style-categories
        [HttpGet("{dressId}/style-categories")]
        public IActionResult GetStyleCategories(int dressId, [FromQuery] int institutionId)
        {
            try
            {
                using var connection = _context.CreateConnection();
                var query = @"SELECT Dress_Style_CategoryID, RegistrationID, InstitutionID, DressID, 
                            Dress_Style_Category_Name, Date, CategorySerial 
                            FROM Dress_Style_Category 
                            WHERE DressID = @DressID AND InstitutionID = @InstitutionID 
                            ORDER BY ISNULL(CategorySerial, 99999)";

                var categories = connection.Query(query, new { DressID = dressId, InstitutionID = institutionId });

                return Ok(new { success = true, data = categories });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        // POST: api/Dress/style-category
        [HttpPost("style-category")]
        public IActionResult CreateStyleCategory([FromBody] StyleCategoryCreateModel model)
        {
            try
            {
                using var connection = _context.CreateConnection();
                var query = @"INSERT INTO Dress_Style_Category(RegistrationID, InstitutionID, DressID, 
                            Dress_Style_Category_Name, CategorySerial, Date) 
                            VALUES (@RegistrationID, @InstitutionID, @DressID, @DressStyleCategoryName, @CategorySerial, GETDATE());
                            SELECT CAST(SCOPE_IDENTITY() as int)";

                var categoryId = connection.ExecuteScalar<int>(query, new
                {
                    RegistrationID = model.RegistrationID,
                    InstitutionID = model.InstitutionID,
                    DressID = model.DressID,
                    DressStyleCategoryName = model.DressStyleCategoryName,
                    CategorySerial = model.CategorySerial
                });

                return Ok(new { success = true, message = "ক্যাটাগরি সফলভাবে যুক্ত হয়েছে", data = new { categoryId } });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        // PUT: api/Dress/style-category/{id}
        [HttpPut("style-category/{id}")]
        public IActionResult UpdateStyleCategory(int id, [FromBody] StyleCategoryUpdateModel model)
        {
            try
            {
                using var connection = _context.CreateConnection();
                var query = @"UPDATE Dress_Style_Category 
                            SET Dress_Style_Category_Name = @DressStyleCategoryName 
                            WHERE Dress_Style_CategoryID = @CategoryID AND InstitutionID = @InstitutionID";

                connection.Execute(query, new
                {
                    DressStyleCategoryName = model.DressStyleCategoryName,
                    CategoryID = id,
                    InstitutionID = model.InstitutionID
                });

                return Ok(new { success = true, message = "ক্যাটাগরি সফলভাবে আপডেট হয়েছে" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        // DELETE: api/Dress/style-category/{id}
        [HttpDelete("style-category/{id}")]
        public IActionResult DeleteStyleCategory(int id, [FromQuery] int institutionId)
        {
            try
            {
                using var connection = _context.CreateConnection();
                var query = @"DELETE FROM Dress_Style_Category 
                            WHERE Dress_Style_CategoryID = @CategoryID AND InstitutionID = @InstitutionID";

                connection.Execute(query, new { CategoryID = id, InstitutionID = institutionId });

                return Ok(new { success = true, message = "ক্যাটাগরি সফলভাবে ডিলিট হয়েছে" });
            }
            catch (SqlException ex) when (ex.Number == 547) // Foreign key constraint
            {
                return BadRequest(new { success = false, message = "এই ক্যাটাগরিতে ডিজাইন আছে। প্রথমে ডিজাইনগুলো ডিলিট করুন!" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        // GET: api/Dress/style-category/{id}
        [HttpGet("style-category/{id}")]
        public IActionResult GetStyleCategory(int id, [FromQuery] int institutionId)
        {
            try
            {
                using var connection = _context.CreateConnection();
                var query = @"SELECT Dress_Style_CategoryID, RegistrationID, InstitutionID, DressID, 
                            Dress_Style_Category_Name, Date, CategorySerial 
                            FROM Dress_Style_Category 
                            WHERE Dress_Style_CategoryID = @CategoryID AND InstitutionID = @InstitutionID";

                var category = connection.QueryFirstOrDefault(query, new { CategoryID = id, InstitutionID = institutionId });

                if (category == null)
                {
                    return NotFound(new { success = false, message = "ক্যাটাগরি পাওয়া যায়নি" });
                }

                return Ok(new { success = true, data = category });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        // GET: api/Dress/style-designs/{categoryId}
        [HttpGet("style-designs/{categoryId}")]
        public IActionResult GetStyleDesigns(int categoryId, [FromQuery] int institutionId)
        {
            try
            {
                using var connection = _context.CreateConnection();
                var query = @"SELECT Dress_StyleID, Dress_Style_CategoryID, RegistrationID, InstitutionID, 
                            DressID, Dress_Style_Name, Dress_Style_Image, Dress_Style_Description, StyleSerial 
                            FROM Dress_Style 
                            WHERE Dress_Style_CategoryID = @CategoryID AND InstitutionID = @InstitutionID 
                            ORDER BY ISNULL(StyleSerial, 99999)";

                var designs = connection.Query(query, new { CategoryID = categoryId, InstitutionID = institutionId });

                return Ok(new { success = true, data = designs });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        // POST: api/Dress/style-design
        [HttpPost("style-design")]
        public IActionResult CreateStyleDesign([FromBody] StyleDesignCreateModel model)
        {
            try
            {
                using var connection = _context.CreateConnection();
                var query = @"INSERT INTO Dress_Style(Dress_Style_CategoryID, RegistrationID, InstitutionID, 
                            DressID, Dress_Style_Name, StyleSerial) 
                            VALUES (@DressStyleCategoryID, @RegistrationID, @InstitutionID, @DressID, 
                            @DressStyleName, @StyleSerial);
                            SELECT CAST(SCOPE_IDENTITY() as int)";

                var designId = connection.ExecuteScalar<int>(query, new
                {
                    DressStyleCategoryID = model.DressStyleCategoryID,
                    RegistrationID = model.RegistrationID,
                    InstitutionID = model.InstitutionID,
                    DressID = model.DressID,
                    DressStyleName = model.DressStyleName,
                    StyleSerial = model.StyleSerial
                });

                return Ok(new { success = true, message = "ডিজাইন সফলভাবে যুক্ত হয়েছে", data = new { designId } });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        // PUT: api/Dress/style-design/{id}
        [HttpPut("style-design/{id}")]
        public IActionResult UpdateStyleDesign(int id, [FromBody] StyleDesignUpdateModel model)
        {
            try
            {
                using var connection = _context.CreateConnection();
                var query = @"UPDATE Dress_Style 
                            SET Dress_Style_Name = @DressStyleName 
                            WHERE Dress_StyleID = @DesignID AND InstitutionID = @InstitutionID";

                connection.Execute(query, new
                {
                    DressStyleName = model.DressStyleName,
                    DesignID = id,
                    InstitutionID = model.InstitutionID
                });

                return Ok(new { success = true, message = "ডিজাইন সফলভাবে আপডেট হয়েছে" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        // DELETE: api/Dress/style-design/{id}
        [HttpDelete("style-design/{id}")]
        public IActionResult DeleteStyleDesign(int id, [FromQuery] int institutionId)
        {
            try
            {
                using var connection = _context.CreateConnection();
                var query = @"DELETE FROM Dress_Style 
                            WHERE Dress_StyleID = @DesignID AND InstitutionID = @InstitutionID";

                connection.Execute(query, new { DesignID = id, InstitutionID = institutionId });

                return Ok(new { success = true, message = "ডিজাইন সফলভাবে ডিলিট হয়েছে" });
            }
            catch (SqlException ex) when (ex.Number == 547) // Foreign key constraint
            {
                return BadRequest(new { success = false, message = "এই ডিজাইন ব্যবহার হচ্ছে। ডিলিট করা যাবে না!" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        // POST: api/Dress/style-design/{id}/image
        [HttpPost("style-design/{id}/image")]
        public async Task<IActionResult> UploadStyleDesignImage(int id, IFormFile image)
        {
            try
            {
                if (image == null || image.Length == 0)
                    return BadRequest(new { success = false, message = "ছবি নির্বাচন করুন" });

                // Validate file type
                var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif" };
                var extension = Path.GetExtension(image.FileName).ToLower();
                
                if (!allowedExtensions.Contains(extension))
                    return BadRequest(new { success = false, message = "শুধুমাত্র JPG, PNG বা GIF ছবি গ্রহণযোগ্য" });

                // Read and resize image
                using var memoryStream = new MemoryStream();
                await image.CopyToAsync(memoryStream);
                memoryStream.Position = 0;

                byte[] imageBytes = ResizeImage(memoryStream.ToArray(), 400, 400);

                // Update database
                using var connection = _context.CreateConnection();
                var query = @"UPDATE Dress_Style SET Dress_Style_Image = @Image WHERE Dress_StyleID = @DesignID";

                connection.Execute(query, new { Image = imageBytes, DesignID = id });

                return Ok(new { success = true, message = "ছবি সফলভাবে যুক্ত হয়েছে" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        // GET: api/Dress/style-design/{id}/image
        [HttpGet("style-design/{id}/image")]
        public IActionResult GetStyleDesignImage(int id)
        {
            try
            {
                using var connection = _context.CreateConnection();
                var query = @"SELECT Dress_Style_Image FROM Dress_Style WHERE Dress_StyleID = @DesignID";

                var imageBytes = connection.ExecuteScalar<byte[]>(query, new { DesignID = id });

                if (imageBytes == null || imageBytes.Length == 0)
                    return NotFound();

                return File(imageBytes, "image/jpeg");
            }
            catch
            {
                return NotFound();
            }
        }

        // PUT: api/Dress/style-category/update-serials
        [HttpPut("style-category/update-serials")]
        public IActionResult UpdateCategorySerials([FromBody] CategorySerialUpdateRequest request)
        {
            try
            {
                using var connection = _context.CreateConnection();
                foreach (var item in request.Updates)
                {
                    var query = @"UPDATE Dress_Style_Category SET CategorySerial = @Serial 
                                WHERE Dress_Style_CategoryID = @CategoryId AND InstitutionID = @InstitutionID";

                    connection.Execute(query, new
                    {
                        Serial = item.Serial,
                        CategoryId = item.CategoryId,
                        InstitutionID = request.InstitutionId
                    });
                }

                return Ok(new { success = true, message = "সিরিয়াল সফলভাবে আপডেট হয়েছে" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        // PUT: api/Dress/style-design/update-serials
        [HttpPut("style-design/update-serials")]
        public IActionResult UpdateDesignSerials([FromBody] DesignSerialUpdateRequest request)
        {
            try
            {
                using var connection = _context.CreateConnection();
                foreach (var item in request.Updates)
                {
                    var query = @"UPDATE Dress_Style SET StyleSerial = @Serial 
                                WHERE Dress_StyleID = @DesignID AND InstitutionID = @InstitutionID";

                    connection.Execute(query, new
                    {
                        Serial = item.Serial,
                        DesignID = item.DesignId,
                        InstitutionID = request.InstitutionId
                    });
                }

                return Ok(new { success = true, message = "সিরিয়াল সফলভাবে আপডেট হয়েছে" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        // Helper method to resize image
        private byte[] ResizeImage(byte[] imageBytes, int maxWidth, int maxHeight)
        {
            using var ms = new MemoryStream(imageBytes);
            using var image = System.Drawing.Image.FromStream(ms);

            int imageHeight = image.Height;
            int imageWidth = image.Width;

            imageHeight = (imageHeight * maxWidth) / imageWidth;
            imageWidth = maxWidth;

            if (imageHeight > maxHeight)
            {
                imageWidth = (imageWidth * maxHeight) / imageHeight;
                imageHeight = maxHeight;
            }

            using var bitmap = new System.Drawing.Bitmap(image, imageWidth, imageHeight);
            using var stream = new MemoryStream();
            bitmap.Save(stream, System.Drawing.Imaging.ImageFormat.Jpeg);
            return stream.ToArray();
        }
    }

    // Models
    public class DressCreateModel
    {
        public string Dress_Name { get; set; }
        public int Cloth_For_ID { get; set; }
        public int RegistrationID { get; set; }
        public int InstitutionID { get; set; }
        public int? DressSerial { get; set; }
    }

    public class DressUpdateModel
    {
        public string Dress_Name { get; set; }
        public int InstitutionID { get; set; }
    }

    public class DressSerialUpdateModel
    {
        public int DressID { get; set; }
        public int DressSerial { get; set; }
        public int InstitutionID { get; set; }
    }

    public class StyleCategoryCreateModel
    {
        public int DressID { get; set; }
        public string DressStyleCategoryName { get; set; }
        public int? CategorySerial { get; set; }
        public int InstitutionID { get; set; }
        public int RegistrationID { get; set; }
    }

    public class StyleCategoryUpdateModel
    {
        public string DressStyleCategoryName { get; set; }
        public int InstitutionID { get; set; }
    }

    public class CategorySerialUpdateRequest
    {
        public int InstitutionId { get; set; }
        public List<CategorySerialUpdate> Updates { get; set; }
    }

    public class CategorySerialUpdate
    {
        public int CategoryId { get; set; }
        public int? Serial { get; set; }
    }

    public class StyleDesignCreateModel
    {
        public int DressStyleCategoryID { get; set; }
        public int RegistrationID { get; set; }
        public int InstitutionID { get; set; }
        public int DressID { get; set; }
        public string DressStyleName { get; set; }
        public int? StyleSerial { get; set; }
    }

    public class StyleDesignUpdateModel
    {
        public string DressStyleName { get; set; }
        public int InstitutionID { get; set; }
    }

    public class DesignSerialUpdateRequest
    {
        public int InstitutionId { get; set; }
        public List<DesignSerialUpdate> Updates { get; set; }
    }

    public class DesignSerialUpdate
    {
        public int DesignId { get; set; }
        public int? Serial { get; set; }
    }

    // DTO for dress list endpoint
    public class DressListDto
    {
        public int DressID { get; set; }
        public string Dress_Name { get; set; }
        public int Cloth_For_ID { get; set; }
        public bool IsMeasurementAvailable { get; set; }
    }
}
