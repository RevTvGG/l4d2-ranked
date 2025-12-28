#if defined _l4d2_survivor_mvp_included
 #endinput
#endif
#define _l4d2_survivor_mvp_included

/**
 * Gets the client index of the current MVP
 * @return Client index, or -1 if none
 */
native int SURVMVP_GetMVP();

/**
 * Gets the damage count for a specific client
 * @param client Client index
 * @return Damage dealt
 */
native int SURVMVP_GetMVPDmgCount(int client);

/**
 * Gets the SI kill count for a specific client
 * @param client Client index
 * @return SI kills
 */
native int SURVMVP_GetMVPKills(int client);

/**
 * Gets the common infected kill count for a specific client
 * @param client Client index
 * @return Common infected kills
 */
native int SURVMVP_GetMVPCIKills(int client);

/**
 * Gets the friendly fire count for a specific client
 * @param client Client index
 * @return Friendly fire damage dealt
 */
native int SURVMVP_GetMVPFFCount(int client);
