#pragma semicolon 1
#pragma newdecls required

#include <sourcemod>

#define PLUGIN_VERSION "1.0.1"

ConVar g_cvAutoLoadEnabled;
bool g_bMatchActive = false;
char g_sMatchId[64];

public Plugin myinfo = 
{
    name = "L4D2 Auto-Load ZoneMod",
    author = "L4D2 Ranked",
    description = "Automatically loads ZoneMod when a ranked match starts",
    version = PLUGIN_VERSION,
    url = "https://www.l4d2ranked.online"
};

public void OnPluginStart()
{
    // Create ConVars
    g_cvAutoLoadEnabled = CreateConVar("sm_autoload_zonemod", "1", "Enable automatic ZoneMod loading for ranked matches", FCVAR_NOTIFY);
    
    // Register commands
    RegAdminCmd("sm_set_match_id", Command_SetMatchId, ADMFLAG_RCON, "Set the current match ID and auto-load ZoneMod");
    RegAdminCmd("sm_clear_match", Command_ClearMatch, ADMFLAG_RCON, "Clear the current match");
    
    // Auto-generate config
    AutoExecConfig(true, "l4d2_autoload_zonemod");
    
    PrintToServer("[AutoLoad] Plugin loaded - Version %s", PLUGIN_VERSION);
}

public Action Command_SetMatchId(int client, int args)
{
    if (args < 1)
    {
        ReplyToCommand(client, "[AutoLoad] Usage: sm_set_match_id <match_id> [api_url]");
        return Plugin_Handled;
    }
    
    // Get match ID
    GetCmdArg(1, g_sMatchId, sizeof(g_sMatchId));
    
    PrintToServer("[AutoLoad] Match ID set: %s", g_sMatchId);
    
    // Check if auto-load is enabled
    if (!g_cvAutoLoadEnabled.BoolValue)
    {
        PrintToServer("[AutoLoad] Auto-load disabled, skipping ZoneMod initialization");
        g_bMatchActive = true;
        return Plugin_Handled;
    }
    
    // Mark match as active
    g_bMatchActive = true;
    
    // Auto-load ZoneMod after a short delay
    CreateTimer(3.0, Timer_LoadZoneMod, _, TIMER_FLAG_NO_MAPCHANGE);
    
    PrintToServer("[AutoLoad] Scheduled ZoneMod auto-load in 3 seconds");
    
    return Plugin_Handled;
}

public Action Command_ClearMatch(int client, int args)
{
    g_bMatchActive = false;
    g_sMatchId[0] = '\0';
    
    PrintToServer("[AutoLoad] Match cleared");
    ReplyToCommand(client, "[AutoLoad] Match cleared");
    
    return Plugin_Handled;
}

public Action Timer_LoadZoneMod(Handle timer)
{
    if (!g_bMatchActive)
    {
        PrintToServer("[AutoLoad] Match no longer active, aborting ZoneMod load");
        return Plugin_Stop;
    }
    
    // Find a valid client to execute commands as
    int client = GetAnyValidClient();
    
    if (client == 0)
    {
        PrintToServer("[AutoLoad] No valid client found, retrying in 2 seconds...");
        CreateTimer(2.0, Timer_LoadZoneMod, _, TIMER_FLAG_NO_MAPCHANGE);
        return Plugin_Stop;
    }
    
    PrintToServer("[AutoLoad] Starting ZoneMod auto-load sequence using client %N...", client);
    
    // Execute sm_match as the client
    FakeClientCommand(client, "sm_match");
    PrintToServer("[AutoLoad] Executed: sm_match (as %N)", client);
    
    // Schedule option selection
    CreateTimer(2.0, Timer_SelectZoneMod, GetClientUserId(client), TIMER_FLAG_NO_MAPCHANGE);
    
    return Plugin_Stop;
}

public Action Timer_SelectZoneMod(Handle timer, int userid)
{
    int client = GetClientOfUserId(userid);
    
    if (client == 0 || !IsClientInGame(client))
    {
        PrintToServer("[AutoLoad] Client disconnected, aborting");
        return Plugin_Stop;
    }
    
    // Select ZoneMod (option 1)
    FakeClientCommand(client, "sm_match 1");
    PrintToServer("[AutoLoad] Executed: sm_match 1 (Select ZoneMod as %N)", client);
    
    // Schedule version selection
    CreateTimer(2.0, Timer_SelectVersion, userid, TIMER_FLAG_NO_MAPCHANGE);
    
    return Plugin_Stop;
}

public Action Timer_SelectVersion(Handle timer, int userid)
{
    int client = GetClientOfUserId(userid);
    
    if (client == 0 || !IsClientInGame(client))
    {
        PrintToServer("[AutoLoad] Client disconnected, aborting");
        return Plugin_Stop;
    }
    
    // Select latest version (option 1)
    FakeClientCommand(client, "sm_match 1");
    PrintToServer("[AutoLoad] Executed: sm_match 1 (Select latest version as %N)", client);
    PrintToServer("[AutoLoad] ZoneMod auto-load sequence complete!");
    
    return Plugin_Stop;
}

// Helper function to find any valid client
int GetAnyValidClient()
{
    for (int i = 1; i <= MaxClients; i++)
    {
        if (IsClientInGame(i) && !IsFakeClient(i))
        {
            return i;
        }
    }
    return 0;
}

public void OnMapStart()
{
    // Reset match state on map change if no match is active
    if (!g_bMatchActive)
    {
        g_sMatchId[0] = '\0';
    }
}
