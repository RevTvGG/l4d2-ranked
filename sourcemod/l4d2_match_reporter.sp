#include <sourcemod>
#include <sdktools>
#include <steamworks>
#include <readyup>

#undef REQUIRE_PLUGIN
#include <l4d2_hybrid_scoremod>
#include <l4d2_survivor_mvp>
// #include <left4dhooks> // DISABLED: external dependency causes compilation errors if sub-includes are missing
// We manually declare the native we need to avoid dependency hell for the user
native bool L4D2_GetVersusCampaignScores(int &teamA, int &teamB);
#define REQUIRE_PLUGIN

#pragma semicolon 1
#pragma newdecls required

#define PLUGIN_VERSION "2.2.0"

// Constants
#define TEAM_SURVIVOR 2
#define TEAM_INFECTED 3
#define MAX_JSON_SIZE 8192

// CVars
ConVar g_cvApiUrl;
ConVar g_cvServerKey;

// Match State
char g_sMatchId[64];
bool g_bIsMatchLive = false;

// SourceTV Demo Recording
bool g_bDemoRecording = false;
char g_sDemoFilename[128];

// Player Stats Storage
int g_iPlayerKills[MAXPLAYERS + 1];
int g_iPlayerDeaths[MAXPLAYERS + 1];
int g_iPlayerDamage[MAXPLAYERS + 1];
int g_iPlayerHeadshots[MAXPLAYERS + 1];

// Whitelist System
char g_sWhitelistedSteamIDs[8][32];  // Max 8 players per match
int g_iWhitelistCount = 0;
bool g_bWhitelistActive = false;

// Join Timeout System (5 minutes to connect after match found)
#define JOIN_TIMEOUT_SECONDS 300.0  // 5 minutes
bool g_bPlayerConnected[8];  // Track which whitelisted players have connected
Handle g_hJoinTimeoutTimer = null;

// Optional Plugins
bool g_bScoreModAvailable = false;
bool g_bMvpAvailable = false;


public Plugin myinfo =
{
    name = "L4D2 Match Reporter",
    author = "Antigravity",
    description = "Reports match stats to L4D2 Ranked API",
    version = PLUGIN_VERSION,
    url = "https://www.l4d2ranked.online"
};

public void OnAllPluginsLoaded()
{
    g_bScoreModAvailable = LibraryExists("l4d2_hybrid_scoremod");
    g_bMvpAvailable = true; // The MVP plugin doesn't register a library, but it's a required dependency now so we assume it's there.
    
    // Check with the API if we have an assigned match (survives ZoneMod reloads)
    CreateTimer(2.0, Timer_CheckServerStatus); // Delay to ensure cvars are loaded
}

public Action Timer_CheckServerStatus(Handle timer)
{
    CheckServerStatus();
    return Plugin_Continue;
}

void CheckServerStatus()
{
    char sApiUrl[256], sServerKey[64];
    g_cvApiUrl.GetString(sApiUrl, sizeof(sApiUrl));
    g_cvServerKey.GetString(sServerKey, sizeof(sServerKey));
    
    // Build the check-status URL
    char sRequestUrl[512];
    Format(sRequestUrl, sizeof(sRequestUrl), "%s/server/check-status?server_key=%s", sApiUrl, sServerKey);
    
    Handle hRequest = SteamWorks_CreateHTTPRequest(k_EHTTPMethodGET, sRequestUrl);
    if (hRequest == INVALID_HANDLE)
    {
        PrintToServer("[Match Reporter] Failed to create check-status request");
        return;
    }
    
    SteamWorks_SetHTTPRequestHeaderValue(hRequest, "Content-Type", "application/json");
    SteamWorks_SetHTTPCallbacks(hRequest, OnCheckServerStatusResponse);
    SteamWorks_SendHTTPRequest(hRequest);
    
    PrintToServer("[Match Reporter] Checking for assigned match...");
}

public void OnCheckServerStatusResponse(Handle hRequest, bool bFailure, bool bRequestSuccessful, EHTTPStatusCode eStatusCode, int data)

{
    if (bFailure || !bRequestSuccessful)
    {
        PrintToServer("[Match Reporter] check-status request failed");
        delete hRequest;
        return;
    }
    
    if (view_as<int>(eStatusCode) >= 200 && view_as<int>(eStatusCode) < 300)

    {
        // Get response body
        int iBodySize;
        SteamWorks_GetHTTPResponseBodySize(hRequest, iBodySize);
        
        char[] sBody = new char[iBodySize + 1];
        SteamWorks_GetHTTPResponseBodyData(hRequest, sBody, iBodySize);
        
        // Simple JSON parsing for match_id
        // Look for "match_id":"..." or "match_id":null
        if (StrContains(sBody, "\"has_match\":true") != -1)
        {
            // Extract match_id value
            int iStart = StrContains(sBody, "\"match_id\":\"");
            if (iStart != -1)
            {
                iStart += 12; // Length of "match_id":"
                int iEnd = iStart;
                while (sBody[iEnd] != '"' && sBody[iEnd] != '\0') iEnd++;
                
                // Copy the match ID
                int len = iEnd - iStart;
                if (len > 0 && len < sizeof(g_sMatchId))
                {
                    for (int j = 0; j < len; j++)
                    {
                        g_sMatchId[j] = sBody[iStart + j];
                    }
                    g_sMatchId[len] = '\0';
                    
                    PrintToServer("[Match Reporter] Found assigned match: %s", g_sMatchId);
                    PrintToChatAll("\x04[L4D2 Ranked]\x01 Match ID loaded: \x03%s", g_sMatchId);
                }
            }
        }
        else
        {
            PrintToServer("[Match Reporter] No assigned match found for this server");
        }
    }
    else
    {
        PrintToServer("[Match Reporter] check-status returned status: %d", eStatusCode);
    }
    
    delete hRequest;
}


public void OnLibraryAdded(const char[] name)
{
    if (StrEqual(name, "l4d2_hybrid_scoremod")) g_bScoreModAvailable = true;
    if (StrEqual(name, "l4d2_survivor_mvp")) g_bMvpAvailable = true;
}

public void OnLibraryRemoved(const char[] name)
{
    if (StrEqual(name, "l4d2_hybrid_scoremod")) g_bScoreModAvailable = false;
    if (StrEqual(name, "l4d2_survivor_mvp")) g_bMvpAvailable = false;
}

