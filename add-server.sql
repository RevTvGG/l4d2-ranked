-- Add L4D2 Ranked Server to database
-- Run this SQL in your PostgreSQL database

INSERT INTO "GameServer" (
  id,
  name,
  "ipAddress",
  port,
  "rconPassword",
  status,
  region,
  "maxPlayers",
  "currentMatchId",
  "createdAt",
  "updatedAt"
) VALUES (
  gen_random_uuid(),
  'L4D2 Ranked Online Server 01',
  '50.20.249.93',
  9190,
  'server1rankedonlinexx26',
  'AVAILABLE',
  'US',
  8,
  NULL,
  NOW(),
  NOW()
);

-- Verify the server was added
SELECT * FROM "GameServer" WHERE "ipAddress" = '50.20.249.93';
