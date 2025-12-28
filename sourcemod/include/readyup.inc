#if defined _readyup_included
 #endinput
#endif
#define _readyup_included

/**
 * Called when the round goes live (after ready-up period)
 */
forward void OnRoundIsLive();

/**
 * Native to check if a client is ready
 * @param client Client index
 * @return True if ready, false otherwise
 */
native bool IsReady(int client);

/**
 * Native to check if ready-up is currently active
 * @return True if in ready-up period, false if live
 */
native bool IsInReady();
