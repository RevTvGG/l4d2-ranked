# L4D2 Match Reporter Plugin

SourceMod plugin that reports match events to the ranked matchmaking API.

## Features

- Detects when match goes live (via Ready-Up plugin)
- Reports round scores to API
- Collects player statistics (damage, kills, common)
- Identifies MVP using Survivor MVP plugin
- Sends all data via HTTP to the web platform

## Dependencies

### Required Plugins
- `readyup.smx` - For OnRoundIsLive forward
- `l4d2_hybrid_scoremod.smx` - For score natives
- `l4d2_survivor_mvp.smx` - For MVP and stats natives

### Required Extensions
- `steamworks.ext.so` (Linux) or `steamworks.ext.dll` (Windows) - For HTTP requests

### Required Include Files
- `steamworks.inc`
- `readyup.inc`
- `l4d2_hybrid_scoremod.inc`
- `l4d2_survivor_mvp.inc`

## Compilation

### Using spcomp (SourceMod Compiler)

```bash
cd addons/sourcemod/scripting
spcomp l4d2_match_reporter.sp
```

This will generate `l4d2_match_reporter.smx` in the `compiled/` folder.

### Include Files Location

Make sure the include files are in:
```
addons/sourcemod/scripting/include/
├── steamworks.inc
├── readyup.inc
├── l4d2_hybrid_scoremod.inc
└── l4d2_survivor_mvp.inc
```

## Installation

1. **Compile the plugin** (see above)

2. **Copy the compiled plugin:**
   ```
   addons/sourcemod/plugins/l4d2_match_reporter.smx
   ```

3. **Verify dependencies are loaded:**
   ```
   sm plugins list
   ```
   
   You should see:
   - L4D2 Ready-Up
   - L4D2 Scoremod+ (or Hybrid Scoremod)
   - Survivor MVP notification
   - SteamWorks extension

4. **Restart the server or load the plugin:**
   ```
   sm plugins load l4d2_match_reporter
   ```

## Usage

### Setting Match ID (Called by API)

The web platform will automatically call this via RCON:

```
sm_set_match_id <match_id> <api_url>
```

Example:
```
sm_set_match_id cmj1a2b3c4d5 https://your-domain.com
```

### Verification

Check the server console for log messages:

```
[Match Reporter] Plugin loaded v1.0.0
[Match Reporter] Match ID set: cmj1a2b3c4d5
[Match Reporter] API URL: https://your-domain.com
[Match Reporter] Match is LIVE! Notifying API...
[Match Reporter] ✓ Match live notification sent successfully
[Match Reporter] Round 1 ended, collecting stats...
[Match Reporter] Round 1 - Score: 550 (H:400 D:100 P:50) MVP: STEAM_1:0:12345
[Match Reporter] ✓ Round report sent successfully
```

## API Endpoints

The plugin communicates with these endpoints:

### 1. Match Live Notification
```
POST /api/match/notify-live
{
  "matchId": "cmj1a2b3c4d5"
}
```

### 2. Round Report
```
POST /api/match/report-round
{
  "matchId": "cmj1a2b3c4d5",
  "round": 1,
  "teamScore": 550,
  "healthBonus": 400,
  "damageBonus": 100,
  "pillsBonus": 50,
  "mvpSteamId": "STEAM_1:0:12345",
  "playerStats": [
    {
      "steamId": "STEAM_1:0:12345",
      "damage": 5000,
      "kills": 50,
      "common": 200
    }
  ]
}
```

## Troubleshooting

### Plugin not loading
- Check that all dependencies are installed
- Verify SteamWorks extension is loaded: `sm exts list`
- Check for errors in `logs/errors_*.log`

### Match not being reported
- Verify match ID was set: Check console for "Match ID set" message
- Check API URL is correct
- Verify server can reach the API (firewall/network issues)
- Check `logs/errors_*.log` for HTTP errors

### Stats not accurate
- Verify Scoremod and Survivor MVP plugins are loaded
- Check that plugins are the correct versions
- Ensure ZoneMod is loaded before match starts

## Development

### Testing Locally

1. Set up a local L4D2 server with ZoneMod
2. Install the plugin
3. Run the web platform locally (`npm run dev`)
4. Use ngrok or similar to expose localhost:
   ```bash
   ngrok http 3000
   ```
5. Set match ID with ngrok URL:
   ```
   sm_set_match_id test123 https://your-ngrok-url.ngrok.io
   ```

### Debug Logging

Add debug prints in the plugin:
```sourcepawn
PrintToServer("[DEBUG] Variable value: %d", someValue);
```

Check server console or `logs/L*.log` files.

## License

MIT License - See main project for details

## Credits

- Ready-Up Plugin: L4D2 Competitive Community
- Scoremod: Visor, Sir
- Survivor MVP: Tabun, Artifacial
- SteamWorks: KyleSanderson
