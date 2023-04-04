
using System;
using System.Configuration;
using System.Data.SqlClient;
using System.Text.RegularExpressions;
using System.Net;
using System.IO;
using Newtonsoft.Json;
using System.Text;
using SmsService;
using static System.Net.Mime.MediaTypeNames;
using Microsoft.Ajax.Utilities;

namespace TailorBD
{
    public class SMS_Class
    {
        public SMS_Class()
        {
            const ProviderEnum provider = ProviderEnum.GreenWeb;
            const ProviderEnum providerMultiple = ProviderEnum.GreenWeb;

            SmsService = new SmsServiceBuilder(provider, providerMultiple);
        }
        private SmsServiceBuilder SmsService { get; }
        public Get_Validation SMS_Validation(string number, string masking, string text)
        {
            bool IsValid = true;
            string Validation_Message = "";

            if (!SmsValidator.IsValidNumber(number))
            {
                IsValid = false;
                Validation_Message += "Invalid Number ";
            }

            if (IsValid)
            { Validation_Message = "Valid"; }

            Get_Validation V = new Get_Validation();

            V.Validation = IsValid;
            V.Message = Validation_Message;

            return V;
        }
        public Guid SMS_Send(string number, string text, string Masking, string SMSPurpose)
        {
            var con = new SqlConnection(ConfigurationManager.ConnectionStrings["TailorBDConnectionString"].ToString());

            var smsSendId = Guid.NewGuid();


            var responseMessage = SmsService.SendSms(text, number);
            var isError = !SmsService.IsSuccess;

            if (!isError)
            {

                var sendRecordcmd = new SqlCommand(
                    "INSERT INTO [SMS_Send_Record] ([SMS_Send_ID], [PhoneNumber], [TextSMS], [TextCount], [SMSCount], [PurposeOfSMS], [Status], [Date], [SMS_Response]) VALUES (@SMS_Send_ID, @PhoneNumber, @TextSMS, @TextCount, @SMSCount, @PurposeOfSMS, @Status, Getdate(), @SMS_Response)",
                    con);
                sendRecordcmd.Parameters.AddWithValue("@SMS_Send_ID", smsSendId);
                sendRecordcmd.Parameters.AddWithValue("@PhoneNumber", number);
                sendRecordcmd.Parameters.AddWithValue("@TextSMS", text);
                sendRecordcmd.Parameters.AddWithValue("@TextCount", text.Length);
                sendRecordcmd.Parameters.AddWithValue("@SMSCount", SMS_Conut(text));
                sendRecordcmd.Parameters.AddWithValue("@PurposeOfSMS", SMSPurpose);
                sendRecordcmd.Parameters.AddWithValue("@Status", "Sent");
                sendRecordcmd.Parameters.AddWithValue("@SMS_Response", responseMessage);

                con.Open();
                sendRecordcmd.ExecuteNonQuery();
                con.Close();
            }

            return smsSendId;
        }
        public int SMS_Conut(string text)
        {
            return SmsValidator.TotalSmsCount(text);
        }
        public int SMS_GetBalance()
        {
            return SmsService.SmsBalance();
        }
    }
    public class Get_Validation
    {
        public bool Validation { get; set; }
        public string Message { get; set; }
    }
}