public void OnPluginStart()
{
    // CVars with production defaults
    g_cvApiUrl = CreateConVar("l4d2_ranked_api_url", "https://www.l4d2ranked.online/api", "URL of the Ranked API");
    g_cvServerKey = CreateConVar("l4d2_ranked_server_key", "ranked-server-main", "Server authentication key");

    // Admin Commands
    RegAdminCmd("sm_set_match_id", Cmd_SetMatchId, ADMFLAG_CHANGEMAP, "Sets the current match ID");
    RegAdminCmd("sm_ranked_status", Cmd_Status, ADMFLAG_GENERIC, "Shows current match reporter status");
    RegAdminCmd("sm_ranked_force_end", Cmd_ForceEnd, ADMFLAG_ROOT, "Forces match to end with specified winner");
    RegAdminCmd("sm_ranked_test_api", Cmd_TestApi, ADMFLAG_ROOT, "Tests API connectivity");
    RegAdminCmd("sm_ranked_whitelist", Cmd_SetWhitelist, ADMFLAG_ROOT, "Sets SteamID whitelist for match");

    // Event Hooks
    HookEvent("player_death", OnPlayerDeath);
    HookEvent("player_hurt", OnPlayerHurt);
    HookEvent("versus_match_finished", OnMatchFinished);
    HookEvent("round_end", OnRoundEnd);
    HookEvent("player_disconnect", OnPlayerDisconnect, EventHookMode_Pre);
    
    // Admin command for canceling matches
    RegAdminCmd("sm_ranked_cancel_match", Cmd_CancelMatch, ADMFLAG_ROOT, "Cancels match and kicks all players");
    
    // Block spectate commands during matches
    AddCommandListener(Cmd_BlockSpectate, "jointeam");
    RegConsoleCmd("sm_s", Cmd_BlockSpectateCmd, "Blocked during ranked matches");
    RegConsoleCmd("sm_spec", Cmd_BlockSpectateCmd, "Blocked during ranked matches");
    RegConsoleCmd("sm_spectate", Cmd_BlockSpectateCmd, "Blocked during ranked matches");
    
    AutoExecConfig(true, "l4d2_match_reporter");
    
    PrintToServer("[Match Reporter] Plugin loaded v%s", PLUGIN_VERSION);
}

public void OnClientAuthorized(int client, const char[] auth)
{
    // Don't check bots or if whitelist is not active
    if (IsFakeClient(client) || !g_bWhitelistActive)
        return;
    
    // Admins can always join
    if (CheckCommandAccess(client, "sm_ranked_admin", ADMFLAG_ROOT, true))
    {
        PrintToChat(client, "\x04[L4D2 Ranked]\x01 Admin detected. Access granted.");
        return;
    }
    
    // Check if player is in whitelist
    bool isWhitelisted = false;
    for (int i = 0; i < g_iWhitelistCount; i++)
    {
        if (StrEqual(auth, g_sWhitelistedSteamIDs[i], false))
        {
            isWhitelisted = true;
            break;
        }
    }
    
    if (!isWhitelisted)
    {
        PrintToChat(client, "\x04[L4D2 Ranked]\x03 You are not registered for this match.");
        CreateTimer(0.5, Timer_KickUnauthorized, GetClientUserId(client));
    }
}

public Action Timer_KickUnauthorized(Handle timer, int userid)
{
    int client = GetClientOfUserId(userid);
    if (client > 0 && IsClientConnected(client))
    {
        KickClient(client, "You are not registered for this match.");
    }
    return Plugin_Continue;
}


public void OnMapStart()
{
    // ResetPlayerStats(); <-- REMOVED: in Delta Strategy, we reset manually after sending stats at Round End.
    // Making it explicit prevents accidental resets on map change.
    
    // If we don't have a match ID yet, try to get one from the API
    // This handles ZoneMod reloads and plugin reloads
    if (g_sMatchId[0] == '\0')
    {
        PrintToServer("[Match Reporter] No Match ID set. Checking API for assigned match...");
        CreateTimer(5.0, Timer_CheckServerStatus); // Wait for server to stabilize
    }
    
    // Layer 3: Verify Match ID is set after map loads
    CreateTimer(30.0, Timer_CheckMatchIdSet, _, TIMER_FLAG_NO_MAPCHANGE);
}

void ResetPlayerStats()
{
    for (int i = 1; i <= MaxClients; i++)
    {
        g_iPlayerKills[i] = 0;
        g_iPlayerDeaths[i] = 0;
        g_iPlayerDamage[i] = 0;
        g_iPlayerHeadshots[i] = 0;
    }
}

// Layer 3: Verify Match ID is set after map loads
public Action Timer_CheckMatchIdSet(Handle timer)
{
    // Only check if we're on a competitive map
    char sCurrentMap[64];
    GetCurrentMap(sCurrentMap, sizeof(sCurrentMap));
    
    if (!IsCompetitiveMap(sCurrentMap))
        return Plugin_Continue; // Ignore lobby/non-competitive maps
    
    // If Match ID is not set, warn players and admins
    if (g_sMatchId[0] == '\0')
    {
        PrintToServer("[Match Reporter] WARNING: Match ID not set after 30 seconds!");
        PrintToChatAll("\x04[L4D2 Ranked]\x03 ⚠️ WARNING:\x01 Match ID not detected!");
        PrintToChatAll("\x04[L4D2 Ranked]\x01 Admins: Run \x03!ranked_status\x01 to verify.");
        PrintToChatAll("\x04[L4D2 Ranked]\x01 This match may not be scored correctly.");
    }
    
    return Plugin_Continue;
}

// Helper: Check if current map is competitive (not lobby)
bool IsCompetitiveMap(const char[] mapname)
{
    // Most lobby maps start with "l4d_" or contain "lobby" or "ready"
    return !(
        StrContains(mapname, "lobby", false) != -1 ||
        StrContains(mapname, "ready", false) != -1
    );
}

// ------------------------------------------------------------------------
// Commands
// ------------------------------------------------------------------------

public Action Cmd_SetMatchId(int client, int args)
{
    if (args < 1)
    {
        ReplyToCommand(client, "[Match Reporter] Usage: sm_set_match_id <match_id>");
        return Plugin_Handled;
    }

    GetCmdArg(1, g_sMatchId, sizeof(g_sMatchId));
    g_bIsMatchLive = false;
    ResetPlayerStats();
    
    ReplyToCommand(client, "[Match Reporter] Match ID set: %s", g_sMatchId);
    ReplyToCommand(client, "[Match Reporter] Waiting for match to go live...");

    return Plugin_Handled;
}

