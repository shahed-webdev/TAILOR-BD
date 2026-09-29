-- Speeds Cutting/Factory Issue eligible + list queries
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Order_Inst_WorkStatus' AND object_id = OBJECT_ID('dbo.[Order]'))
    CREATE INDEX IX_Order_Inst_WorkStatus ON dbo.[Order](InstitutionID, WorkStatus) INCLUDE (OrderID, OrderSerialNumber, OrderDate, DeliveryDate, CustomerID);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_OrderList_Inst_Order' AND object_id = OBJECT_ID('dbo.OrderList'))
    CREATE INDEX IX_OrderList_Inst_Order ON dbo.OrderList(InstitutionID, OrderID) INCLUDE (OrderListID, DressID, DressQuantity, WorkCompleteQuantity, OrderList_SN);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_CuttingIssue_Inst_Status' AND object_id = OBJECT_ID('dbo.CuttingIssue'))
BEGIN
    IF OBJECT_ID('dbo.CuttingIssue') IS NOT NULL
        CREATE INDEX IX_CuttingIssue_Inst_Status ON dbo.CuttingIssue(InstitutionID, Status) INCLUDE (OrderListID, CuttingMasterID, Quantity, AssignedDate, CompletedDate, OrderID);
END
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_FactoryIssue_Inst_Status' AND object_id = OBJECT_ID('dbo.FactoryIssue'))
BEGIN
    IF OBJECT_ID('dbo.FactoryIssue') IS NOT NULL
        CREATE INDEX IX_FactoryIssue_Inst_Status ON dbo.FactoryIssue(InstitutionID, Status) INCLUDE (OrderListID, ArtisanID, Quantity, AssignedDate, CompletedDate, OrderID);
END
GO
