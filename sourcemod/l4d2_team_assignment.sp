#pragma semicolon 1
#pragma newdecls required

#include <sourcemod>
#include <sdktools>

#define PLUGIN_VERSION "1.0.0"

bool g_bMatchActive = false;
char g_sMatchId[64];
char g_sTeamA[8][32]; // SteamIDs del Team A
char g_sTeamB[8][32]; // SteamIDs del Team B
int g_iTeamACount = 0;
int g_iTeamBCount = 0;

public Plugin myinfo = 
{
    name = "L4D2 Auto Team Assignment",
    author = "L4D2 Ranked",
    description = "Automatically assigns players to their ranked teams",
    version = PLUGIN_VERSION,
    url = "https://www.l4d2ranked.online"
};

public void OnPluginStart()
{
    RegAdminCmd("sm_set_teams", Command_SetTeams, ADMFLAG_RCON, "Set team assignments for match");
    RegAdminCmd("sm_clear_teams", Command_ClearTeams, ADMFLAG_RCON, "Clear team assignments");
    
    HookEvent("player_team", Event_PlayerTeam, EventHookMode_Pre);
    
    PrintToServer("[TeamAssign] Plugin loaded - Version %s", PLUGIN_VERSION);
}

// Comando: sm_set_teams <match_id> <teamA_steamids> | <teamB_steamids>
// Ejemplo: sm_set_teams cmj123 STEAM_1:0:1 STEAM_1:0:2 STEAM_1:0:3 STEAM_1:0:4 | STEAM_1:0:5 STEAM_1:0:6 STEAM_1:0:7 STEAM_1:0:8
public Action Command_SetTeams(int client, int args)
{
    if (args < 2)
    {
        ReplyToCommand(client, "[TeamAssign] Usage: sm_set_teams <match_id> <teamA_ids> | <teamB_ids>");
        return Plugin_Handled;
    }
    
    // Get full command string
    char cmdString[512];
    GetCmdArgString(cmdString, sizeof(cmdString));
    
    // Parse match ID
    char argParts[2][256];
    int numParts = ExplodeString(cmdString, " ", argParts, 2, 256);
    
    if (numParts < 2)
    {
        ReplyToCommand(client, "[TeamAssign] Invalid format");
        return Plugin_Handled;
    }
    
    strcopy(g_sMatchId, sizeof(g_sMatchId), argParts[0]);
    
    // Parse teams (separated by |)
    char teamParts[2][256];
    numParts = ExplodeString(argParts[1], "|", teamParts, 2, 256);
    
    if (numParts < 2)
    {
        ReplyToCommand(client, "[TeamAssign] Must specify both teams separated by |");
        return Plugin_Handled;
    }
    
    // Parse Team A
    TrimString(teamParts[0]);
    char teamAIds[8][32];
    g_iTeamACount = ExplodeString(teamParts[0], " ", teamAIds, 8, 32);
    for (int i = 0; i < g_iTeamACount; i++)
    {
        TrimString(teamAIds[i]);
        strcopy(g_sTeamA[i], 32, teamAIds[i]);
    }
    
    // Parse Team B
    TrimString(teamParts[1]);
    char teamBIds[8][32];
    g_iTeamBCount = ExplodeString(teamParts[1], " ", teamBIds, 8, 32);
    for (int i = 0; i < g_iTeamBCount; i++)
    {
        TrimString(teamBIds[i]);
        strcopy(g_sTeamB[i], 32, teamBIds[i]);
    }
    
    g_bMatchActive = true;
    
    PrintToServer("[TeamAssign] Match %s - Teams set: %d vs %d", g_sMatchId, g_iTeamACount, g_iTeamBCount);
    
    // Assign currently connected players
    AssignAllPlayers();
    
    return Plugin_Handled;
}

public Action Command_ClearTeams(int client, int args)
{
    g_bMatchActive = false;
    g_iTeamACount = 0;
    g_iTeamBCount = 0;
    g_sMatchId[0] = '\0';
    
    PrintToServer("[TeamAssign] Teams cleared");
    ReplyToCommand(client, "[TeamAssign] Teams cleared");
    
    return Plugin_Handled;
}

