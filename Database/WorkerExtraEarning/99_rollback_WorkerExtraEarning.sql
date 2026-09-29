/* =============================================================================================
   99_rollback_WorkerExtraEarning.sql      (only if the other-payment feature must be removed)
   Takes every other-payment amount back out of the worker balances, then drops the table.
   Default = TEST RUN (ROLLBACK). Set @Commit = 1 to really do it.
   Deploy the previous app build first (the new build keeps working without the table, too).
   ============================================================================================= */
SET NOCOUNT ON;
SET XACT_ABORT ON;
DECLARE @Commit bit = 0;

IF OBJECT_ID(N'dbo.WorkerExtraEarning', N'U') IS NULL
BEGIN
    PRINT 'WorkerExtraEarning does not exist - nothing to do';
    RETURN;
END

BEGIN TRAN;

SELECT 'BEFORE' AS Step, WorkerType, WorkerID, COUNT(*) AS Entries, SUM(Amount) AS Amount
FROM dbo.WorkerExtraEarning GROUP BY WorkerType, WorkerID ORDER BY WorkerType, WorkerID;

UPDATE A SET A.Balance = ISNULL(A.Balance, 0) - X.Amount
FROM dbo.Artisan A
JOIN (SELECT InstitutionID, WorkerID, SUM(Amount) AS Amount FROM dbo.WorkerExtraEarning
      WHERE WorkerType = N'Artisan' GROUP BY InstitutionID, WorkerID) X
  ON X.WorkerID = A.ArtisanID AND X.InstitutionID = A.InstitutionID;
PRINT CONCAT('artisan balances reduced: ', @@ROWCOUNT);

UPDATE M SET M.Balance = ISNULL(M.Balance, 0) - X.Amount
FROM dbo.CuttingMaster M
JOIN (SELECT InstitutionID, WorkerID, SUM(Amount) AS Amount FROM dbo.WorkerExtraEarning
      WHERE WorkerType = N'CuttingMaster' GROUP BY InstitutionID, WorkerID) X
  ON X.WorkerID = M.CuttingMasterID AND X.InstitutionID = M.InstitutionID;
PRINT CONCAT('cutting master balances reduced: ', @@ROWCOUNT);

DROP TABLE dbo.WorkerExtraEarning;
PRINT 'WorkerExtraEarning dropped';

IF @Commit = 1 BEGIN COMMIT; PRINT '*** COMMITTED ***'; END
ELSE BEGIN ROLLBACK; PRINT '*** TEST RUN: ROLLED BACK (nothing changed). Set @Commit = 1 to apply. ***'; END
GO
