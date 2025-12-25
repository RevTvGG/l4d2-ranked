#include <sourcemod>
#include <steamworks>

public Plugin myinfo = {
    name = "L4D2 Ranked Matchmaking",
    author = "Antigravity",
    description = "Connects to Web Platform for Ranked Matches",
    version = "2.6-RETRO-FULL",
    url = "https://l4d2ranked.online"
};

ConVar cvServerKey;
ConVar cvApiUrl;

char g_sServerKey[64];
char g_sApiUrl[128];
bool g_bMatchActive = false;
char g_sMatchId[32];

public void OnPluginStart() {
    cvServerKey = CreateConVar("ranked_server_key", "", "Secret key for this server", FCVAR_PROTECTED);
    cvApiUrl = CreateConVar("ranked_api_url", "https://l4d2-ranked-production.up.railway.app", "Base URL for the web platform");

    AutoExecConfig(true, "l4d2_ranked");
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
    GetConVarString(cvServerKey, g_sServerKey, sizeof(g_sServerKey));
    GetConVarString(cvApiUrl, g_sApiUrl, sizeof(g_sApiUrl));

    PrintToConsole(client, "------------------------------------------------");
    PrintToConsole(client, "[Ranked] Running Plugin Version: 2.6-RETRO-FULL");
    PrintToConsole(client, "[Ranked] Note: Check Server Console for details.");
    
    CheckForMatch(); 
    return Plugin_Handled;
}

void CheckForMatch() {
    // 1. Fallback Key
    if (strlen(g_sServerKey) == 0) {
        PrintToServer("[Ranked] FALLBACK: Using hardcoded key.");
        strcopy(g_sServerKey, sizeof(g_sServerKey), "ranked-server-k9cc0n0k4rc");
    }

    char url[256];
    Format(url, sizeof(url), "%s/api/server/check-match", g_sApiUrl);

    // 2. Simple JSON Body
    char requestBody[256];
    Format(requestBody, sizeof(requestBody), "{\"server_key\": \"%s\"}", g_sServerKey);

    // 3. Create Request
    Handle request = SteamWorks_CreateHTTPRequest(k_EHTTPMethodPOST, url);
    PrintToServer("[Ranked] Handle Created: %d", request);
    
    if (request == null) {
        PrintToServer("[Ranked] FATAL: SteamWorks Error (CreateHTTPRequest returned NULL)");
        return;
    }

    // 4. RETRO CONFIGURATION (No Context Value)
    SteamWorks_SetHTTPRequestHeaderValue(request, "Content-Type", "application/json");
    SteamWorks_SetHTTPRequestHeaderValue(request, "User-Agent", "L4D2-Ranked-Retro");
    SteamWorks_SetHTTPRequestRawPostBody(request, "application/json", requestBody, strlen(requestBody));
    
    SteamWorks_SetHTTPCallbacks(request, OnCheckMatchCompleted);
    
    // 5. Send
    if(SteamWorks_SendHTTPRequest(request)) {
        PrintToServer("[Ranked] Request sent successfully!");
    } else {
        PrintToServer("[Ranked] FATAL: SendHTTPRequest returned false.");
        CloseHandle(request);
    }
}

public int OnCheckMatchCompleted(Handle request, bool bFailure, bool bRequestSuccessful, EHTTPStatusCode eStatusCode) {
    if (!bRequestSuccessful || eStatusCode != k_EHTTPStatusCode_200OK) {
        PrintToServer("[Ranked] API FAIL. Status: %d", eStatusCode);
        CloseHandle(request);
        return 0;
    }

    int bodySize;
    if (SteamWorks_GetHTTPResponseBodySize(request, bodySize)) {
        char[] body = new char[bodySize + 1];
        SteamWorks_GetHTTPResponseBodyData(request, body, bodySize);
        
        PrintToServer("[Ranked] SUCCESS (200 OK). Body size: %d", bodySize);
        PrintToServer("[Ranked] Body: %s", body);

        // Parse JSON manually
        if (StrContains(body, "\"match_id\":null") == -1) {
            
            // Find Match ID
            int matchIdPos = StrContains(body, "\"match_id\":\"");
            if (matchIdPos != -1) {
                int start = matchIdPos + 12;
                
                // Using standard SourceMod FindCharInString (Native)
                int end = FindCharInString(body[start], '"'); 
                
                if (end != -1) {
                    char matchId[32];
                    strcopy(matchId, end + 1, body[start]);
                    PrintToServer("[Ranked] MATCH DETECTED ID: %s", matchId);
                    
                    if (!StrEqual(matchId, g_sMatchId)) {
                        strcopy(g_sMatchId, sizeof(g_sMatchId), matchId);
                        StartMatch(matchId, body);
                    }
                }
            }
        }
    }
    
    CloseHandle(request);
    return 0;
}

void StartMatch(const char[] matchId, const char[] jsonData) {
    g_bMatchActive = true;
    PrintToChatAll("\x04[Ranked] \x01MATCH FOUND! ID: %s", matchId);
    PrintToChatAll("\x04[Ranked] \x01Loading match settings...");
    PrintToServer("[Ranked] Starting Match: %s", matchId);
    
    char mapName[64] = "c1m1_hotel";
    int mapPos = StrContains(jsonData, "\"map\":\"");
    if (mapPos != -1) {
        int start = mapPos + 7;
        int end = FindCharInString(jsonData[start], '"');
        if (end != -1) {
            strcopy(mapName, end + 1, jsonData[start]);
        }
    }
    
    DataPack pack = new DataPack();
    pack.WriteString(mapName);
    CreateTimer(5.0, Timer_ChangeMap, pack);
}

public Action Timer_ChangeMap(Handle timer, DataPack pack) {
    char mapName[64];
    pack.Reset();
    pack.ReadString(mapName, sizeof(mapName));
    delete pack;
    
    // Safety check just in case
    if(strlen(mapName) > 2) {
        PrintToChatAll("\x04[Ranked] \x01Changing map to %s...", mapName);
        ServerCommand("changelevel %s", mapName);
    }
    return Plugin_Stop;
}
