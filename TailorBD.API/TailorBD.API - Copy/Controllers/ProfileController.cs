using Microsoft.AspNetCore.Mvc;
using TailorBD.API.Models;
using TailorBD.API.Services;

namespace TailorBD.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ProfileController : ControllerBase
    {
        private readonly IProfileService _profileService;

        public ProfileController(IProfileService profileService)
        {
            _profileService = profileService;
        }

        /// <summary>
        /// Get profile by username
        /// </summary>
        [HttpGet("by-username/{username}")]
        public async Task<ActionResult<ApiResponse<ProfileDto>>> GetProfileByUsername(string username)
        {
            try
            {
                var profile = await _profileService.GetProfileByUsernameAsync(username);
                
                if (profile == null)
                {
                    return NotFound(new ApiResponse<ProfileDto>
                    {
                        Success = false,
                        Message = "Profile not found"
                    });
                }

                return Ok(new ApiResponse<ProfileDto>
                {
                    Success = true,
                    Message = "Profile retrieved successfully",
                    Data = profile
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<ProfileDto>
                {
                    Success = false,
                    Message = "An error occurred while retrieving profile",
                    Errors = new List<string> { ex.Message }
                });
            }
        }

        /// <summary>
        /// Get profile by registration ID
        /// </summary>
        [HttpGet("{registrationId}")]
        public async Task<ActionResult<ApiResponse<ProfileDto>>> GetProfileById(int registrationId)
        {
            try
            {
                var profile = await _profileService.GetProfileByIdAsync(registrationId);
                
                if (profile == null)
                {
                    return NotFound(new ApiResponse<ProfileDto>
                    {
                        Success = false,
                        Message = "Profile not found"
                    });
                }

                return Ok(new ApiResponse<ProfileDto>
                {
                    Success = true,
                    Message = "Profile retrieved successfully",
                    Data = profile
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<ProfileDto>
                {
                    Success = false,
                    Message = "An error occurred while retrieving profile",
                    Errors = new List<string> { ex.Message }
                });
            }
        }

        /// <summary>
        /// Get profile image
        /// </summary>
        [HttpGet("{registrationId}/image")]
        public async Task<IActionResult> GetProfileImage(int registrationId)
        {
            try
            {
                var profile = await _profileService.GetProfileByIdAsync(registrationId);
                
                if (profile?.Image == null || profile.Image.Length == 0)
                {
                    // Return default avatar
                    var defaultImagePath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "images", "default-avatar.png");
                    if (System.IO.File.Exists(defaultImagePath))
                    {
                        var defaultImage = await System.IO.File.ReadAllBytesAsync(defaultImagePath);
                        return File(defaultImage, "image/png");
                    }
                    return NotFound();
                }

                return File(profile.Image, "image/jpeg");
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        /// <summary>
        /// Update profile information
        /// </summary>
        [HttpPut("{registrationId}")]
        public async Task<ActionResult<ApiResponse<bool>>> UpdateProfile(int registrationId, [FromBody] UpdateProfileRequest request)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.Name))
                {
                    return BadRequest(new ApiResponse<bool>
                    {
                        Success = false,
                        Message = "Name is required"
                    });
                }

                var result = await _profileService.UpdateProfileAsync(registrationId, request);
                
                if (!result)
                {
                    return NotFound(new ApiResponse<bool>
                    {
                        Success = false,
                        Message = "Profile not found or update failed"
                    });
                }

                return Ok(new ApiResponse<bool>
                {
                    Success = true,
                    Message = "Profile updated successfully",
                    Data = true
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<bool>
                {
                    Success = false,
                    Message = "An error occurred while updating profile",
                    Errors = new List<string> { ex.Message }
                });
            }
        }

        /// <summary>
        /// Update profile image
        /// </summary>
        [HttpPost("{registrationId}/image")]
        public async Task<ActionResult<ApiResponse<bool>>> UpdateProfileImage(int registrationId, IFormFile image)
        {
            try
            {
                if (image == null || image.Length == 0)
                {
                    return BadRequest(new ApiResponse<bool>
                    {
                        Success = false,
                        Message = "No image file provided"
                    });
                }

                // Validate file type
                var allowedTypes = new[] { "image/jpeg", "image/jpg", "image/png", "image/gif" };
                if (!allowedTypes.Contains(image.ContentType.ToLower()))
                {
                    return BadRequest(new ApiResponse<bool>
                    {
                        Success = false,
                        Message = "Only JPEG, PNG, and GIF images are allowed"
                    });
                }

                // Validate file size (max 5MB)
                if (image.Length > 5 * 1024 * 1024)
                {
                    return BadRequest(new ApiResponse<bool>
                    {
                        Success = false,
                        Message = "Image size must be less than 5MB"
                    });
                }

                // Read image data
                using var memoryStream = new MemoryStream();
                await image.CopyToAsync(memoryStream);
                var imageData = memoryStream.ToArray();

                var result = await _profileService.UpdateProfileImageAsync(registrationId, imageData);
                
                if (!result)
                {
                    return NotFound(new ApiResponse<bool>
                    {
                        Success = false,
                        Message = "Profile not found or image update failed"
                    });
                }

                return Ok(new ApiResponse<bool>
                {
                    Success = true,
                    Message = "Profile image updated successfully",
                    Data = true
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<bool>
                {
                    Success = false,
                    Message = "An error occurred while updating profile image",
                    Errors = new List<string> { ex.Message }
                });
            }
        }
    }
}
