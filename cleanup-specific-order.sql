-- TailorBD: Simple Duplicate Cleanup for Specific Order
-- Replace 410149 with your actual OrderID

DECLARE @OrderID INT = 410149;  -- ✅ Change this to your order ID

PRINT '=== Step 1: Finding Duplicates for Order ' + CAST(@OrderID AS VARCHAR) + ' ===';

-- Find duplicates
SELECT 
    ol.OrderID,
    ol.DressID,
    d.Dress_Name,
    COUNT(*) as DuplicateCount,
    MIN(ol.OrderListID) as FirstOrderListID,
    STRING_AGG(CAST(ol.OrderListID AS VARCHAR), ', ') as AllOrderListIDs
FROM OrderList ol
INNER JOIN Dress d ON ol.DressID = d.DressID
WHERE ol.OrderID = @OrderID
GROUP BY ol.OrderID, ol.DressID, d.Dress_Name
HAVING COUNT(*) > 1;

-- Delete duplicates one by one
PRINT '=== Step 2: Deleting Duplicates ===';

-- For each duplicate, keep the first one and delete the rest
DELETE FROM Ordered_Measurement
WHERE OrderListID IN (
    SELECT OrderListID
    FROM (
        SELECT 
            OrderListID,
            ROW_NUMBER() OVER (PARTITION BY OrderID, DressID ORDER BY OrderListID) as rn
        FROM OrderList
        WHERE OrderID = @OrderID
    ) t
    WHERE rn > 1
);
PRINT 'Measurements deleted: ' + CAST(@@ROWCOUNT AS VARCHAR);

DELETE FROM Ordered_Dress_Style
WHERE OrderListID IN (
    SELECT OrderListID
    FROM (
        SELECT 
            OrderListID,
            ROW_NUMBER() OVER (PARTITION BY OrderID, DressID ORDER BY OrderListID) as rn
        FROM OrderList
        WHERE OrderID = @OrderID
    ) t
    WHERE rn > 1
);
PRINT 'Styles deleted: ' + CAST(@@ROWCOUNT AS VARCHAR);

DELETE FROM Order_Payment
WHERE OrderListID IN (
    SELECT OrderListID
    FROM (
        SELECT 
            OrderListID,
            ROW_NUMBER() OVER (PARTITION BY OrderID, DressID ORDER BY OrderListID) as rn
        FROM OrderList
        WHERE OrderID = @OrderID
    ) t
    WHERE rn > 1
);
PRINT 'Payments deleted: ' + CAST(@@ROWCOUNT AS VARCHAR);

DELETE FROM OrderList
WHERE OrderListID IN (
    SELECT OrderListID
    FROM (
        SELECT 
            OrderListID,
            ROW_NUMBER() OVER (PARTITION BY OrderID, DressID ORDER BY OrderListID) as rn
        FROM OrderList
        WHERE OrderID = @OrderID
    ) t
    WHERE rn > 1
);
PRINT 'OrderList entries deleted: ' + CAST(@@ROWCOUNT AS VARCHAR);

-- Verify
PRINT '=== Step 3: Verification ===';
SELECT 
    ol.DressID,
    d.Dress_Name,
    COUNT(*) as Count
FROM OrderList ol
INNER JOIN Dress d ON ol.DressID = d.DressID
WHERE ol.OrderID = @OrderID
GROUP BY ol.DressID, d.Dress_Name;

PRINT '=== Cleanup Complete! ===';