public Action Cmd_Status(int client, int args)
{
    char sApiUrl[256], sServerKey[64];
    g_cvApiUrl.GetString(sApiUrl, sizeof(sApiUrl));
    g_cvServerKey.GetString(sServerKey, sizeof(sServerKey));
    
    ReplyToCommand(client, "=== Match Reporter Status ===");
    ReplyToCommand(client, "Version: %s", PLUGIN_VERSION);
    ReplyToCommand(client, "API URL: %s", sApiUrl);
    ReplyToCommand(client, "Server Key: %s", sServerKey);
    ReplyToCommand(client, "Match ID: %s", g_sMatchId[0] != '\0' ? g_sMatchId : "(not set)");
    ReplyToCommand(client, "Is Live: %s", g_bIsMatchLive ? "Yes" : "No");
    ReplyToCommand(client, "ScoreMod: %s", g_bScoreModAvailable ? "Available" : "Not Found");
    ReplyToCommand(client, "MVP Plugin: %s", g_bMvpAvailable ? "Available" : "Not Found");
    
    return Plugin_Handled;
}

public Action Cmd_ForceEnd(int client, int args)
{
    if (args < 1)
    {
        ReplyToCommand(client, "[Match Reporter] Usage: sm_ranked_force_end <A|B|DRAW>");
        return Plugin_Handled;
    }
    
    char sWinner[16];
    GetCmdArg(1, sWinner, sizeof(sWinner));
    
    if (!StrEqual(sWinner, "A") && !StrEqual(sWinner, "B") && !StrEqual(sWinner, "DRAW"))
    {
        ReplyToCommand(client, "[Match Reporter] Winner must be A, B, or DRAW");
        return Plugin_Handled;
    }
    
    if (g_sMatchId[0] == '\0')
    {
        ReplyToCommand(client, "[Match Reporter] No match ID set! Use sm_set_match_id first.");
        return Plugin_Handled;
    }
    
    ReplyToCommand(client, "[Match Reporter] Forcing match end. Winner: %s", sWinner);
    SendMatchComplete(sWinner);
    
    return Plugin_Handled;
}

public Action Cmd_TestApi(int client, int args)
{
    char sUrl[256];
    g_cvApiUrl.GetString(sUrl, sizeof(sUrl));
    
    char sRequestUrl[512];
    Format(sRequestUrl, sizeof(sRequestUrl), "%s/server/check-match", sUrl);
    
    ReplyToCommand(client, "[Match Reporter] Testing API at: %s", sRequestUrl);
    
    Handle hRequest = SteamWorks_CreateHTTPRequest(k_EHTTPMethodGET, sRequestUrl);
    if (hRequest == INVALID_HANDLE)
    {
        ReplyToCommand(client, "[Match Reporter] ERROR: Failed to create HTTP request");
        return Plugin_Handled;
    }
    
    SteamWorks_SetHTTPCallbacks(hRequest, OnTestApiResponse);
    SteamWorks_SetHTTPRequestContextValue(hRequest, client);
    
    if (!SteamWorks_SendHTTPRequest(hRequest))
    {
        ReplyToCommand(client, "[Match Reporter] ERROR: Failed to send HTTP request");
        CloseHandle(hRequest);
        return Plugin_Handled;
    }
    
    ReplyToCommand(client, "[Match Reporter] Request sent, waiting for response...");
    return Plugin_Handled;
}

public void OnTestApiResponse(Handle hRequest, bool bFailure, bool bSuccessful, EHTTPStatusCode eStatusCode, int client)
{
    if (bFailure || !bSuccessful)
    {
        PrintToServer("[Match Reporter] API Test FAILED - Connection error");
        if (client > 0 && IsClientInGame(client)) 
            PrintToChat(client, "\x04[Match Reporter]\x01 API Test \x03FAILED\x01 - Connection error");
    }
    else
    {
        PrintToServer("[Match Reporter] API Test SUCCESS - Status: %d", eStatusCode);
        if (client > 0 && IsClientInGame(client)) 
            PrintToChat(client, "\x04[Match Reporter]\x01 API Test \x05SUCCESS\x01 - Status: %d", eStatusCode);
    }
    
    CloseHandle(hRequest);
}

public Action Cmd_SetWhitelist(int client, int args)
{
    if (args < 1)
    {
        ReplyToCommand(client, "[Match Reporter] Usage: sm_ranked_whitelist <steamid1> [steamid2] [steamid3] ...");
        ReplyToCommand(client, "[Match Reporter] Or: sm_ranked_whitelist clear");
        return Plugin_Handled;
    }
    
    char arg[32];
    GetCmdArg(1, arg, sizeof(arg));
    
    // Clear whitelist
    if (StrEqual(arg, "clear", false))
    {
        g_iWhitelistCount = 0;
        g_bWhitelistActive = false;
        ServerCommand("sv_visiblemaxplayers 0"); // Reset to default
        ReplyToCommand(client, "[Match Reporter] Whitelist cleared.");
        return Plugin_Handled;
    }
    
    // Set whitelist
    g_iWhitelistCount = 0;
    for (int i = 1; i <= args && i <= 8; i++)
    {
        GetCmdArg(i, g_sWhitelistedSteamIDs[g_iWhitelistCount], 32);
        g_iWhitelistCount++;
    }
    
    g_bWhitelistActive = true;
    ServerCommand("sv_visiblemaxplayers 8"); // Limit to 8 visible slots
    
    // Reset connected tracking
    for (int j = 0; j < 8; j++)
    {
        g_bPlayerConnected[j] = false;
    }
    
    // Start the 5-minute join timeout timer
    if (g_hJoinTimeoutTimer != null)
    {
        KillTimer(g_hJoinTimeoutTimer);
    }
    g_hJoinTimeoutTimer = CreateTimer(JOIN_TIMEOUT_SECONDS, Timer_JoinTimeout, _, TIMER_FLAG_NO_MAPCHANGE);
    
    ReplyToCommand(client, "[Match Reporter] Whitelist set with %d SteamIDs.", g_iWhitelistCount);
    ReplyToCommand(client, "[Match Reporter] Server slots limited to 8 players.");
    ReplyToCommand(client, "[Match Reporter] Players have 5 minutes to connect.");
    
    return Plugin_Handled;
}

