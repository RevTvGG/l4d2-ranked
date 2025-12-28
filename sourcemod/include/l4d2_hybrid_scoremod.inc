#if defined _l4d2_hybrid_scoremod_included
 #endinput
#endif
#define _l4d2_hybrid_scoremod_included

/**
 * Returns the health bonus for the current round
 * @return Health bonus points
 */
native int SMPlus_GetHealthBonus();

/**
 * Returns the damage bonus for the current round
 * @return Damage bonus points
 */
native int SMPlus_GetDamageBonus();

/**
 * Returns the pills bonus for the current round
 * @return Pills bonus points
 */
native int SMPlus_GetPillsBonus();

/**
 * Returns the max possible health bonus
 * @return Max health bonus
 */
native int SMPlus_GetMaxHealthBonus();

/**
 * Returns the max possible damage bonus
 * @return Max damage bonus
 */
native int SMPlus_GetMaxDamageBonus();

/**
 * Returns the max possible pills bonus
 * @return Max pills bonus
 */
native int SMPlus_GetMaxPillsBonus();
