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

#define PLUGIN_VERSION "1.1.3-NO-CALLBACK"

// Constants
#define TEAM_SURVIVOR 2
#define TEAM_INFECTED 3

// CVars
ConVar g_cvApiUrl;

// Match State
char g_sMatchId[64];
bool g_bIsMatchLive = false;

// Optional Plugins
bool g_bScoreModAvailable = false;
bool g_bMvpAvailable = false;

public Plugin myinfo =
{
	name = "L4D2 Match Reporter (NO CALLBACK)",
	author = "Antigravity",
	description = "Reports match stats WITHOUT callbacks to avoid crashes",
	version = PLUGIN_VERSION,
	url = ""
};

public void OnAllPluginsLoaded()
{
	g_bScoreModAvailable = LibraryExists("l4d2_hybrid_scoremod");
	g_bMvpAvailable = LibraryExists("l4d2_survivor_mvp");
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
    g_cvApiUrl = CreateConVar("l4d2_ranked_api_url", "http://localhost:3000/api", "URL of the Ranked API");

    RegAdminCmd("sm_set_match_id", Cmd_SetMatchId, ADMFLAG_CHANGEMAP, "Sets the current match ID");
    RegAdminCmd("sm_ranked_debug_force_end", Cmd_DebugForceEnd, ADMFLAG_ROOT, "Forces match complete notification");

    HookEvent("round_end", OnRoundEnd);
    HookEvent("versus_match_finished", OnMatchFinished);
    
    AutoExecConfig(true, "l4d2_match_reporter");
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
    ReplyToCommand(client, "[Match Reporter] Match ID set to: %s", g_sMatchId);
    
    g_bIsMatchLive = false;
    
    if (IsInReady())
    {
        ReplyToCommand(client, "[Match Reporter] Game in Ready-Up. Waiting for live...");
    }
    else
    {
        ReplyToCommand(client, "[Match Reporter] Game appears live. Attempting to notify API...");
        NotifyMatchLive(client);
    }

    return Plugin_Handled;
}

public Action Cmd_DebugForceEnd(int client, int args) {
    ReplyToCommand(client, "[DEBUG] Starting Force End Sequence (NO CALLBACK)...");
    NotifyMatchComplete(client, 1, 1);
    return Plugin_Handled;
}

// ------------------------------------------------------------------------
// ReadyUp Forward
// ------------------------------------------------------------------------

public void OnRoundIsLive()
{
    if (g_sMatchId[0] != '\0' && !g_bIsMatchLive)
    {
        NotifyMatchLive(0); // 0 = Console
    }
}

// ------------------------------------------------------------------------
// API Notifications (NO CALLBACKS - CRASH PREVENTION)
// ------------------------------------------------------------------------

// Timer to cleanup handles since we don't have callbacks
public Action Timer_CloseHandle(Handle timer, any hRequest)
{
    if (hRequest != INVALID_HANDLE)
    {
        CloseHandle(hRequest);
        PrintToServer("[Match Reporter] Cleanup: Request handle closed.");
    }
    return Plugin_Stop;
}

void NotifyMatchLive(int client)
{
    char sUrl[256];
    g_cvApiUrl.GetString(sUrl, sizeof(sUrl));
    
    char sRequestUrl[512];
    Format(sRequestUrl, sizeof(sRequestUrl), "%s/match/notify-live", sUrl);

    Handle hRequest = SteamWorks_CreateHTTPRequest(k_EHTTPMethodPOST, sRequestUrl);
    if (hRequest == INVALID_HANDLE) {
        if (client > 0) ReplyToCommand(client, "[DEBUG] CRITICAL: Invalid Handle in NotifyMatchLive");
        else PrintToServer("[Match Reporter] CRITICAL: Invalid Handle in NotifyMatchLive");
        return;
    }

    SteamWorks_SetHTTPRequestContextValue(hRequest, 0);
    SteamWorks_SetHTTPRequestGetOrPostParameter(hRequest, "matchId", g_sMatchId);
    
    // SKIP SET CALLBACKS (Crash Point)
    
    if (!SteamWorks_SendHTTPRequest(hRequest)) {
        if (client > 0) ReplyToCommand(client, "[DEBUG] CRITICAL: Failed to SEND Live Request");
        else PrintToServer("[Match Reporter] CRITICAL: Failed to SEND Live Request");
        CloseHandle(hRequest);
        return;
    }
    
    // Create timer to cleanup
    CreateTimer(10.0, Timer_CloseHandle, hRequest);
    
    if (client > 0) ReplyToCommand(client, "[DEBUG] Live Request SENT successfully to %s (No Callback)", sRequestUrl);
    else PrintToServer("[Match Reporter] Live Request SENT successfully (No Callback)");
}

void NotifyMatchComplete(int client, int winner, int reason)
{
    char sUrl[256];
    g_cvApiUrl.GetString(sUrl, sizeof(sUrl));
    
    char sRequestUrl[512];
    Format(sRequestUrl, sizeof(sRequestUrl), "%s/match/complete", sUrl);

    char sWinner[16];
    IntToString(winner, sWinner, sizeof(sWinner));
    
    char sReason[16];
    IntToString(reason, sReason, sizeof(sReason));

    ReplyToCommand(client, "[DEBUG] Preparing request to: %s", sRequestUrl);

    Handle hRequest = SteamWorks_CreateHTTPRequest(k_EHTTPMethodPOST, sRequestUrl);
    if (hRequest == INVALID_HANDLE)
    {
        ReplyToCommand(client, "[DEBUG] CRITICAL: CreateHTTPRequest failed.");
        return;
    }
    
    ReplyToCommand(client, "[DEBUG] Handle Valid. Adding parameters...");
    ReplyToCommand(client, "[DEBUG] Current matchId value: '%s'", g_sMatchId);

    if (!SteamWorks_SetHTTPRequestGetOrPostParameter(hRequest, "matchId", g_sMatchId)) {
        ReplyToCommand(client, "[DEBUG] ERROR: Failed to add matchId parameter");
    }
    SteamWorks_SetHTTPRequestGetOrPostParameter(hRequest, "winner", sWinner);
    SteamWorks_SetHTTPRequestGetOrPostParameter(hRequest, "reason", sReason);

    ReplyToCommand(client, "[DEBUG] Parameters added. SKIPPING callbacks (Crash Avoidance)...");
    
    // SKIP SET CALLBACKS
    
    ReplyToCommand(client, "[DEBUG] Sending request...");
    if (!SteamWorks_SendHTTPRequest(hRequest)) {
        ReplyToCommand(client, "[DEBUG] CRITICAL: SendHTTPRequest returned false!");
        CloseHandle(hRequest);
        return;
    }
    
    // Create timer to cleanup
    CreateTimer(10.0, Timer_CloseHandle, hRequest);
    
    ReplyToCommand(client, "[DEBUG] Request SENT. Scheduled cleanup in 10s.");
    g_sMatchId[0] = '\0';
    g_bIsMatchLive = false;
}

public void OnRoundEnd(Event event, const char[] name, bool dontBroadcast)
{
    // Placeholder
}

public void OnMatchFinished(Event event, const char[] name, bool dontBroadcast)
{
    if (g_sMatchId[0] == '\0') return;
    int winner = event.GetInt("winner");
    NotifyMatchComplete(0, winner, 0);
}