// Timer: Join Timeout - Check if all players connected
public Action Timer_JoinTimeout(Handle timer)
{
    g_hJoinTimeoutTimer = null;
    
    if (!g_bWhitelistActive || g_sMatchId[0] == '\0')
        return Plugin_Stop;
    
    // Find players who didn't connect
    bool anyMissing = false;
    for (int i = 0; i < g_iWhitelistCount; i++)
    {
        if (!g_bPlayerConnected[i])
        {
             anyMissing = true;
             PrintToServer("[Match Reporter] Player %s did not connect in time!", g_sWhitelistedSteamIDs[i]);
             
             // Report to API for ban
             ReportPlayerEvent(g_sWhitelistedSteamIDs[i], "NO_JOIN_TIMEOUT", "Did not connect to server in time");
        }
    }

    if (anyMissing) {
        PrintToChatAll("\x04[L4D2 Ranked]\x03 A player did not connect in time. Cancelling match in 3 seconds...");
        CreateTimer(3.0, Timer_DelayedCancel);
    }
    
    return Plugin_Stop;
}

public Action Timer_DelayedCancel(Handle timer)
{
    PerformMatchCancellation("Join Timeout - Not all players connected");
    return Plugin_Stop;
}


// Track when whitelisted players connect
public void OnClientPutInServer(int client)
{
    if (!g_bWhitelistActive || IsFakeClient(client))
        return;
    
    char sSteamId[32];
    // IMPORTANT: Web sends SteamID64 (e.g. 76561198...), so we must match that format
    GetClientAuthId(client, AuthId_SteamID64, sSteamId, sizeof(sSteamId));
    
    // Check if this player is on the whitelist
    for (int i = 0; i < g_iWhitelistCount; i++)
    {
        if (StrEqual(sSteamId, g_sWhitelistedSteamIDs[i]))
        {
            // Mark as connected
            g_bPlayerConnected[i] = true;
            
            PrintToServer("[Match Reporter] Whitelisted player connected: %s", sSteamId);
            PrintToChatAll("\x04[L4D2 Ranked]\x01 Player \x03%N\x01 connected (%d/%d)", client, CountConnectedPlayers(), g_iWhitelistCount);
            
            // Report to API
            ReportPlayerEvent(sSteamId, "PLAYER_CONNECT", "Player connected to server");
            
            // Check if all players have connected
            if (CountConnectedPlayers() >= g_iWhitelistCount)
            {
                PrintToChatAll("\x04[L4D2 Ranked]\x05 All players connected!");
                
                // Cancel the timeout timer since everyone is here
                if (g_hJoinTimeoutTimer != null)
                {
                    KillTimer(g_hJoinTimeoutTimer);
                    g_hJoinTimeoutTimer = null;
                }
            }
            return;
        }
    }
}

// Helper: Count how many whitelisted players have connected
int CountConnectedPlayers()
{
    int count = 0;
    for (int i = 0; i < g_iWhitelistCount; i++)
    {
        if (g_bPlayerConnected[i])
            count++;
    }
    return count;
}

// ------------------------------------------------------------------------
// Block Spectate Commands During Match
// ------------------------------------------------------------------------

public Action Cmd_BlockSpectate(int client, const char[] command, int argc)
{
    // Allow if no match is active
    if (!g_bIsMatchLive || g_sMatchId[0] == '\0')
        return Plugin_Continue;
    
    // Allow admins to spectate for moderation purposes
    if (CheckCommandAccess(client, "sm_ranked_admin", ADMFLAG_ROOT, true))
        return Plugin_Continue;
    
    // Check if jointeam command is trying to go to spectator
    if (StrEqual(command, "jointeam", false))
    {
        if (argc >= 1)
        {
            char sArg[8];
            GetCmdArg(1, sArg, sizeof(sArg));
            int team = StringToInt(sArg);
            
            // Block team 1 (spectator)
            if (team == 1)
            {
                PrintToChat(client, "\x04[L4D2 Ranked]\x03 You cannot spectate during an active match!");
                PrintToChat(client, "\x04[L4D2 Ranked]\x01 Leaving your team may result in penalties.");
                return Plugin_Handled;
            }
        }
        return Plugin_Continue;
    }
    
    // Block sm_s, sm_spec, sm_spectate
    PrintToChat(client, "\x04[L4D2 Ranked]\x03 Spectate commands are disabled during ranked matches!");
    PrintToChat(client, "\x04[L4D2 Ranked]\x01 You must stay with your team until the match ends.");
    return Plugin_Handled;
}


// ... (Events section omitted, it's fine) ...




// Wrapper for RegConsoleCmd (different signature than AddCommandListener)
public Action Cmd_BlockSpectateCmd(int client, int args)
{
    // Allow if no match is active
    if (!g_bIsMatchLive || g_sMatchId[0] == '\0')
        return Plugin_Continue;
    
    // Allow admins
    if (CheckCommandAccess(client, "sm_ranked_admin", ADMFLAG_ROOT, true))
        return Plugin_Continue;
    
    PrintToChat(client, "\x04[L4D2 Ranked]\x03 Spectate commands are disabled during ranked matches!");
    PrintToChat(client, "\x04[L4D2 Ranked]\x01 You must stay with your team until the match ends.");
    return Plugin_Handled;
}


// ------------------------------------------------------------------------
// ReadyUp Forward - Match Goes Live
// ------------------------------------------------------------------------

public void OnRoundIsLive()
{
    if (g_sMatchId[0] != '\0' && !g_bIsMatchLive)
    {
        g_bIsMatchLive = true;
        PrintToServer("[Match Reporter] Match is LIVE! ID: %s", g_sMatchId);
        
        // === START SOURCETV DEMO RECORDING ===
        if (!g_bDemoRecording)
        {
            // Format demo filename with match ID
            Format(g_sDemoFilename, sizeof(g_sDemoFilename), "match-%s.dem", g_sMatchId);
            
            // Start recording (without .dem extension, engine adds it)
            char demoName[128];
            Format(demoName, sizeof(demoName), "match-%s", g_sMatchId);
            ServerCommand("tv_record \"%s\"", demoName);
            
            g_bDemoRecording = true;
            PrintToServer("[Match Reporter] Started SourceTV recording: %s", g_sDemoFilename);
            PrintToChatAll("\x04[L4D2 Ranked]\x01 📹 Demo recording started!");
        }
        
        // === PROMINENT LIVE MATCH ANNOUNCEMENT ===
        PrintToChatAll("");
        PrintToChatAll("\x04╔══════════════════════════════════════╗");
        PrintToChatAll("\x04║  \x05L4D2 RANKING ONLINE - LIVE MATCH\x04   ║");
        PrintToChatAll("\x04╚══════════════════════════════════════╝");
        PrintToChatAll("\x04[L4D2 Ranked]\x01 Match ID: \x03%s", g_sMatchId);
        PrintToChatAll("\x04[L4D2 Ranked]\x01 Para reportar problemas, anota el ID del match.");
        PrintToChatAll("");
        
        SendMatchLive();
    }
}

