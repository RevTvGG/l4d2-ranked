/**
 * L4D2 Match Reporter Plugin
 * Detects match end and reports results to web platform
 */

#include <sourcemod>
#include <sdktools>

#pragma semicolon 1
#pragma newdecls required

char g_MatchId[64];
char g_ApiUrl[256];
bool g_MatchActive = false;

public Plugin myinfo = {
    name = "L4D2 Match Reporter",
    author = "Ranked System",
    description = "Reports match results to web platform",
    version = "1.0.0",
    url = ""
};

public void OnPluginStart() {
    RegServerCmd("sm_set_match_id", Cmd_SetMatchId);
    
    HookEvent("finale_win", Event_FinaleWin);
    HookEvent("mission_lost", Event_MissionLost);
    HookEvent("round_end", Event_RoundEnd);
    
    PrintToServer("[Reporter] Plugin loaded");
}

public Action Cmd_SetMatchId(int args) {
    if (args < 2) {
        PrintToServer("[Reporter] Usage: sm_set_match_id <matchId> <apiUrl>");
        return Plugin_Handled;
    }

    GetCmdArg(1, g_MatchId, sizeof(g_MatchId));
    GetCmdArg(2, g_ApiUrl, sizeof(g_ApiUrl));
    g_MatchActive = true;
    
    PrintToServer("[Reporter] Match ID set: %s", g_MatchId);
    PrintToServer("[Reporter] API URL: %s", g_ApiUrl);
    
    return Plugin_Handled;
}

public void Event_FinaleWin(Event event, const char[] name, bool dontBroadcast) {
    if (!g_MatchActive) return;
    
    PrintToServer("[Reporter] Finale completed - Match ending");
    
    // Wait a bit for scores to finalize
    CreateTimer(3.0, Timer_ReportMatch);
}

public void Event_MissionLost(Event event, const char[] name, bool dontBroadcast) {
    if (!g_MatchActive) return;
    
    PrintToServer("[Reporter] Mission lost - Match ending");
    
    CreateTimer(3.0, Timer_ReportMatch);
}

public void Event_RoundEnd(Event event, const char[] name, bool dontBroadcast) {
    if (!g_MatchActive) return;
    
    // Log round end for debugging
    int teamAScore = GetMatchTeamScore(2); // Survivors
    int teamBScore = GetMatchTeamScore(3); // Infected
    
    PrintToServer("[Reporter] Round ended - Scores: Team A: %d, Team B: %d", teamAScore, teamBScore);
}

public Action Timer_ReportMatch(Handle timer) {
    ReportMatchEnd();
    return Plugin_Stop;
}

void ReportMatchEnd() {
    // Get final scores
    int teamAScore = GetMatchTeamScore(2); // Survivors
    int teamBScore = GetMatchTeamScore(3); // Infected
    
    // Determine winner
    char winner[16];
    if (teamAScore > teamBScore) {
        strcopy(winner, sizeof(winner), "TEAM_A");
    } else if (teamBScore > teamAScore) {
        strcopy(winner, sizeof(winner), "TEAM_B");
    } else {
        strcopy(winner, sizeof(winner), "TIE");
    }
    
    // Display results on server
    PrintToChatAll("═══════════════════════════════");
    PrintToChatAll("        MATCH END");
    PrintToChatAll("═══════════════════════════════");
    PrintToChatAll("Team A: %d | Team B: %d", teamAScore, teamBScore);
    PrintToChatAll("Winner: %s", winner);
    PrintToChatAll("═══════════════════════════════");
    
    PrintToServer("[Reporter] Match ended - Team A: %d, Team B: %d, Winner: %s", teamAScore, teamBScore, winner);
    
    // TODO: Send HTTP POST to API
    // This requires SteamWorks or Socket extension
    // Format: POST /api/match/report
    // Body: {"matchId": "...", "teamAScore": 100, "teamBScore": 50, "winner": "TEAM_A"}
    
    // For now, just log it
    PrintToServer("[Reporter] Would send to: %s/api/match/report", g_ApiUrl);
    PrintToServer("[Reporter] Payload: {\"matchId\":\"%s\",\"teamAScore\":%d,\"teamBScore\":%d,\"winner\":\"%s\"}", 
        g_MatchId, teamAScore, teamBScore, winner);
    
    g_MatchActive = false;
}

// Helper to get team score
int GetMatchTeamScore(int team) {
    int score = 0;
    
    // Try to get score from game rules
    int entity = FindEntityByClassname(-1, "terror_gamerules");
    if (entity != -1) {
        score = GetEntProp(entity, Prop_Send, team == 2 ? "m_iSurvivorScore" : "m_iCampaignScore");
    }
    
    return score;
}
