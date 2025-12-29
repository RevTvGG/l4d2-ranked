#include <sourcemod>
#include <sdktools>
#include <steamworks>
#include <readyup>

#undef REQUIRE_PLUGIN
#include <l4d2_hybrid_scoremod>
#include <l4d2_survivor_mvp>
#define REQUIRE_PLUGIN

#pragma semicolon 1
#pragma newdecls required

#define PLUGIN_VERSION "2.0.1"

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

// Player Stats Storage
int g_iPlayerKills[MAXPLAYERS + 1];
int g_iPlayerDeaths[MAXPLAYERS + 1];
int g_iPlayerDamage[MAXPLAYERS + 1];
int g_iPlayerHeadshots[MAXPLAYERS + 1];

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
    
    if (eStatusCode >= 200 && eStatusCode < 300)

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

    // Event Hooks
    HookEvent("player_death", OnPlayerDeath);
    HookEvent("player_hurt", OnPlayerHurt);
    HookEvent("versus_match_finished", OnMatchFinished);
    HookEvent("round_end", OnRoundEnd);
    
    AutoExecConfig(true, "l4d2_match_reporter");
    
    PrintToServer("[Match Reporter] Plugin loaded v%s", PLUGIN_VERSION);
}

public void OnMapStart()
{
    ResetPlayerStats();
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

// ------------------------------------------------------------------------
// ReadyUp Forward - Match Goes Live
// ------------------------------------------------------------------------

public void OnRoundIsLive()
{
    if (g_sMatchId[0] != '\0' && !g_bIsMatchLive)
    {
        g_bIsMatchLive = true;
        PrintToServer("[Match Reporter] Match is LIVE! ID: %s", g_sMatchId);
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
    // Could send round stats here if needed
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
    else if (eStatusCode >= 200 && eStatusCode < 300)
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
    
    // Build complete JSON body
    char sJsonBody[MAX_JSON_SIZE];
    Format(sJsonBody, sizeof(sJsonBody),
        "{\"server_key\":\"%s\",\"match_id\":\"%s\",\"winner\":\"%s\",\"players\":[%s]}",
        sServerKey, g_sMatchId, winner, sPlayersJson);

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
    else if (eStatusCode >= 200 && eStatusCode < 300)
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
    
    return Plugin_Continue;
}

