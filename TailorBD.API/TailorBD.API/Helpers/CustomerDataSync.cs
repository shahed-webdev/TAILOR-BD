using Microsoft.Data.SqlClient;
using TailorBD.API.Models;

namespace TailorBD.API.Helpers
{
    /// <summary>
    /// Keeps Customer_Measurement / Customer_Dress_Style in sync when orders are placed.
    /// </summary>
    public static class CustomerDataSync
    {
        /// <summary>
        /// Replace saved measurements for a dress with the values from this order.
        /// Removes previous values for the same dress, then inserts non-empty order values.
        /// </summary>
        public static async Task SyncCustomerMeasurementsForDressAsync(
            SqlConnection connection,
            SqlTransaction? transaction,
            int customerId,
            int institutionId,
            int registrationId,
            int dressId,
            IEnumerable<MeasurementItem>? orderMeasurements)
        {
            using (var delCmd = new SqlCommand(@"
                DELETE FROM Customer_Measurement
                WHERE CustomerID = @CustomerID
                  AND InstitutionID = @InstitutionID
                  AND MeasurementTypeID IN (
                      SELECT MeasurementTypeID FROM Measurement_Type
                      WHERE DressID = @DressID AND InstitutionID = @InstitutionID
                  )",
                connection, transaction))
            {
                delCmd.Parameters.AddWithValue("@CustomerID", customerId);
                delCmd.Parameters.AddWithValue("@InstitutionID", institutionId);
                delCmd.Parameters.AddWithValue("@DressID", dressId);
                await delCmd.ExecuteNonQueryAsync();
            }

            if (orderMeasurements == null) return;

            foreach (var m in orderMeasurements)
            {
                if (m.id <= 0 || string.IsNullOrWhiteSpace(m.value)) continue;

                using var cmd = new SqlCommand(@"
                    INSERT INTO Customer_Measurement (RegistrationID, InstitutionID, CustomerID, MeasurementTypeID, Measurement)
                    VALUES (@RegistrationID, @InstitutionID, @CustomerID, @MeasurementTypeID, @Measurement)",
                    connection, transaction);
                cmd.Parameters.AddWithValue("@InstitutionID", institutionId);
                cmd.Parameters.AddWithValue("@CustomerID", customerId);
                cmd.Parameters.AddWithValue("@RegistrationID", registrationId);
                cmd.Parameters.AddWithValue("@MeasurementTypeID", m.id);
                cmd.Parameters.AddWithValue("@Measurement", m.value.Trim());
                await cmd.ExecuteNonQueryAsync();
            }
        }

        /// <summary>
        /// Replace saved styles for a dress with the styles selected on this order.
        /// Removes previous selections for the same dress, then inserts the new list.
        /// </summary>
        public static async Task SyncCustomerDressStylesForDressAsync(
            SqlConnection connection,
            SqlTransaction? transaction,
            int customerId,
            int institutionId,
            int registrationId,
            int dressId,
            IEnumerable<StyleItem>? selectedStyles)
        {
            using (var delCmd = new SqlCommand(@"
                DELETE FROM Customer_Dress_Style
                WHERE CustomerID = @CustomerID
                  AND InstitutionID = @InstitutionID
                  AND Dress_StyleID IN (
                      SELECT Dress_StyleID FROM Dress_Style WHERE DressID = @DressID
                  )",
                connection, transaction))
            {
                delCmd.Parameters.AddWithValue("@CustomerID", customerId);
                delCmd.Parameters.AddWithValue("@InstitutionID", institutionId);
                delCmd.Parameters.AddWithValue("@DressID", dressId);
                await delCmd.ExecuteNonQueryAsync();
            }

            if (selectedStyles == null) return;

            foreach (var s in selectedStyles)
            {
                if (s.id <= 0) continue;

                using var cmd = new SqlCommand(@"
                    INSERT INTO Customer_Dress_Style (RegistrationID, InstitutionID, CustomerID, Dress_StyleID, DressStyleMesurement)
                    VALUES (@RegistrationID, @InstitutionID, @CustomerID, @Dress_StyleID, @DressStyleMesurement)",
                    connection, transaction);
                cmd.Parameters.AddWithValue("@InstitutionID", institutionId);
                cmd.Parameters.AddWithValue("@CustomerID", customerId);
                cmd.Parameters.AddWithValue("@RegistrationID", registrationId);
                cmd.Parameters.AddWithValue("@Dress_StyleID", s.id);
                cmd.Parameters.AddWithValue("@DressStyleMesurement", s.value ?? "");
                await cmd.ExecuteNonQueryAsync();
            }
        }
    }
}
