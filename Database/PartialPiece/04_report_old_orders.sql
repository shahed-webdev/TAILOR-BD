/* ============================================================================
   PartialPiece 04_report_old_orders.sql  —  OPTIONAL, READ-ONLY report
   Orders still open on /incomplete-works although their factory assignment was marked
   "সেলাই সম্পন্ন" before per-piece work-complete recording existed: the dress line still shows
   pieces in "অসম্পূ.". Complete them on /incomplete-works as usual (or, if you decide to,
   with 05_catchup_OPTIONAL.sql). Nothing is changed by this script.
   ============================================================================ */
SET NOCOUNT ON;
DECLARE @InstitutionID INT = NULL;   -- NULL = all shops, or set one shop's InstitutionID

SELECT O.InstitutionID, O.OrderSerialNumber AS OrderNo, O.OrderID, C.CustomerName, C.Phone,
       OL.OrderList_SN AS LineSN, OL.OrderListID, D.Dress_Name AS Dress,
       OL.DressQuantity, ISNULL(OL.WorkCompleteQuantity, 0) AS WorkComplete,
       OL.DressQuantity - ISNULL(OL.WorkCompleteQuantity, 0) AS StillOpenOnIncompleteWorks,
       FD.FactoryDonePieces,
       FI.FactoryIssueID, A.Name AS Artisan, FI.Quantity AS FactoryPieces, FI.CompletedDate AS SewingDoneDate,
       O.WorkStatus, O.DeliveryStatus
FROM dbo.FactoryIssue FI
JOIN dbo.OrderList OL ON OL.OrderListID = FI.OrderListID AND OL.InstitutionID = FI.InstitutionID
JOIN dbo.[Order] O ON O.OrderID = OL.OrderID
JOIN dbo.Customer C ON C.CustomerID = O.CustomerID
JOIN dbo.Dress D ON D.DressID = OL.DressID
LEFT JOIN dbo.Artisan A ON A.ArtisanID = FI.ArtisanID
CROSS APPLY (SELECT SUM(F2.Quantity) AS FactoryDonePieces FROM dbo.FactoryIssue F2
             WHERE F2.OrderListID = OL.OrderListID AND F2.InstitutionID = OL.InstitutionID AND F2.Status = N'Completed') FD
WHERE FI.Status = N'Completed'
  AND OL.DressQuantity - ISNULL(OL.WorkCompleteQuantity, 0) > 0
  AND FD.FactoryDonePieces > ISNULL(OL.WorkCompleteQuantity, 0)   -- factory-done pieces not yet recorded (old behaviour)
  AND O.WorkStatus IN (N'incomplete', N'PartlyCompleted')
  AND O.DeliveryStatus IN (N'Pending', N'PartlyDelivered')
  AND (@InstitutionID IS NULL OR FI.InstitutionID = @InstitutionID)
ORDER BY O.InstitutionID, O.OrderSerialNumber, OL.OrderList_SN;
