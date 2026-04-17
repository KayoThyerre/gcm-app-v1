ALTER TABLE "ScaleCellOverride"
ADD COLUMN "personKey" TEXT;

UPDATE "ScaleCellOverride" AS sco
SET "personKey" = CASE
  WHEN EXISTS (
    SELECT 1
    FROM "ScaleTeamConfig" AS stc
    WHERE stc."scaleMonthId" = sco."scaleMonthId"
      AND stc."teamName" = sco."teamName"
      AND stc."supervisorName" = sco."personName"
  ) THEN 'supervisor-' || sco."teamName"
  WHEN EXISTS (
    SELECT 1
    FROM "ScaleTeamConfig" AS stc
    WHERE stc."scaleMonthId" = sco."scaleMonthId"
      AND stc."teamName" = sco."teamName"
      AND stc."radioOperatorName" = sco."personName"
  ) THEN 'radio-' || sco."teamName"
  ELSE COALESCE(
    (
      SELECT 'member-' || stm."id"
      FROM "ScaleTeamMember" AS stm
      INNER JOIN "ScaleTeamConfig" AS stc
        ON stc."id" = stm."teamConfigId"
      WHERE stc."scaleMonthId" = sco."scaleMonthId"
        AND stc."teamName" = sco."teamName"
        AND stm."name" = sco."personName"
      ORDER BY stm."createdAt" ASC, stm."id" ASC
      LIMIT 1
    ),
    'legacy-' || sco."id"
  )
END;

WITH ranked AS (
  SELECT
    "id",
    ROW_NUMBER() OVER (
      PARTITION BY "scaleMonthId", "teamName", "personKey", "day"
      ORDER BY "updatedAt" DESC, "createdAt" DESC, "id" DESC
    ) AS rn
  FROM "ScaleCellOverride"
)
DELETE FROM "ScaleCellOverride" AS sco
USING ranked
WHERE sco."id" = ranked."id"
  AND ranked.rn > 1;

DROP INDEX IF EXISTS "ScaleCellOverride_scaleMonthId_teamName_personName_day_key";

ALTER TABLE "ScaleCellOverride"
ALTER COLUMN "personKey" SET NOT NULL;

ALTER TABLE "ScaleCellOverride"
DROP COLUMN "personName";

CREATE UNIQUE INDEX "ScaleCellOverride_scaleMonthId_teamName_personKey_day_key"
ON "ScaleCellOverride"("scaleMonthId", "teamName", "personKey", "day");