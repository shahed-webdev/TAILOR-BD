-- TailorBD: Remove Duplicate Dress Entries from OrderList
-- This script removes duplicate dress entries while keeping the first occurrence

-- Step 1: Find and display duplicates
PRINT '=== Finding Duplicate Entries ===';
SELECT 
    OrderID, 
    DressID, 
    COUNT(*) as DuplicateCount,
    STRING_AGG(CAST(OrderListID AS VARCHAR), ', ') as OrderListIDs
FROM OrderList
GROUP BY OrderID, DressID
HAVING COUNT(*) > 1;

-- Step 2: Create a temp table with OrderListIDs to delete
PRINT '=== Creating Temporary Table ===';
IF OBJECT_ID('tempdb..#DuplicatesToDelete') IS NOT NULL
    DROP TABLE #DuplicatesToDelete;

SELECT 
    OrderListID
INTO #DuplicatesToDelete
FROM (
    SELECT 
        OrderListID,
        ROW_NUMBER() OVER (
            PARTITION BY OrderID, DressID 
            ORDER BY OrderListID ASC
        ) as RowNum
    FROM OrderList
) AS DuplicateCheck
WHERE RowNum > 1;

-- Show what will be deleted
PRINT '=== OrderListIDs to be deleted ===';
SELECT * FROM #DuplicatesToDelete;

-- Step 3: Delete related measurements
PRINT '=== Deleting Related Measurements ===';
DELETE FROM Ordered_Measurement
WHERE OrderListID IN (SELECT OrderListID FROM #DuplicatesToDelete);
PRINT CONCAT('Deleted ', @@ROWCOUNT, ' measurement records');

-- Step 4: Delete related styles
PRINT '=== Deleting Related Styles ===';
DELETE FROM Ordered_Dress_Style
WHERE OrderListID IN (SELECT OrderListID FROM #DuplicatesToDelete);
PRINT CONCAT('Deleted ', @@ROWCOUNT, ' style records');

-- Step 5: Delete related payments
PRINT '=== Deleting Related Payments ===';
DELETE FROM Order_Payment
WHERE OrderListID IN (SELECT OrderListID FROM #DuplicatesToDelete);
PRINT CONCAT('Deleted ', @@ROWCOUNT, ' payment records');

-- Step 6: Delete duplicate OrderList entries
PRINT '=== Deleting Duplicate OrderList Entries ===';
DELETE FROM OrderList
WHERE OrderListID IN (SELECT OrderListID FROM #DuplicatesToDelete);
PRINT CONCAT('Deleted ', @@ROWCOUNT, ' OrderList records');

-- Step 7: Clean up temp table
DROP TABLE #DuplicatesToDelete;

-- Step 8: Verify no duplicates remain
PRINT '=== Verifying Cleanup ===';
SELECT 
    OrderID, 
    DressID, 
    COUNT(*) as Count
FROM OrderList
GROUP BY OrderID, DressID
HAVING COUNT(*) > 1;

-- Should return no rows if cleanup was successful
PRINT '=== Cleanup Completed Successfully! ===';
