namespace TailorBD.API.Models
{
    public class PagedResult<T>
    {
        public IEnumerable<T> Data       { get; set; } = Enumerable.Empty<T>();
        public int            TotalCount { get; set; }
        public int            Page       { get; set; }
        public int            PageSize   { get; set; }
        public int            TotalPages { get; set; }
    }
}