// ------------------------------------------------------------------------
// Event Handlers - Track Stats
// ------------------------------------------------------------------------

public void OnPlayerDeath(Event event, const char[] name, bool dontBroadcast)
{
    int victim = GetClientOfUserId(event.GetInt("userid"));
    int attacker = GetClientOfUserId(event.GetInt("attacker"));
    bool headshot = event.GetBool("headshot");
    
    if (victim > 0 && victim <= MaxClients && IsClientInGame(victim))
    {
        g_iPlayerDeaths[victim]++;
    }
    
    if (attacker > 0 && attacker <= MaxClients && IsClientInGame(attacker))
    {
        g_iPlayerKills[attacker]++;
        if (headshot) g_iPlayerHeadshots[attacker]++;
    }
}

public void OnPlayerHurt(Event event, const char[] name, bool dontBroadcast)
{
    int attacker = GetClientOfUserId(event.GetInt("attacker"));
    int damage = event.GetInt("dmg_health");
    
    if (attacker > 0 && attacker <= MaxClients && IsClientInGame(attacker))
    {
        g_iPlayerDamage[attacker] += damage;
    }
}

public void OnRoundEnd(Event event, const char[] name, bool dontBroadcast)
{
    // Auto-detect competitive match completion
    if (!g_bIsMatchLive || g_sMatchId[0] == '\0')
        return;
    
    // Get current map
    char sCurrentMap[64];
    GetCurrentMap(sCurrentMap, sizeof(sCurrentMap));
    
    // Check if this is the last competitive map (penultimate map before finale)
    if (IsCompetitiveFinalMap(sCurrentMap))
    {
        // Check if we're in the second half (about to finish this map)
        if (InSecondHalfOfRound())
        {
            // === MATCH IS ENDING ===
            PrintToServer("[Match Reporter] Competitive campaign complete! Waiting 5 seconds to determine winner...");
            PrintToChatAll("");
            PrintToChatAll("\x04[L4D2 Ranked]\x05 ¡PARTIDA TERMINADA!");
            PrintToChatAll("\x04[L4D2 Ranked]\x03 ⚠️ NO DESCONECTARSE ⚠️");
            PrintToChatAll("\x04[L4D2 Ranked]\x01 Esperando resultados para calcular ELO...");
            PrintToChatAll("");
            
            CreateTimer(5.0, Timer_AutoEndMatch, _, TIMER_FLAG_NO_MAPCHANGE);
        }
        else
        {
            // === FIRST HALF OF LAST MAP - Show warning ===
            PrintToChatAll("");
            PrintToChatAll("\x04[L4D2 Ranked]\x05 ¡ÚLTIMO MAPA!");
            PrintToChatAll("\x04[L4D2 Ranked]\x03 ⚠️ NO DESCONECTARSE HASTA QUE TERMINE ⚠️");
            PrintToChatAll("\x04[L4D2 Ranked]\x01 Al finalizar, recibirán sus puntos de ELO.");
            PrintToChatAll("");
        }
    }
    
    // Always send round stats at the end of every round/map
    // This ensures that even if the match isn't over, we save the progress
    SendRoundStats();
    ResetPlayerStats(); // RESET STATS NOW (Delta Strategy)
}

// Helper: Check if we're in the second half of the round
bool InSecondHalfOfRound()
{
    return GameRules_GetProp("m_bInSecondHalfOfRound", 1) != 0;
}

// ========================================
// AUTO-DETECT COMPETITIVE MATCH COMPLETION
// ========================================

// Checks if current map is the last competitive map (penultimate, before finale)
bool IsCompetitiveFinalMap(const char[] currentMap)
{
    return (
        // ===== L4D2 Official Campaigns =====
        StrEqual(currentMap, "c1m3_mall") ||        // Dead Center (4 maps, play 3)
        StrEqual(currentMap, "c2m4_barns") ||       // Dark Carnival (5 maps, play 4)
        StrEqual(currentMap, "c3m3_shantytown") ||  // Swamp Fever (4 maps, play 3)
        StrEqual(currentMap, "c4m4_milltown_b") ||  // Hard Rain (5 maps, play 4)
        StrEqual(currentMap, "c5m4_quarter") ||     // The Parish (5 maps, play 4)
        StrEqual(currentMap, "c6m2_bedlam") ||      // The Passing (3 maps, play 2)
        StrEqual(currentMap, "c7m2_barge") ||       // The Sacrifice (3 maps, play 2)
        
        // ===== L4D1 Campaigns (Ported to L4D2) =====
        StrEqual(currentMap, "c8m4_interior") ||    // No Mercy (5 maps, play 4)
        StrEqual(currentMap, "c9m1_alleys") ||      // Crash Course (2 maps, play 1)
        StrEqual(currentMap, "c10m4_mainstreet") || // Death Toll (5 maps, play 4)
        StrEqual(currentMap, "c11m4_terminal") ||   // Dead Air (5 maps, play 4)
        StrEqual(currentMap, "c12m4_barn") ||       // Blood Harvest (5 maps, play 4)
        StrEqual(currentMap, "c13m3_memorialbridge") || // Cold Stream (4 maps, play 3)
        StrEqual(currentMap, "c14m1_junkyard")      // The Last Stand (2 maps, play 1)
    );
}

// Timer callback to determine winner automatically after competitive campaign ends


// ------------------------------------------------------------------------
// Incremental Stats Reporting
// ------------------------------------------------------------------------

