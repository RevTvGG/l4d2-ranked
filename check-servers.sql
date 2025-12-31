-- Check if server already exists in database
SELECT * FROM "GameServer" WHERE "ipAddress" = '50.20.249.93';

-- Or check all servers
SELECT 
  id,
  name,
  "ipAddress",
  port,
  "rconPassword",
  status,
  region
FROM "GameServer";
