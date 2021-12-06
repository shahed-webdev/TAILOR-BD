namespace TailorBD.AccessAdmin.quick_order.ViewModels
{
    public class ResponseModel<TObject>
    {
        public ResponseModel()
        {

        }
        public ResponseModel(bool isSuccess, string message)
        {
            IsSuccess = isSuccess;
            Message = message;
        }
        public ResponseModel(bool isSuccess, string message, TObject data)
        {
            IsSuccess = isSuccess;
            Message = message;
            Data = data;
        }
        public bool IsSuccess { get; set; }
        public string Message { get; set; }
        public TObject Data { get; set; }
    }


    public class ResponseModel
    {
        public ResponseModel()
        {

        }
        public ResponseModel(bool isSuccess, string message)
        {
            IsSuccess = isSuccess;
            Message = message;
        }

        public bool IsSuccess { get; set; }
        public string Message { get; set; }
    }
}