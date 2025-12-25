#include <sourcemod>
#include <steamworks>
#include <json> // Requires sm-json or creating JSON manually

public Plugin myinfo = {
    name = "L4D2 Ranked Matchmaking",
    author = "Antigravity",
    description = "Connects to Web Platform for Ranked Matches",
    version = "2.0",
    url = "https://l4d2ranked.online"
};

// Configuration
ConVar cvServerKey;
ConVar cvApiUrl;

// State
char g_sServerKey[64];
char g_sApiUrl[128];
bool g_bMatchActive = false;
char g_sMatchId[32];

public void OnPluginStart() {
    cvServerKey = CreateConVar("ranked_server_key", "", "Secret key for this server", FCVAR_PROTECTED);
    cvApiUrl = CreateConVar("ranked_api_url", "https://l4d2-ranked-production.up.railway.app", "Base URL for the web platform");

    AutoExecConfig(true, "l4d2_ranked");
    
    // Check for match every 60 seconds
    CreateTimer(60.0, Timer_CheckMatch, _, TIMER_REPEAT);
    
    RegAdminCmd("sm_force_check", Cmd_ForceCheck, ADMFLAG_ROOT, "Forces a check for match");
}

public void OnConfigsExecuted() {
    cvServerKey.GetString(g_sServerKey, sizeof(g_sServerKey));
    cvApiUrl.GetString(g_sApiUrl, sizeof(g_sApiUrl));
}

public Action Timer_CheckMatch(Handle timer) {
    if (!g_bMatchActive) {
        CheckForMatch();
    }
    return Plugin_Continue;
}

public Action Cmd_ForceCheck(int client, int args) {
    CheckForMatch();
    ReplyToCommand(client, "[Ranked] Checking for match...");
    return Plugin_Handled;
}

/**
 * Sends a POST request to /api/server/check-match
 * STRICT JSON PROTOCOL
 */
void CheckForMatch() {
    if (strlen(g_sServerKey) == 0) return;

    char url[256];
    Format(url, sizeof(url), "%s/api/server/check-match", g_sApiUrl);

    // Create JSON Payload manually to avoid dependency issues if possible, 
    // or use a simple format string since check-match is simple.
    char requestBody[256];
    Format(requestBody, sizeof(requestBody), "{\"server_key\": \"%s\"}", g_sServerKey);

    Handle request = SteamWorks_CreateHTTPRequest(k_EHTTPMethodPOST, url);
    
    // CRITICAL: Set content-type to application/json
    SteamWorks_SetHTTPRequestContextValue(request, 0);
    SteamWorks_SetHTTPRequestHeaderValue(request, "Content-Type", "application/json");
    SteamWorks_SetHTTPRequestHeaderValue(request, "User-Agent", "L4D2-Ranked-Plugin/2.0");
    
    SteamWorks_SetHTTPRequestRawPostBody(request, "application/json", requestBody, strlen(requestBody));
    
    SteamWorks_SetHTTPCallbacks(request, OnCheckMatchCompleted);
    SteamWorks_SendHTTPRequest(request);
}

public int OnCheckMatchCompleted(Handle request, bool bFailure, bool bRequestSuccessful, EHTTPStatusCode eStatusCode) {
    if (!bRequestSuccessful || eStatusCode != k_EHTTPStatusCode_200OK) {
        LogError("[Ranked] API Check Failed. Status: %d", eStatusCode);
        
        // Log response body for debugging
        if (eStatusCode == k_EHTTPStatusCode_500InternalServerError || eStatusCode == k_EHTTPStatusCode_400BadRequest) {
             int bodySize;
             SteamWorks_GetHTTPResponseBodySize(request, bodySize);
             char[] body = new char[bodySize + 1];
             SteamWorks_GetHTTPResponseBodyData(request, body, bodySize);
             LogError("[Ranked] Error Body: %s", body);
        }
        
        CloseHandle(request);
        return;
    }

    int bodySize;
    SteamWorks_GetHTTPResponseBodySize(request, bodySize);
    char[] body = new char[bodySize + 1];
    SteamWorks_GetHTTPResponseBodyData(request, body, bodySize);
    
    CloseHandle(request);

    // Parse JSON Response
    // Expecting: { "success": true, "data": { "match_id": "..." } }
    
    // Note: In a real implementation you should use a JSON parser.
    // For this prototype, we'll do simple string checking to find "match_id"
    
    if (StrContains(body, "\"match_id\":null") != -1) {
        // No match
        return;
    }
    
    // Check if we found a match ID (basic parsing)
    int matchIdPos = StrContains(body, "\"match_id\":\"");
    if (matchIdPos != -1) {
        // Extract Match ID
        int start = matchIdPos + 12;
        int end = FindCharInString(body[start], '"');
        
        if (end != -1) {
            char matchId[32];
            strcopy(matchId, end + 1, body[start]);
            
            if (!StrEqual(matchId, g_sMatchId)) {
                strcopy(g_sMatchId, sizeof(g_sMatchId), matchId);
                StartMatch(matchId, body);
            }
        }
    }
}

void StartMatch(const char[] matchId, const char[] jsonData) {
    g_bMatchActive = true;
    PrintToChatAll("\x04[Ranked] \x01MATCH FOUND! ID: %s", matchId);
    PrintToChatAll("\x04[Ranked] \x01Loading match settings...");
    
    // Parse map name from JSON
    char mapName[64] = "c1m1_hotel";
    int mapPos = StrContains(jsonData, "\"map\":\"");
    if (mapPos != -1) {
        int start = mapPos + 7;
        int end = FindCharInString(jsonData[start], '"');
        if (end != -1) {
            strcopy(mapName, end + 1, jsonData[start]);
        }
    }
    
    // Change map with delay
    DataPack pack = new DataPack();
    pack.WriteString(mapName);
    CreateTimer(5.0, Timer_ChangeMap, pack);
}

public Action Timer_ChangeMap(Handle timer, DataPack pack) {
    char mapName[64];
    pack.Reset();
    pack.ReadString(mapName, sizeof(mapName));
    delete pack;
    
    ServerCommand("changelevel %s", mapName);
    return Plugin_Stop;
}

// Utility to find char in string part (since StrContains is global)
int FindCharInString(const char[] str, char c) {
    int len = strlen(str);
    for(int i=0; i<len; i++) {
        if(str[i] == c) return i;
    }
    return -1;
}
