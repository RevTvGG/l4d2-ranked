/**
 * L4D2 Match Whitelist Plugin
 * Restricts server access to only players in the current match
 * No password needed - uses Steam ID whitelist
 */

#include <sourcemod>
#include <sdktools>

#pragma semicolon 1
#pragma newdecls required

ArrayList g_AllowedSteamIDs;
bool g_MatchActive = false;
char g_MatchId[64];

public Plugin myinfo = {
    name = "L4D2 Match Whitelist",
    author = "Ranked System",
    description = "Restricts server access to match players only",
    version = "1.0.0",
    url = ""
};

public void OnPluginStart() {
    g_AllowedSteamIDs = new ArrayList(ByteCountToCells(32));
    
    RegServerCmd("sm_set_match_players", Cmd_SetMatchPlayers);
    RegServerCmd("sm_clear_match", Cmd_ClearMatch);
    
    PrintToServer("[Whitelist] Plugin loaded");
}

public Action OnClientPreConnect(const char[] name, char password[255], const char[] ip, const char[] steamID, char rejectReason[255]) {
    if (!g_MatchActive) {
        return Plugin_Continue; // Server open to all
    }

    // Check if player is in whitelist
    if (IsPlayerAllowed(steamID)) {
        PrintToServer("[Whitelist] Allowed: %s (%s)", name, steamID);
        return Plugin_Continue;
    }

    // Reject connection
    Format(rejectReason, sizeof(rejectReason), "This server is reserved for a ranked match.");
    PrintToServer("[Whitelist] Rejected: %s (%s) - Not in match", name, steamID);
    return Plugin_Handled;
}

bool IsPlayerAllowed(const char[] steamID) {
    char allowedID[32];
    for (int i = 0; i < g_AllowedSteamIDs.Length; i++) {
        g_AllowedSteamIDs.GetString(i, allowedID, sizeof(allowedID));
        if (StrEqual(steamID, allowedID, false)) {
            return true;
        }
    }
    return false;
}

public Action Cmd_SetMatchPlayers(int args) {
    if (args < 2) {
        PrintToServer("[Whitelist] Usage: sm_set_match_players <matchId> <steamid1> <steamid2> ...");
        return Plugin_Handled;
    }

    // Clear previous whitelist
    g_AllowedSteamIDs.Clear();
    g_MatchActive = true;

    // Get match ID (first argument)
    GetCmdArg(1, g_MatchId, sizeof(g_MatchId));

    // Get all arguments as a single string
    char argString[512];
    GetCmdArgString(argString, sizeof(argString));
    
    // Split by spaces to get individual Steam IDs
    // Skip first argument (match ID)
    char steamIDs[32][32];
    int count = ExplodeString(argString, " ", steamIDs, sizeof(steamIDs), sizeof(steamIDs[]));
    
    // Start from index 1 to skip match ID
    int addedCount = 0;
    for (int i = 1; i < count; i++) {
        // Trim whitespace
        TrimString(steamIDs[i]);
        
        // Skip empty strings
        if (strlen(steamIDs[i]) == 0) continue;
        
        // Add to whitelist
        g_AllowedSteamIDs.PushString(steamIDs[i]);
        PrintToServer("[Whitelist] Added: %s", steamIDs[i]);
        addedCount++;
    }

    PrintToServer("[Whitelist] Match %s - Whitelist activated with %d players", g_MatchId, addedCount);
    
    // Kick any players not in the whitelist
    for (int i = 1; i <= MaxClients; i++) {
        if (IsClientConnected(i) && !IsFakeClient(i)) {
            char clientSteamID[32];
            GetClientAuthId(i, AuthId_Steam2, clientSteamID, sizeof(clientSteamID));
            
            if (!IsPlayerAllowed(clientSteamID)) {
                KickClient(i, "Server reserved for ranked match");
                PrintToServer("[Whitelist] Kicked: %N (not in match)", i);
            }
        }
    }
    
    return Plugin_Handled;
}

public Action Cmd_ClearMatch(int args) {
    g_AllowedSteamIDs.Clear();
    g_MatchActive = false;
    g_MatchId[0] = '\0';
    
    PrintToServer("[Whitelist] Match cleared - Server open to all");
    return Plugin_Handled;
}

public void OnClientPutInServer(int client) {
    if (!g_MatchActive || IsFakeClient(client)) return;

    char steamID[32];
    GetClientAuthId(client, AuthId_Steam2, steamID, sizeof(steamID));

    if (IsPlayerAllowed(steamID)) {
        PrintToChatAll("[Ranked] %N joined the match", client);
        // TODO: Notify web platform that player joined
        // This would require HTTP extension (SteamWorks or Socket)
    }
}
