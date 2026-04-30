using Microsoft.AspNetCore.Mvc;
using TailorBD.API.Models;
using TailorBD.API.Services;

namespace TailorBD.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CustomersController : ControllerBase
    {
        private readonly ICustomerService _customerService;
        private readonly ILogger<CustomersController> _logger;

        public CustomersController(ICustomerService customerService, ILogger<CustomersController> logger)
        {
            _customerService = customerService;
            _logger = logger;
        }

        /// <summary>
        /// Get all customers for an institution
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<ApiResponse<PagedResult<CustomerDto>>>> GetAllCustomers(
            [FromQuery] int    institutionId,
            [FromQuery] int    page        = 1,
            [FromQuery] int    pageSize    = 30,
            [FromQuery] string? searchNo   = null,
            [FromQuery] string? searchName = null,
            [FromQuery] string? searchPhone= null)
        {
            try
            {
                if (institutionId <= 0)
                    return BadRequest(ApiResponse<PagedResult<CustomerDto>>.ErrorResponse("Invalid institution ID"));

                if (page < 1)     page     = 1;
                if (pageSize < 1) pageSize = 30;

                var result = await _customerService.GetAllCustomersAsync(
                    institutionId, page, pageSize, searchNo, searchName, searchPhone);

                return Ok(ApiResponse<PagedResult<CustomerDto>>.SuccessResponse(result, "Customers retrieved successfully"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving customers for institution {InstitutionId}", institutionId);
                return StatusCode(500, ApiResponse<PagedResult<CustomerDto>>.ErrorResponse("An error occurred while retrieving customers"));
            }
        }

        /// <summary>
        /// Get customer by ID
        /// </summary>
        [HttpGet("{id}")]
        public async Task<ActionResult<ApiResponse<CustomerDto>>> GetCustomerById(int id, [FromQuery] int institutionId)
        {
            try
            {
                if (institutionId <= 0)
                    return BadRequest(ApiResponse<CustomerDto>.ErrorResponse("Invalid institution ID"));

                var customer = await _customerService.GetCustomerByIdAsync(id, institutionId);
                
                if (customer == null)
                    return NotFound(ApiResponse<CustomerDto>.ErrorResponse("Customer not found"));

                return Ok(ApiResponse<CustomerDto>.SuccessResponse(customer, "Customer retrieved successfully"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving customer {CustomerId}", id);
                return StatusCode(500, ApiResponse<CustomerDto>.ErrorResponse("An error occurred while retrieving customer"));
            }
        }

        /// <summary>
        /// Get customer by phone number
        /// </summary>
        [HttpGet("by-phone/{phone}")]
        public async Task<ActionResult<ApiResponse<CustomerDto>>> GetCustomerByPhone(string phone, [FromQuery] int institutionId)
        {
            try
            {
                if (institutionId <= 0)
                    return BadRequest(ApiResponse<CustomerDto>.ErrorResponse("Invalid institution ID"));

                var customer = await _customerService.GetCustomerByPhoneAsync(phone, institutionId);
                
                if (customer == null)
                    return NotFound(ApiResponse<CustomerDto>.ErrorResponse("Customer not found"));

                return Ok(ApiResponse<CustomerDto>.SuccessResponse(customer, "Customer retrieved successfully"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving customer by phone {Phone}", phone);
                return StatusCode(500, ApiResponse<CustomerDto>.ErrorResponse("An error occurred while retrieving customer"));
            }
        }

        /// <summary>
        /// Create a new customer
        /// </summary>
        [HttpPost]
        public async Task<ActionResult<ApiResponse<int>>> CreateCustomer([FromBody] Customer customer)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ApiResponse<int>.ErrorResponse("Invalid customer data"));

                customer.Date = DateTime.Now;
                var customerId = await _customerService.CreateCustomerAsync(customer);
                
                return CreatedAtAction(nameof(GetCustomerById), 
                    new { id = customerId, institutionId = customer.InstitutionID }, 
                    ApiResponse<int>.SuccessResponse(customerId, "Customer created successfully"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating customer");
                return StatusCode(500, ApiResponse<int>.ErrorResponse("An error occurred while creating customer"));
            }
        }

        /// <summary>
        /// Update an existing customer
        /// </summary>
        [HttpPut("{id}")]
        public async Task<ActionResult<ApiResponse<bool>>> UpdateCustomer(int id, [FromBody] Customer customer)
        {
            try
            {
                if (id != customer.CustomerID)
                    return BadRequest(ApiResponse<bool>.ErrorResponse("Customer ID mismatch"));

                if (!ModelState.IsValid)
                    return BadRequest(ApiResponse<bool>.ErrorResponse("Invalid customer data"));

                var result = await _customerService.UpdateCustomerAsync(customer);
                
                if (!result)
                    return NotFound(ApiResponse<bool>.ErrorResponse("Customer not found"));

                return Ok(ApiResponse<bool>.SuccessResponse(true, "Customer updated successfully"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating customer {CustomerId}", id);
                return StatusCode(500, ApiResponse<bool>.ErrorResponse("An error occurred while updating customer"));
            }
        }

        /// <summary>
        /// Delete a customer
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<ActionResult<ApiResponse<bool>>> DeleteCustomer(int id, [FromQuery] int institutionId)
        {
            try
            {
                if (institutionId <= 0)
                    return BadRequest(ApiResponse<bool>.ErrorResponse("Invalid institution ID"));

                var result = await _customerService.DeleteCustomerAsync(id, institutionId);
                
                if (!result)
                    return NotFound(ApiResponse<bool>.ErrorResponse("Customer not found"));

                return Ok(ApiResponse<bool>.SuccessResponse(true, "Customer deleted successfully"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting customer {CustomerId}", id);
                return StatusCode(500, ApiResponse<bool>.ErrorResponse("An error occurred while deleting customer"));
            }
        }

        /// <summary>
        /// Autocomplete suggest — search by no/name/phone, returns top 10
        /// </summary>
        [HttpGet("suggest")]
        public async Task<ActionResult<ApiResponse<IEnumerable<CustomerDto>>>> Suggest(
            [FromQuery] int     institutionId,
            [FromQuery] string? q    = null,
            [FromQuery] string? type = "name")   // "no" | "name" | "phone"
        {
            try
            {
                if (institutionId <= 0)
                    return BadRequest(ApiResponse<IEnumerable<CustomerDto>>.ErrorResponse("Invalid institution ID"));

                if (string.IsNullOrWhiteSpace(q))
                    return Ok(ApiResponse<IEnumerable<CustomerDto>>.SuccessResponse(Enumerable.Empty<CustomerDto>()));

                var result = await _customerService.SuggestCustomersAsync(institutionId, q.Trim(), type ?? "name");
                return Ok(ApiResponse<IEnumerable<CustomerDto>>.SuccessResponse(result));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error suggesting customers");
                return StatusCode(500, ApiResponse<IEnumerable<CustomerDto>>.ErrorResponse("An error occurred"));
            }
        }
    }
}