void SendRoundStats()
{
    if (g_sMatchId[0] == '\0') return;

    char sJson[MAX_JSON_SIZE];
    
    // Start JSON building
    Format(sJson, sizeof(sJson), "{");
    Format(sJson, sizeof(sJson), "%s\"match_id\":\"%s\",", sJson, g_sMatchId);
    Format(sJson, sizeof(sJson), "%s\"server_key\":\"%s\",", sJson, g_cvServerKey);
    
    // Get map name
    char sMap[64];
    GetCurrentMap(sMap, sizeof(sMap));
    Format(sJson, sizeof(sJson), "%s\"map_name\":\"%s\",", sJson, sMap);
    
    // Get Round Number (simple approximation or from gamerules if possible, for now just report stats)
    // We'll let the API handle round counting or just logging
    
    // Players Array
    Format(sJson, sizeof(sJson), "%s\"players\":[", sJson);
    
    bool first = true;
    for (int i = 1; i <= MaxClients; i++)
    {
        if (IsClientInGame(i) && !IsFakeClient(i))
        {
            char sAuth[32];
            if (!GetClientAuthId(i, AuthId_Steam2, sAuth, sizeof(sAuth))) continue;
            
            if (!first) Format(sJson, sizeof(sJson), "%s,", sJson);
            first = false;
            
            // Check for MVP in this round
            int mvpValue = 0;
            if (g_bMvpAvailable && GetClientTeam(i) == TEAM_SURVIVOR)
            {
                // SURVMVP_GetMVP returns the client index of the MVP
                if (i == SURVMVP_GetMVP()) mvpValue = 1;
            }

            Format(sJson, sizeof(sJson), "%s{", sJson);
            Format(sJson, sizeof(sJson), "%s\"steam_id\":\"%s\",", sJson, sAuth);
            Format(sJson, sizeof(sJson), "%s\"kills\":%d,", sJson, g_iPlayerKills[i]);
            Format(sJson, sizeof(sJson), "%s\"deaths\":%d,", sJson, g_iPlayerDeaths[i]);
            Format(sJson, sizeof(sJson), "%s\"headshots\":%d,", sJson, g_iPlayerHeadshots[i]);
            Format(sJson, sizeof(sJson), "%s\"damage\":%d,", sJson, g_iPlayerDamage[i]);
            Format(sJson, sizeof(sJson), "%s\"mvp\":%d", sJson, mvpValue);
            Format(sJson, sizeof(sJson), "%s}", sJson);
        }
    }
    
    Format(sJson, sizeof(sJson), "%s]", sJson); // End players
    Format(sJson, sizeof(sJson), "%s}", sJson); // End root
    
    // PrintToServer("[Match Reporter] Sending round stats: %s", sJson); // Debug (spammy)

    // Send Request
    char sApiUrl[256];
    g_cvApiUrl.GetString(sApiUrl, sizeof(sApiUrl));
    
    char sRequestUrl[512];
    Format(sRequestUrl, sizeof(sRequestUrl), "%s/server/round-stats", sApiUrl);
    
    Handle hRequest = SteamWorks_CreateHTTPRequest(k_EHTTPMethodPOST, sRequestUrl);
    if (hRequest == INVALID_HANDLE) return;
    
    SteamWorks_SetHTTPRequestHeaderValue(hRequest, "Content-Type", "application/json");
    // SteamWorks_SetHTTPRequestBody(hRequest, sJson); // New API, might be missing
    SteamWorks_SetHTTPRequestRawPostBody(hRequest, "application/json", sJson, strlen(sJson)); // Old API, more compatible
    
    SteamWorks_SetHTTPCallbacks(hRequest, OnRoundStatsResponse);
    SteamWorks_SendHTTPRequest(hRequest);
}

public void OnRoundStatsResponse(Handle hRequest, bool bFailure, bool bRequestSuccessful, EHTTPStatusCode eStatusCode, int data)
{
    if (bFailure || !bRequestSuccessful || view_as<int>(eStatusCode) != 200)
    {
        PrintToServer("[Match Reporter] Failed to save round stats. Status: %d", eStatusCode);
    }
    else
    {
        PrintToServer("[Match Reporter] Round stats saved successfully.");
    }
    delete hRequest;
}

    

// Timer callback to determine winner automatically after competitive campaign ends
public Action Timer_AutoEndMatch(Handle timer)
{
    if (g_sMatchId[0] == '\0')
    {
        PrintToServer("[Match Reporter] Timer fired but no match ID set");
        return Plugin_Continue;
    }
    
    // Get campaign scores using Left4DHooks
    int teamAScore = 0;
    int teamBScore = 0;
    
    // Use the native we declared manually
    if (!L4D2_GetVersusCampaignScores(teamAScore, teamBScore))
    {
        PrintToServer("[Match Reporter] Failed to get campaign scores from Left4DHooks");
    }
    
    // Determine winner
    char sWinner[16];
    if (teamAScore > teamBScore)
    {
        strcopy(sWinner, sizeof(sWinner), "A");
        PrintToServer("[Match Reporter] Auto-end: Team A wins! (Score: A=%d, B=%d)", teamAScore, teamBScore);
    }
    else if (teamBScore > teamAScore)
    {
        strcopy(sWinner, sizeof(sWinner), "B");
        PrintToServer("[Match Reporter] Auto-end: Team B wins! (Score: A=%d, B=%d)", teamAScore, teamBScore);
    }
    else
    {
        strcopy(sWinner, sizeof(sWinner), "DRAW");
        PrintToServer("[Match Reporter] Auto-end: Draw! (Score: A=%d, B=%d)", teamAScore, teamBScore);
    }
    
    // Send match results
    SendMatchComplete(sWinner);
    
    return Plugin_Stop;
}

public void OnMatchFinished(Event event, const char[] name, bool dontBroadcast)
{
    if (g_sMatchId[0] == '\0')
    {
        PrintToServer("[Match Reporter] Match finished but no match ID set - ignoring");
        return;
    }
    
    int winner = event.GetInt("winner");
    char sWinner[16];
    
    // In L4D2, winner is team index: 2 = Survivors, 3 = Infected
    if (winner == TEAM_SURVIVOR)
        strcopy(sWinner, sizeof(sWinner), "A");
    else if (winner == TEAM_INFECTED)
        strcopy(sWinner, sizeof(sWinner), "B");
    else
        strcopy(sWinner, sizeof(sWinner), "DRAW");
    
    PrintToServer("[Match Reporter] Match finished! Winner: %s (team %d)", sWinner, winner);
    SendMatchComplete(sWinner);
}

// ------------------------------------------------------------------------
// API Calls - Manual JSON Building (No external dependencies)
// ------------------------------------------------------------------------

