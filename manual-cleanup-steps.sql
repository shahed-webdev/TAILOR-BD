-- TailorBD: Manual Step-by-Step Cleanup
-- Run each section ONE AT A TIME

-- ============================================
-- STEP 1: Find Duplicates (OrderID = 410149)
-- ============================================
SELECT 
    ol.OrderListID,
    ol.OrderID,
    ol.DressID,
    d.Dress_Name,
    ol.DressQuantity
FROM OrderList ol
INNER JOIN Dress d ON ol.DressID = d.DressID
WHERE ol.OrderID = 410149
ORDER BY ol.DressID, ol.OrderListID;

-- Copy the OrderListIDs that you want to DELETE (keep the first one of each dress)


-- ============================================
-- STEP 2: Delete Measurements (Replace IDs)
-- ============================================
-- Example: If you have duplicate OrderListIDs: 456, 457, 458
-- Delete all EXCEPT the first one

DELETE FROM Ordered_Measurement
WHERE OrderListID IN (
    -- Replace these with YOUR duplicate OrderListIDs
    -- 456, 457, 458
);


-- ============================================
-- STEP 3: Delete Styles (Replace IDs)
-- ============================================
DELETE FROM Ordered_Dress_Style
WHERE OrderListID IN (
    -- Replace these with YOUR duplicate OrderListIDs
    -- 456, 457, 458
);


-- ============================================
-- STEP 4: Delete Payments (Replace IDs)
-- ============================================
DELETE FROM Order_Payment
WHERE OrderListID IN (
    -- Replace these with YOUR duplicate OrderListIDs
    -- 456, 457, 458
);


-- ============================================
-- STEP 5: Delete OrderList (Replace IDs)
-- ============================================
DELETE FROM OrderList
WHERE OrderListID IN (
    -- Replace these with YOUR duplicate OrderListIDs
    -- 456, 457, 458
);


-- ============================================
-- STEP 6: Verify - Should show only 1 of each dress
-- ============================================
SELECT 
    ol.DressID,
    d.Dress_Name,
    COUNT(*) as Count
FROM OrderList ol
INNER JOIN Dress d ON ol.DressID = d.DressID
WHERE ol.OrderID = 410149
GROUP BY ol.DressID, d.Dress_Name;

-- All counts should be 1