public void OnClientPutInServer(int client)
{
    if (!g_bMatchActive || IsFakeClient(client))
        return;
    
    // Delay assignment to let client fully connect
    CreateTimer(2.0, Timer_AssignPlayer, GetClientUserId(client), TIMER_FLAG_NO_MAPCHANGE);
}

public Action Timer_AssignPlayer(Handle timer, int userid)
{
    int client = GetClientOfUserId(userid);
    
    if (client == 0 || !IsClientInGame(client))
        return Plugin_Stop;
    
    AssignPlayerToTeam(client);
    
    return Plugin_Stop;
}

void AssignPlayerToTeam(int client)
{
    if (!g_bMatchActive)
        return;
    
    char steamId[32];
    if (!GetClientAuthId(client, AuthId_Steam2, steamId, sizeof(steamId)))
        return;
    
    int targetTeam = 0;
    
    // Check Team A
    for (int i = 0; i < g_iTeamACount; i++)
    {
        if (StrEqual(steamId, g_sTeamA[i], false))
        {
            targetTeam = 2; // Survivors
            PrintToServer("[TeamAssign] Assigning %N to Team A (Survivors)", client);
            break;
        }
    }
    
    // Check Team B
    if (targetTeam == 0)
    {
        for (int i = 0; i < g_iTeamBCount; i++)
        {
            if (StrEqual(steamId, g_sTeamB[i], false))
            {
                targetTeam = 3; // Infected
                PrintToServer("[TeamAssign] Assigning %N to Team B (Infected)", client);
                break;
            }
        }
    }
    
    if (targetTeam > 0)
    {
        ChangeClientTeam(client, targetTeam);
        PrintToChat(client, "[Ranked] You have been assigned to your team");
    }
}

void AssignAllPlayers()
{
    for (int i = 1; i <= MaxClients; i++)
    {
        if (IsClientInGame(i) && !IsFakeClient(i))
        {
            AssignPlayerToTeam(i);
        }
    }
}

public Action Event_PlayerTeam(Event event, const char[] name, bool dontBroadcast)
{
    if (!g_bMatchActive)
        return Plugin_Continue;
    
    int client = GetClientOfUserId(event.GetInt("userid"));
    int newTeam = event.GetInt("team");
    
    if (client == 0 || IsFakeClient(client))
        return Plugin_Continue;
    
    char steamId[32];
    if (!GetClientAuthId(client, AuthId_Steam2, steamId, sizeof(steamId)))
        return Plugin_Continue;
    
    // Determine correct team
    int correctTeam = 0;
    
    for (int i = 0; i < g_iTeamACount; i++)
    {
        if (StrEqual(steamId, g_sTeamA[i], false))
        {
            correctTeam = 2; // Survivors
            break;
        }
    }
    
    if (correctTeam == 0)
    {
        for (int i = 0; i < g_iTeamBCount; i++)
        {
            if (StrEqual(steamId, g_sTeamB[i], false))
            {
                correctTeam = 3; // Infected
                break;
            }
        }
    }
    
    // Block team changes if player tries to switch
    if (correctTeam > 0 && newTeam != correctTeam && newTeam > 1)
    {
        PrintToChat(client, "[Ranked] You cannot change teams during a ranked match");
        CreateTimer(0.1, Timer_ForceTeam, GetClientUserId(client) | (correctTeam << 16), TIMER_FLAG_NO_MAPCHANGE);
        return Plugin_Handled;
    }
    
    return Plugin_Continue;
}

public Action Timer_ForceTeam(Handle timer, int data)
{
    int userid = data & 0xFFFF;
    int team = data >> 16;
    
    int client = GetClientOfUserId(userid);
    
    if (client > 0 && IsClientInGame(client))
    {
        ChangeClientTeam(client, team);
    }
    
    return Plugin_Stop;
}