void SendMatchLive()
{
    char sUrl[256], sServerKey[64];
    g_cvApiUrl.GetString(sUrl, sizeof(sUrl));
    g_cvServerKey.GetString(sServerKey, sizeof(sServerKey));
    
    char sRequestUrl[512];
    Format(sRequestUrl, sizeof(sRequestUrl), "%s/server/notify-live", sUrl);

    // Build JSON manually
    char sJsonBody[1024];
    Format(sJsonBody, sizeof(sJsonBody), 
        "{\"server_key\":\"%s\",\"match_id\":\"%s\"}", 
        sServerKey, g_sMatchId);

    Handle hRequest = SteamWorks_CreateHTTPRequest(k_EHTTPMethodPOST, sRequestUrl);
    if (hRequest == INVALID_HANDLE)
    {
        PrintToServer("[Match Reporter] ERROR: Failed to create HTTP request for notify-live");
        return;
    }

    SteamWorks_SetHTTPRequestRawPostBody(hRequest, "application/json", sJsonBody, strlen(sJsonBody));
    SteamWorks_SetHTTPCallbacks(hRequest, OnMatchLiveResponse);
    
    if (!SteamWorks_SendHTTPRequest(hRequest))
    {
        PrintToServer("[Match Reporter] ERROR: Failed to send notify-live request");
        CloseHandle(hRequest);
        return;
    }
    
    PrintToServer("[Match Reporter] Sent notify-live to API");
}

public void OnMatchLiveResponse(Handle hRequest, bool bFailure, bool bSuccessful, EHTTPStatusCode eStatusCode, int data)
{
    if (bFailure || !bSuccessful)
    {
        PrintToServer("[Match Reporter] notify-live FAILED - Connection error");
    }
    else if (view_as<int>(eStatusCode) >= 200 && view_as<int>(eStatusCode) < 300)
    {
        PrintToServer("[Match Reporter] notify-live SUCCESS - Status: %d", eStatusCode);
    }
    else
    {
        PrintToServer("[Match Reporter] notify-live ERROR - Status: %d", eStatusCode);
    }
    
    CloseHandle(hRequest);
}

void SendMatchComplete(const char[] winner)
{
    char sUrl[256], sServerKey[64];
    g_cvApiUrl.GetString(sUrl, sizeof(sUrl));
    g_cvServerKey.GetString(sServerKey, sizeof(sServerKey));
    
    char sRequestUrl[512];
    Format(sRequestUrl, sizeof(sRequestUrl), "%s/server/match-end", sUrl);

    // Build players JSON array manually
    char sPlayersJson[4096];
    sPlayersJson[0] = '\0';
    
    bool bFirstPlayer = true;
    
    for (int i = 1; i <= MaxClients; i++)
    {
        if (!IsClientInGame(i) || IsFakeClient(i)) continue;
        
        char sSteamId[32];
        if (!GetClientAuthId(i, AuthId_SteamID64, sSteamId, sizeof(sSteamId))) continue;
        
        int team = GetClientTeam(i);
        if (team != TEAM_SURVIVOR && team != TEAM_INFECTED) continue;
        
        // Add comma separator if not first player
        if (!bFirstPlayer)
        {
            StrCat(sPlayersJson, sizeof(sPlayersJson), ",");
        }
        bFirstPlayer = false;
        
        // Check if this player is MVP (based on SI damage)
        int mvpValue = 0;
        if (g_bMvpAvailable && team == TEAM_SURVIVOR)
        {
            int mvpPlayer = SURVMVP_GetMVP();
            if (i == mvpPlayer) mvpValue = 1;  // This player is the MVP
        }
        
        // Build player JSON object
        char sPlayerJson[256];
        Format(sPlayerJson, sizeof(sPlayerJson),
            "{\"steam_id\":\"%s\",\"team\":%d,\"kills\":%d,\"deaths\":%d,\"damage\":%d,\"headshots\":%d,\"mvp\":%d}",
            sSteamId,
            team == TEAM_SURVIVOR ? 1 : 2,
            g_iPlayerKills[i],
            g_iPlayerDeaths[i],
            g_iPlayerDamage[i],
            g_iPlayerHeadshots[i],
            mvpValue
        );
        
        StrCat(sPlayersJson, sizeof(sPlayersJson), sPlayerJson);
    }
    
    // Build complete JSON body (with demo_filename if recording)
    char sJsonBody[MAX_JSON_SIZE];
    if (g_bDemoRecording && g_sDemoFilename[0] != '\0')
    {
        Format(sJsonBody, sizeof(sJsonBody),
            "{\"server_key\":\"%s\",\"match_id\":\"%s\",\"winner\":\"%s\",\"demo_filename\":\"%s\",\"players\":[%s]}",
            sServerKey, g_sMatchId, winner, g_sDemoFilename, sPlayersJson);
    }
    else
    {
        Format(sJsonBody, sizeof(sJsonBody),
            "{\"server_key\":\"%s\",\"match_id\":\"%s\",\"winner\":\"%s\",\"players\":[%s]}",
            sServerKey, g_sMatchId, winner, sPlayersJson);
    }

    Handle hRequest = SteamWorks_CreateHTTPRequest(k_EHTTPMethodPOST, sRequestUrl);
    if (hRequest == INVALID_HANDLE)
    {
        PrintToServer("[Match Reporter] ERROR: Failed to create HTTP request for match-end");
        return;
    }

    SteamWorks_SetHTTPRequestRawPostBody(hRequest, "application/json", sJsonBody, strlen(sJsonBody));
    SteamWorks_SetHTTPCallbacks(hRequest, OnMatchCompleteResponse);
    
    if (!SteamWorks_SendHTTPRequest(hRequest))
    {
        PrintToServer("[Match Reporter] ERROR: Failed to send match-end request");
        CloseHandle(hRequest);
        return;
    }
    
    PrintToServer("[Match Reporter] Sent match-end to API. Winner: %s", winner);
    PrintToServer("[Match Reporter] Payload: %s", sJsonBody);
    
    // Stop SourceTV recording if active
    if (g_bDemoRecording)
    {
        ServerCommand("tv_stoprecord");
        PrintToServer("[Match Reporter] Stopped SourceTV recording: %s", g_sDemoFilename);
        g_bDemoRecording = false;
        g_sDemoFilename[0] = '\0';
    }
    
    // Clear match state
    g_sMatchId[0] = '\0';
    g_bIsMatchLive = false;
    ResetPlayerStats();
}

public void OnMatchCompleteResponse(Handle hRequest, bool bFailure, bool bSuccessful, EHTTPStatusCode eStatusCode, int data)
{
    if (bFailure || !bSuccessful)
    {
        PrintToServer("[Match Reporter] match-end FAILED - Connection error");
    }
    else if (view_as<int>(eStatusCode) >= 200 && view_as<int>(eStatusCode) < 300)
    {
        PrintToServer("[Match Reporter] match-end SUCCESS - Status: %d", eStatusCode);
        PrintToChatAll("\x04[L4D2 Ranked]\x01 Match results submitted successfully!");
        PrintToChatAll("\x04[L4D2 Ranked]\x01 Server will reset in 10 seconds...");
        
        // Schedule server cleanup after a delay so players can see the message
        CreateTimer(10.0, Timer_ResetServer);
    }
    else
    {
        PrintToServer("[Match Reporter] match-end ERROR - Status: %d", eStatusCode);
        PrintToChatAll("\x04[L4D2 Ranked]\x01 \x03Error submitting match results. Please contact admin.\x01");
    }
    
    CloseHandle(hRequest);
}

