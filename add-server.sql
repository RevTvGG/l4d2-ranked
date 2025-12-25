# SQL para Agregar Servidor a la Base de Datos

Ejecuta este SQL en el panel de Neon (https://console.neon.tech):

```sql
INSERT INTO "GameServer" (
  id,
  name,
  "ipAddress",
  port,
  "rconPassword",
  "rconPort",
  "serverKey",
  "isActive",
  status,
  "createdAt"
)
VALUES (
  gen_random_uuid(),
  'L4D2 Ranked Server #1',
  '50.20.249.93',
  9190,
  'server1rankedonlinexx26',
  9190,
  'ranked-server-k9cc0n0k4rc',
  true,
  'AVAILABLE',
  NOW()
)
ON CONFLICT ("serverKey") 
DO UPDATE SET
  name = EXCLUDED.name,
  "ipAddress" = EXCLUDED."ipAddress",
  port = EXCLUDED.port,
  "rconPassword" = EXCLUDED."rconPassword",
  "rconPort" = EXCLUDED."rconPort",
  "isActive" = EXCLUDED."isActive",
  status = EXCLUDED.status;
```

## Pasos:

1. Ve a https://console.neon.tech
2. Selecciona tu proyecto `l4d2-ranked`
3. Click en "SQL Editor" (o "Tables" → "Query")
4. Pega el SQL de arriba
5. Click en "Run" o "Execute"

Debería devolver: `INSERT 0 1` o `UPDATE 1`

¡Avísame cuando lo hayas ejecutado!