public Action Timer_ResetServer(Handle timer)
{
    PrintToServer("[Match Reporter] Resetting server for next match...");
    
    // Kick all players with a message
    for (int i = 1; i <= MaxClients; i++)
    {
        if (IsClientConnected(i) && !IsFakeClient(i))
        {
            KickClient(i, "Match ended. Thank you for playing L4D2 Ranked!");
        }
    }
    
    // Reset the competitive config (unload ZoneMod/Confogl)
    // This uses the standard Confogl command to reset
    ServerCommand("sm_resetmatch");
    
    // Also clear our internal state
    g_sMatchId[0] = '\0';
    g_bIsMatchLive = false;
    ResetPlayerStats();
    
    // Clear whitelist
    g_iWhitelistCount = 0;
    g_bWhitelistActive = false;
    ServerCommand("sv_visiblemaxplayers 0"); // Reset to default
    PrintToServer("[Match Reporter] Whitelist cleared, server ready for next match.");
    
    return Plugin_Continue;
}

// ============================================================================
// AUTO-BAN SYSTEM: Player Disconnect Reporting
// ============================================================================

public Action OnPlayerDisconnect(Event hEvent, const char[] sEventName, bool dontBroadcast)
{
    // Only report if match is active
    if (!g_bIsMatchLive || g_sMatchId[0] == '\0')
        return Plugin_Continue;
    
    int client = GetClientOfUserId(hEvent.GetInt("userid"));
    if (client <= 0 || IsFakeClient(client))
        return Plugin_Continue;
    
    char sSteamId[32], sReason[128];
    GetClientAuthId(client, AuthId_Steam2, sSteamId, sizeof(sSteamId));
    hEvent.GetString("reason", sReason, sizeof(sReason));
    
    // Detect crash vs intentional leave
    char sTimedOut[64];
    Format(sTimedOut, sizeof(sTimedOut), "%N timed out", client);
    
    bool bIsCrash = (StrContains(sReason, "timed out") != -1 || StrEqual(sReason, "No Steam logon"));
    
    PrintToServer("[Match Reporter] Player %N disconnected: %s (Crash: %s)", client, sReason, bIsCrash ? "Yes" : "No");
    PrintToChatAll("\x04[L4D2 Ranked]\x01 Player \x03%N\x01 disconnected: %s", client, bIsCrash ? "Connection lost" : "Left the game");
    
    // Report to API
    ReportPlayerEvent(sSteamId, bIsCrash ? "PLAYER_CRASH" : "PLAYER_DISCONNECT", sReason);
    
    return Plugin_Continue;
}

void ReportPlayerEvent(const char[] sSteamId, const char[] sEvent, const char[] sReason)
{
    char sApiUrl[256], sServerKey[64];
    g_cvApiUrl.GetString(sApiUrl, sizeof(sApiUrl));
    g_cvServerKey.GetString(sServerKey, sizeof(sServerKey));
    
    // Build URL
    char sRequestUrl[512];
    Format(sRequestUrl, sizeof(sRequestUrl), "%s/server/events", sApiUrl);
    
    Handle hRequest = SteamWorks_CreateHTTPRequest(k_EHTTPMethodPOST, sRequestUrl);
    if (hRequest == INVALID_HANDLE)
    {
        PrintToServer("[Match Reporter] Failed to create event request");
        return;
    }
    
    // Build JSON body
    char sBody[512];
    Format(sBody, sizeof(sBody), "{\"event\":\"%s\",\"steamId\":\"%s\",\"matchId\":\"%s\",\"reason\":\"%s\"}", 
        sEvent, sSteamId, g_sMatchId, sReason);
    
    SteamWorks_SetHTTPRequestHeaderValue(hRequest, "Content-Type", "application/json");
    SteamWorks_SetHTTPRequestHeaderValue(hRequest, "Authorization", sServerKey);
    SteamWorks_SetHTTPRequestRawPostBody(hRequest, "application/json", sBody, strlen(sBody));
    SteamWorks_SetHTTPCallbacks(hRequest, OnEventReportResponse);
    SteamWorks_SendHTTPRequest(hRequest);
}

public void OnEventReportResponse(Handle hRequest, bool bFailure, bool bRequestSuccessful, EHTTPStatusCode eStatusCode, int data)
{
    if (bFailure || !bRequestSuccessful || view_as<int>(eStatusCode) < 200 || view_as<int>(eStatusCode) >= 300)
    {
        PrintToServer("[Match Reporter] Event report failed (status: %d)", eStatusCode);
    }
    else
    {
        PrintToServer("[Match Reporter] Event reported successfully");
    }
    delete hRequest;
}

// ============================================================================
// ADMIN COMMAND: Cancel Match
// ============================================================================

public Action Cmd_CancelMatch(int client, int args)
{
    if (g_sMatchId[0] == '\0')
    {
        ReplyToCommand(client, "[Ranked] No active match to cancel.");
        return Plugin_Handled;
    }
    
    char sReason[128] = "Admin cancelled match";
    if (args >= 1)
    {
        GetCmdArgString(sReason, sizeof(sReason));
    }
    
    PerformMatchCancellation(sReason);
    
    ReplyToCommand(client, "[Ranked] Match cancelled and server reset.");
    return Plugin_Handled;
}

// Internal reusable function
void PerformMatchCancellation(const char[] sReason) 
{
    PrintToChatAll("\x04[L4D2 Ranked]\x01 Match cancelled: \x03%s", sReason);
    PrintToServer("[Match Reporter] Match cancelled: %s", sReason);
    
    // Kick all players
    for (int i = 1; i <= MaxClients; i++)
    {
        if (IsClientConnected(i) && !IsFakeClient(i))
        {
            KickClient(i, "Match cancelled: %s", sReason);
        }
    }
    
    // Reset server state
    g_sMatchId[0] = '\0';
    g_bIsMatchLive = false;
    ResetPlayerStats();
    g_iWhitelistCount = 0;
    g_bWhitelistActive = false;
    
    ServerCommand("sm_resetmatch");
}


