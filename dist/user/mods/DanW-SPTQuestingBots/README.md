You're no longer the only PMC running around placing markers and collecting quest items. The bots have transcended and are coming for you...

**This is a work-in-progress! Many features are still in development. Please report bugs in the QuestingBots thread in Discord.**

**---------- Mod Compatibility ----------**

**REQUIRES:**
* [BigBrain](https://hub.sp-tarkov.com/files/file/1219-bigbrain/)
* [Waypoints](https://hub.sp-tarkov.com/files/file/1119-waypoints-expanded-bot-patrols-and-navmesh/)

**Highly Recommended:**
* [SAIN](https://hub.sp-tarkov.com/files/file/1062-sain-2-0-solarint-s-ai-modifications-full-ai-combat-system-replacement/)
* [Looting Bots](https://hub.sp-tarkov.com/files/file/1096-looting-bots/)

**NOT compatible with:**
* [AI Limit](https://hub.sp-tarkov.com/files/file/793-ai-limit/)
* [Traveler](https://hub.sp-tarkov.com/files/file/1212-traveler/) (You MUST use another mod like [SWAG + DONUTS](https://hub.sp-tarkov.com/files/file/878-swag-donuts-dynamic-spawn-waves-and-custom-spawn-points/) to manage PMC spawning when using this mod. Otherwise, PMC's will spawn right in front of you.) 
* Any other mods that disable AI in a similar manner. This mod relies on the AI being active throughout the entire map. **Starting with 0.2.10, Questing Bots has its own AI Limiter feature.** Please see the tab below for more information.

**Compatible with:**
* [SWAG + DONUTS](https://hub.sp-tarkov.com/files/file/878-swag-donuts-dynamic-spawn-waves-and-custom-spawn-points/) (if **initial_PMC_spawns.enabled=false** in this mod)
* [Late to the Party](https://hub.sp-tarkov.com/files/file/1099-late-to-the-party/) (if **initial_PMC_spawns.enabled=true** in this mod, set **adjust_bot_spawn_chances.enabled=false** in LTTP)

**NOTE: Please disable the PMC-spawning system in this mod if you're using other mods that manage spawning! Otherwise, there will be too many PMC's on the map.**

**The PMC-spawning system in this quest will be automatically disabled** if any of the following mods are detected:
* [SWAG + DONUTS](https://hub.sp-tarkov.com/files/file/878-swag-donuts-dynamic-spawn-waves-and-custom-spawn-points/)
* [MOAR](https://hub.sp-tarkov.com/files/file/1059-moar-bots-spawning-difficulty/)

**This mod will have a performance impact**, so unfortunately it may be difficult to use on slower computers. I'll work on optimizations in future releases.

**---------- Overview ----------**

There are two main components of this mod: adding an objective system to the AI and spawning PMC's only at the beginning of the raid to mimic live Tarkov.

**Objective System:**
Instead of simply patrolling their spawn areas, bots will now move around the map to perform randomly-selected quest objectives. By default this system is only active for PMC's, but it can be enabled for Scavs and bosses if you want an extra challenge.

After spawning (regardless of when this occurs during the raid), bots will immediately begin questing, and there are only a few conditions that will cause them to stop questing:
* They got stuck too many times
* They're over-encumbered
* They're trying to extract (using [SAIN](https://hub.sp-tarkov.com/files/file/1062-sain-2-0-solarint-s-ai-modifications-full-ai-combat-system-replacement/))

Otherwise, they will only temporarily stop questing for the following reasons:
* They're currently or were just recently in combat
* They recently completed an objective
* They're checking for or have found loot
* Their health is too low or they have blacked limbs (besides arms)
* Their energy or hydration is too low
* They have followers that are too far from them

There are currently several types of quests available to each bot:
* **EFT Quests:** Bots will go to locations specified in EFT quests for placing markers, collecting/placing items, killing other bots, etc. Bots can also use quests added by other mods. 
* **Spawn Rush:** At the beginning of the raid, bots that are within a certain distance of you will run to your spawn point. Only a certain number of bots are allowed to perform this quest, and they won't always select it. This makes Factory even more challenging. 
* **Boss Hunter:** Bots will search zones in which bosses are known to spawn. They will only be allowed to select this quest at the beginning of the raid (within the first 5 minutes by default).
* **Airdrop Chaser:** Bots will run to the most recent airdrop if it's close to them (within 500m by default). They will be allowed to select this quest within **questing.bot_quests.airdrop_bot_interest_time** seconds (420s by default) of the airdrop crate landing.
* **Spawn Point Wandering:** Bots will wander to different spawn points around the map. This is used as a last resort in case the bot doesn't select any other quests. 
* **"Standard" Quests:** Bots will go to specified locations around the map. They will prioritize more desirable locations for loot and locations that are closer to them. 
* **"Custom" Quests:** You can create your own quests for bots using the templates for "standard" quests.

**PMC Spawning System:**
At the beginning of the raid, PMC's will spawn around the map at actual EFT spawn points. The spawning system will try to separate spawn points as much as possible, but spawn killing is still entirely possible just like it is in live Tarkov. The number of initial PMC's is a random number between the minimum and maximum player count for the map (other mods can change these values). If you're using [Late to the Party](https://hub.sp-tarkov.com/files/file/1099-late-to-the-party/), the maximum number of PMC's will be reduced if you spawn into the map late for a Scav run. 

Only a certain (configurable) number of initial PMC's will spawn at the beginning of the raid, and the rest will spawn as the existing ones die. PMC's that spawn after the initial wave can spawn anywhere that is far enough from you and other bots (not just at EFT's PMC spawn points). All initial bosses must spawn first (except for Factory) or EFT may suppress them due to the high number of bots on the map. The PMC difficulty is set by your raid settings in EFT.

To accomodate the large initial PMC wave and still allow Scavs and bosses to spawn, the max-bot cap is (optionally) increased.

**NOTE: Please disable the PMC-spawning system in this mod if you're using other mods like [SWAG + DONUTS](https://hub.sp-tarkov.com/files/file/878-swag-donuts-dynamic-spawn-waves-and-custom-spawn-points/) that manage spawning! Otherwise, there will be too many PMC's on the map.**

**This mod will have a performance impact**, so unfortunately it may be difficult to use on slower computers. I'll work on optimizations in future releases.

**---------- Bot Quest-Selection Algorithm Overview ----------**

1) All quests are filtered to ensure they have at least one valid location on the map and the bot is able to accept the quest (it's not blocked by player level, etc.)
2) Quests are grouped by priority number in ascending order
3) For each group, the following is performed:
    1) Distances from the bot to each quest objective are calculated
    2) Quests are sorted in ascending order based on the distance from the bot to the nearest objective in each quest, but randomness is added via **distance_randomness**, which is a percentage of the total range of distances for the objectives in the group
    3) A random number from 1-100 is selected and compared to the **chance** setting for the first quest in the group. If the number is less than the value of **chance**, the quest is assigned to the bot. 
4) If the bot isn't assigned a quest from any of the groups in step (3), it's assigned a random quest from the lowest-priority group.

**---------- How to Add Custom Quests ----------**

**NOTE: I plan on changing quest data structures in the next major release, so expect this to change!**

To add custom quests to a map, first create a *user\mods\DanW-SPTQuestingBots-#.#.#\quests\custom* directory if it doesn't already exist. Then, create a file for each map for which you want to add custom quests. The file name should exactly match the corresponding file in the *user\mods\DanW-SPTQuestingBots-#.#.#\quests\standard* directory (case sensitive).

The three major data structures are:
* **Quests**: A quest is a collection of at least one quest objective, and objectives can be placed anywhere on the map. Objectives can be completed in any order. 

    Quests have the following properties:
    * **repeatable**: Boolean value indicating if the bot can repeat the quest later in the raid. This is typically used for quests that are PvP or PvE focused, where a bot might want to check an area again later in the raid for more enemies.
    * **pmcsOnly**: Only PMC's will be allowed to select the quest
    * **minLevel**: Only bots that are at least this player level will be allowed to select the quest
    * **maxLevel**: Only bots that are at most this player level will be allowed to select the quest
    * **maxBots**: The maximum number of bots that can be performing the quest at the same time.
    * **chanceForSelecting**: The chance (in percent) that the bot will accept the quest if the quest-selection algorithm selects it for the bot
    * **priority**: An integer indicating how the quest will be prioritized in the quest-selection algorithm. Quests that have a lower priority number are more likely to be selected.
    * **minRaidET**: The quest can only be selected if at least this many seconds have elapsed in the raid. If you're using mods like [Late to the Party](https://hub.sp-tarkov.com/files/file/1099-late-to-the-party/), this is based on the overall raid time, not the time after you spawn. For example, if you set **maxRaidET=60** for a quest and you spawn into a Factory raid with 15 minutes remaining, this quest will never be used because 300 seconds has already elapsed in the overall raid. This property is typically used to make bots rush to locations like Dorms when the raid begins. 
    * **maxRaidET**: The quest can only be selected if more more than this many seconds have elapsed in the raid. See **minRaidET** for more information.
    * **maxTimeOnQuest**: The maximum time (in seconds) that a bot is allowed to continue doing the quest after it completes at least one of its objectives. This is intended to add more variety to bot questing instead of having them stay in one area for a long period of time. By default, this is 300 seconds.
    * **canRunBetweenObjectives**: Boolean indicating if bots are allowed to sprint to the next objective in the quest after it completes at least one objective. This is intended to be used in areas where stealth is more important (typically in buildings). This is **true** by default. 
    * **requiredSwitches**: A dictionary of the switches that must be in a specific position bot bots to perform the quest. The dictionary key is the ID of the switch, and the value is a boolean indicating if the switch must be open (actuated). If the dictionary is empty, no switches will be checked. 
    * **name**: The name of the quest. This doesn't have to be unique, but it's best if it is to avoid confusion when troubleshooting.
    * **objectives**: An array of the objectives in the quest. Bots can complete objectives in any order. 

* **Objectives**: An objective is a collection of at least one step. An objective represents a list of actions that the bot must complete in the order you specify. 

    Quest objectives have the following properties:
    * **repeatable**: Boolean value indicating if the bot can repeat the quest objective later in the raid. This is typically used for quests are are PvP or PvE focused, where a bot might want to check an area again later in the raid for more enemies.
    * **minDistanceFromBot**: The objective will only be selected if the bot is at least this many meters away from it.
    * **maxDistanceFromBot**: The objective will only be selected if the bot is no more than this many meters away from it.
    * **maxRunDistance**: If bots get within this radius (in meters) of the position for the first step in the objective, they will no longer be allowed to sprint. This is intended to be used in areas where stealth is more important (typically in buildings). This is **0** by default. 
    * **steps**: An array of the steps in the objective. Bots will complete the steps exactly in the order you specify.

* **Steps**: A step is an individual component of an objective. 

    Quest objective steps have the following properties:
    * **position**: The position on the map that the bot will try to reach
    * **waitTimeAfterCompleting**: The time the bot must wait after completing the step before it will be allowed to quest again. This is **10** s by default. 
    * **stepType**: The only valid options for this are "MoveToPosition", "PlantItem", "ToggleSwitch" (case-sensitive), and "RequestExtract". If omitted, "MoveToPosition" is used by default.
    * **minElapsedTime**: If **stepType="PlantItem"**, this is the time the bot will spend "planting its item". If the bot is interrupted during this time, the timer restarts. This is **0** s by default, so it must be defined if you set **stepType="PlantItem"**.
    * **switchID**: If **stepType="ToggleSwitch"**, this is the ID of the switch the bot should open. It needs to exactly match one of the results in the "Found switches" debug message shown in the bepinex console when loading into the map. 

**Tips and Tricks**
* Objectives should be sparsely placed on the map. Since bots take a break from questing after each objective is completed, they will wander around the area (for an unknown distance) before continuing the quest. If you place objective positions too close to each other, the bot will unnecessarily run back and forth around the area. As a rule of thumb, place objectives at least 20m from each other. 
* If you want a bot to go to several specific positions that are close to each other (i.e. small, adjacent rooms), use multiple steps in a single objective instead of using multiple objectives each with a single step. 
* Bots will use the NavMesh to calculate the more efficient path to their objective (using an internal Unity algorithm). They cannot perform complex actions to reach objective locations, so avoid placing objective steps on top of objects (i.e. inside truck beds) or in areas that are difficult to reach. Bots will not know to crouch or jump to get around obstacles. 

**---------- PMC Group Spawning System ----------**

* Spawn chances for various group sizes are configurable. By default, solo spawns are most likely, but 2-man and 3-man groups will be commonly seen. 4-man and 5-man groups are rare but possible. 
* EFT will assign one bot in the group to be a "boss", and the boss will select the quest to perform. All other bots in the group will follow the boss.
* If any group members stray too far from the boss, the boss will stop questing and attempt to regroup
* If any member of the group engages in combat, all other members will stop questing (or following) and engage in combat too. 
* If the boss is allowed to sprint, so are its followers and vice versa. 
* If the boss of a PMC group dies, EFT will automatically assign a new one from the remaining members
* Followers are only allowed to loot if they remain within a certain distance from the boss

**---------- AI Limiter System ----------**

Since normal AI Limit mods will disable bots that are questing (which will prevent them from exploring the map), this mod has its own AI Limiter with the following features:
* AI Limiting must be explicitly enabled in the F12 menu. 
* AI Limiting must be explicitly enabled for bots that are questing for each map. By default, questing bots will only be disabled on Streets. 
* Bots will only be allowed to be disabled if they are beyond a certain distance (200m by default) from you
* Bots will only be allowed to be disabled if they are beyond a certain distance (75m by default) from other bots that are questing (and not disabled)

**---------- Configuration Options in *config.json* ----------**

**Main Options:**
* **enabled**: Completely enable or disable all featues of this mod. 
* **debug.enabled**: Enable debug mode.
* **debug.scav_cooldown_time**: Cooldown timer (in seconds) after a Scav raid ends before you're allowed to start another one. This is **1500** by default, which is the same as the base game.
* **debug.full_length_scav_raids**: If **true**, Scav raids will always be full-length. 
* **debug.free_labs_access**: If **true**, Labs cards are no longer required to enter Labs, and you're also allowed to do Scav runs in Labs. 
* **debug.always_spawn_pmcs**: If **true**, PMC's will spawn even when you select "None" for the amount of bots when starting a raid. 
* **debug.show_zone_outlines**: If **true**, EFT quest zones will be outlined in light blue. Target locations for each zone will have light-blue spherical outlines.
* **debug.show_failed_paths**: If **true**, whenever a bot gets stuck its target path will be drawn in red. 
* **debug.show_door_interaction_test_points**: If **true**, the positions tested when determining where bots should travel to unlock doors will have spherical outlines. If the a valid NavMesh position cannot be found for the test point, the outline color will be white. If a valid NavMesh position is found but the bot cannot access that point, the outline color will be yellow. If a valid NavMesh position is found and the bot can access that point, the outline color will be magenta. The position selected for the bot will be shown with a green outline. 
* **max_calc_time_per_frame_ms**: The maximum amount of time (in milliseconds) the mod is allowed to run quest-generation and PMC-spawning procedures per frame. By default this is set to **5** ms, and delays of <15 ms are basically imperceptible. 

**Questing Options:**
* **questing.enabled**: Completely enable or disable questing. 
* **questing.bot_pathing_update_interval_ms**: The interval (in milliseconds) at which each bot will recalculate its path to its current objective. If this value is very low, performance will be impacted. If this value is very high, the bot will not react to obstacles changing as quickly (i.e. doors being unlocked). By default, this is **100** ms.
* **questing.brain_layer_priority**: The priority number assigned to the questing "brain" layer. **Do not change this unless you know what you're doing!** By default, this is set to **26** which is higher than most EFT brain layers and higher than [SAIN](https://hub.sp-tarkov.com/files/file/1062-sain-2-0-solarint-s-ai-modifications-full-ai-combat-system-replacement/)'s brain layers. If this is set much lower than 26, bots will prioritize other actions. If you're using [SAIN](https://hub.sp-tarkov.com/files/file/1062-sain-2-0-solarint-s-ai-modifications-full-ai-combat-system-replacement/) and you reduce this to be less than 23, bots will never quest. 
* **questing.quest_selection_timeout**: If a quest cannot be selected for a bot after trying for this amount of time (in seconds), the mod will give up and write an error message.
* **questing.allowed_bot_types_for_questing.scav**: If Scavs are allowed to quest. This is **false** by default.
* **questing.allowed_bot_types_for_questing.pmc**: If PMC's are allowed to quest. This is **true** by default.
* **questing.allowed_bot_types_for_questing.boss**: If bosses are allowed to quest. This is **false** by default. Boss followers will never be allowed to quest. 
* **questing.allowed_bot_types_for_questing.min/max**: The minimum and maximum time (in seconds) that a bot will wait after ending combat before it's allowed to quest again. After the bot is no longer actively engaged in combat, it will continue its quest following a random delay between these two values. This is to allow the bot to search for threats before blindly running toward its objective. 
* **questing.stuck_bot_detection.distance**: The minimum distance (in meters) the bot must travel over a period of **questing.stuck_bot_detection.time** seconds while questing or the mod will assume it's stuck. This is **2** m by default.
* **questing.stuck_bot_detection.time**: The maximum time (in seconds) the bot is allowed to move less than **questing.stuck_bot_detection.distance** meters while questing or the mod will assume it's stuck. This is **20** s by default.
* **questing.stuck_bot_detection.max_count**: The maximum number of times the bot can be stuck before questing is completely disabled for it. This counter is reset whenever the bot completes an objective. Whenever the bot is assumed to be stuck, a new objective will be selected for it to force it to generate a different path. This is **8** by default. 
* **questing.stuck_bot_detection.follower_break_time**: If a boss follower is stuck while trying to follow it, it will take a break for this many seconds (**10** by default).
* **questing.unlocking_doors.enabled.scav**: If questing Scavs are allowed to open locked doors. This is **false** by default.
* **questing.unlocking_doors.enabled.pmc**: If questing PMC's are allowed to open locked doors. This is **true** by default.
* **questing.unlocking_doors.enabled.boss**: If questing bosses are allowed to open locked doors. This is **false** by default.
* **questing.unlocking_doors.search_radius**: The distance (in meters) to search around the bot for locked doors. This is **25**m by default.
* **questing.unlocking_doors.max_distance_to_unlock**: The maximum distance (in meters) that a bot is allowed to be from a door in order to unlock it. This is **0.5**m by default. **Do not change this unless you know what you're doing!** 
* **questing.unlocking_doors.door_approach_position_search_radius**: The distance (in meters) to search around doors for positions that are on the NavMesh and have complete paths to the bot's current location. This is **0.75**m by default. **Do not change this unless you know what you're doing!** 
* **questing.unlocking_doors.door_approach_position_search_offset**: The distance (in meters) to offset the search positions around doors determined by **questing.unlocking_doors.door_approach_position_search_radius**. This is **-0.75**m by default. **Do not change this unless you know what you're doing!** 
* **questing.unlocking_doors.pause_time_after_unlocking**: The time (in seconds) bots must wait after unlocking doors before they're allowed to continue with their quests. If this is too low, their pathing will not be updated and they may fail the quest they're currently doing. **Do not change this unless you know what you're doing!** 
* **questing.unlocking_doors.debounce_time**: The time (in seconds) bots must wait after selecting a door to unlock before they're allowed to select another one to unlock. This is to prevent bots from rapidly selecting doors instead of allowing them to change objectives. This is **1**s by default. 
* **questing.unlocking_doors.default_chance_of_bots_having_keys**: The default chance (in percentage) that bots will have keys for quest locations.
* **questing.min_time_between_switching_objectives**: The minimum amount of time (in seconds) the bot must wait after completing an objective before a new objective is selected for it. This is to allow it to check its surroundings, search for loot, etc. This is **5** s by default. 
* **questing.wait_time_before_planting**: If the bot needs to plant an item at a quest location, this is the time (in seconds) it will wait between reaching its target location and beginning to "plant" the required item. This is **1** s by default. If this is much lower than **1** s, there may be strange behavior when the bot transitions into planting its item.
* **questing.quest_generation.navmesh_search_distance_item**: The radius (in meters) around quest items (i.e. the bronze pocket watch) to seach for a valid NavMesh position to use for a target location for creating a quest objective for it. If this value is too low, bots may not be able to generate a complete path to the item. If this value is too high, bots may generate paths into adjacent rooms or to vertical positions on different floors. This is **1.5** m by default. 
* **questing.quest_generation.navmesh_search_distance_zone**: The radius (in meters) around target positions in zones (i.e. trigger areas for placing markers) to seach for a valid NavMesh position to use for a target location for creating a quest objective for it. If this value is too low, bots may not be able to generate a complete path to the zone. If this value is too high, bots may generate paths into adjacent rooms or to vertical positions on different floors. This is **1.5** m by default. The target position for a zone is the center-most valid NavMesh position in it. If the zone surrounds multiple floors in a building, the lowest floor is typically used. 
* **questing.quest_generation.navmesh_search_distance_spawn**: The radius (in meters) around spawn points to seach for a valid NavMesh position to use for a target location for creating a quest objective for it. If this value is too low, bots may not be able to generate a complete path to the spawn point. If this value is too high, bots may generate paths into adjacent rooms or to vertical positions on different floors. This is **2** m by default. 
* **questing.quest_generation.navmesh_search_distance_doors**: The radius (in meters) to search for a valid NavMesh position around the test points used for determining if a bot can unlock a door. If this value is too low, bots may not be able to unlock the door. If this value is too high, bots may generate paths into adjacent rooms or to vertical positions on different floors. This is **0.75** m by default. 
* **questing.bot_search_distances.objective_reached_ideal**: Bots must travel within this distance (in meters) of their target objective positions for the objective to be considered successfully completed. This is **0.25** m by default. 
* **questing.bot_search_distances.objective_reached_navmesh_path_error**: The maximum distance (in meters) that the end of a bot's calculated path can be from its target objective position before the objective is considerd unreachable. This is **20** m by default. 
* **questing.bot_search_distances.max_navmesh_path_error**: If a complete path cannot be generated to a bot's target objective position, it will try to get within this radius (in meters) of it anyway. This is to simulate situations like bots checking if a door is unlocked when it doesn't have the key. This is **10** m by default. 
* **questing.bot_questing_requirements.exclude_bots_by_level**: Each quest has a minimum and maximum player level assigned to it. If this option is **true** (which is the default setting), bots will only be allowed to select a quest if its player level is within this range. This prevents low-level bots from selecting end-game quests and vice versa. 
* **questing.bot_questing_requirements.repeat_quest_delay**: The minimum delay (in seconds) after a bot stops performing objectives for a repeatable quest before it's allowed to repeat the quest. This is **300** s by default. 
* **questing.bot_questing_requirements.max_time_per_quest**: The maximum amount of time (in seconds) that bots are allowed to perform objectives for the same quest. This is to encourage questing diversity for bots and to deter them from remaining in the same area for a long time. This is **300** s by default. 
* **questing.bot_questing_requirements.min_hydration**: The minimum hydration level permitted for bots or they will not be allowed to quest. This is **20** by default. 
* **questing.bot_questing_requirements.min_energy**: The minimum energy level permitted for bots or they will not be allowed to quest. This is **20** by default. 
* **questing.bot_questing_requirements.min_health_head**: The minimum permitted health percentage of a bot's head or it will not be allowed to quest. This is **50%** by default.
* **questing.bot_questing_requirements.min_health_chest**: The minimum permitted health percentage of a bot's chest or it will not be allowed to quest. This is **50%** by default.
* **questing.bot_questing_requirements.min_health_stomach**: The minimum permitted health percentage of a bot's stomach or it will not be allowed to quest. This is **50%** by default.
* **questing.bot_questing_requirements.min_health_legs**: The minimum permitted health percentage of either of a bot's legs or it will not be allowed to quest. This is **50%** by default.
* **questing.bot_questing_requirements.max_overweight_percentage**: The maximum total weight permitted for bots (as a percentage of their overweight threshold) or they will not be allowed to quest. This is **100%** by default. 
* **questing.bot_questing_requirements.break_for_looting.enabled**: If **true** (the default setting), bots will temporarily stop questing at certain intervals to check for loot (or whatever). 
* **questing.bot_questing_requirements.break_for_looting.min_time_between_looting_checks**: The minimum delay (in seconds) after a bot takes a break to check for loot before it will be allowed to take a break again. If this value is very low, bots may frequently back-track and may never reach their objectives. If this value is high, bots will rarely loot. This is **50** s by default. 
* **questing.bot_questing_requirements.break_for_looting.min_time_between_follower_looting_checks**: The minimum delay (in seconds) after any of a bot's followers take a break to check for loot before they will be allowed to take a break again. If this value is very low, bot groups may frequently back-track and may never reach their objectives. If this value is high, followers will rarely loot. This is **30** s by default. 
* **questing.bot_questing_requirements.break_for_looting.min_time_between_looting_events**: The minimum delay (in seconds) after a bot successfully finds loot before it will be allowed to take a break again. If this value is very low, bots may frequently back-track and may never reach their objectives. If this value is high, bots will rarely loot. This supersedes **bot_questing_requirements.break_for_looting.min_time_between_looting_checks**, and it requires [Looting Bots](https://hub.sp-tarkov.com/files/file/1096-looting-bots/) (or it will be ignored). This is **80** s by default. 
* **questing.bot_questing_requirements.break_for_looting.max_time_to_start_looting**: The duration of each break (in seconds). If one of the [Looting Bots](https://hub.sp-tarkov.com/files/file/1096-looting-bots/) brain layers is not active after this time, the bot will resume questing. This is **2** s by default. 
* **questing.bot_questing_requirements.break_for_looting.max_loot_scan_time**: The maximum time that bots will be allowed to search for loot via [Looting Bots](https://hub.sp-tarkov.com/files/file/1096-looting-bots/). If the bot hasn't found any loot within this time, it will continue questing. If it has found loot, it will not continue questing until it's completely finished with looting. This is **4** s by default. 
* **questing.bot_questing_requirements.break_for_looting.max_distance_from_boss**: The maximum distance (in meters) that a follower will be allowed to travel from its boss while looting. If the follower exceeds this distance, it will be forced to stop looting and regroup. This is **75** m by default. 
* **questing.bot_questing_requirements.max_follower_distance.max_wait_time**: The maximum time (in seconds) that a bot's followers are allowed to be too far from it before it will stop questing and regroup. This is **5** s by default. 
* **questing.bot_questing_requirements.max_follower_distance.min_regroup_time**: The minimum time (in seconds) that a bot will be forced to regroup with its followers if it's too far from them. After this time, the bot will be allowed to patrol its area instead. This is **1** s by default. 
* **questing.bot_questing_requirements.max_follower_distance.target_range.min/max**: The allowed range of distances (in meters) that followers will try to be from their boss while questing. If a follower needs to get closer to its boss, it will try to get within the **min** distance (**10** m by default) of it. After that, it will be allowed to wander up to the **max** distance (**20** m by default) from it.
* **questing.bot_questing_requirements.max_follower_distance.nearest**: If the bot has any followers, it will not be allowed to quest if its nearest follower is more than this distance (in meters) from it. This is **25** m by default. 
* **questing.bot_questing_requirements.max_follower_distance.furthest**: If the bot has any followers, it will not be allowed to quest if its furthest follower is more than this distance (in meters) from it. This is **40** m by default. 
* **questing.extraction_requirements.must_extract_time_remaining**: The time remaining in the raid (in seconds) after which bots will be unable to select new quest objectives and must extract instead. Requires [SAIN](https://hub.sp-tarkov.com/files/file/1062-sain-2-0-solarint-s-ai-modifications-full-ai-combat-system-replacement/) 2.1.7 or later. By default, this is **300** s. 
* **questing.extraction_requirements.total_quests.min/max**: The minimum and maximum quests that a bot must complete before being instructed to extract. The actual number is randomly selected between this range. Requires [SAIN](https://hub.sp-tarkov.com/files/file/1062-sain-2-0-solarint-s-ai-modifications-full-ai-combat-system-replacement/) 2.1.7 or later. Bots can still be instructed to extract if they satisfy their **questing.extraction_requirements.EFT_quests.min/max** requirement. 
* **questing.extraction_requirements.EFT_quests.min/max**: The minimum and maximum EFT quests that a bot must complete before being instructed to extract. The actual number is randomly selected between this range. Requires [SAIN](https://hub.sp-tarkov.com/files/file/1062-sain-2-0-solarint-s-ai-modifications-full-ai-combat-system-replacement/) 2.1.7 or later. Bots can still be instructed to extract if they satisfy their **questing.extraction_requirements.total_quests.min/max** requirement. 
* **questing.bot_quests.distance_randomness**: The amount of "randomness" to apply when selecting a new quest for a bot. This is defined as a percentage of the total range of distances between the bot and every quest objective available to it. By default, this is **30%**. 
* **questing.bot_quests.blacklisted_boss_hunter_bosses**: An array containing the names of bosses that bots doing the "Boss Hunter" quest will not be allowed to hunt.
* **questing.bot_quests.airdrop_bot_interest_time**: The time (in seconds) after an airdop lands during which bots can go to it via an "Airdrop Chaser" quest. This is **420** s by default. 
* **questing.bot_quests.eft_quests.xxx**: The settings to apply to all quests based on EFT's quests. 
* **questing.bot_quests.spawn_rush.xxx**: The settings to apply to the "Spawn Rush" quest. 
* **questing.bot_quests.spawn_point_wander.xxx**: The settings to apply to the "Spawn Point Wandering" quest.
* **questing.bot_quests.boss_hunter.xxx**: The settings to apply to the "Boss Hunter" quest. 
* **questing.bot_quests.airdrop_chaser.xxx**: The settings to apply to the "Airdrop Chaser" quest. 

**Options for Each Section in *bot_quests*:**
* **desirability**: The desirability rating (in percent) of the quest. Bots will be more likely to select quests with higher desirability ratings. 
* **max_bots_per_quest**: The maximum number of bots that can actively be performing each quest of that type.
* **min_distance**: Each objective in the quest will only be selected if the bot is at least this many meters away from it.
* **max_distance**: Each objective in the quest will only be selected if the bot is at most this many meters away from it.
* **max_raid_ET**: The quest can only be selected if this many seconds (or less) have elapsed in the raid. If you're using mods like [Late to the Party](https://hub.sp-tarkov.com/files/file/1099-late-to-the-party/), this is based on the overall raid time, not the time after you spawn. For example, if you set **maxRaidET=60** for a quest and you spawn into a Factory raid with 15 minutes remaining, this quest will never be used because 300 seconds has already elapsed in the overall raid.
* **chance_of_having_keys**: The chance that bots will have keys for the locations specified in the quests.
* **min_level**: The absolute minimum player level allowed for bots to select the quest. 
* **max_level**: The absolute maximum player level allowed for bots to select the quest. 
* **level_range**: An array of [minimum player level for the quest, level range] pairs to determine the maximum player level for each quest of that type. This value is added to the minimum player level for the quest. For example, if a quest is only available at level 15, the level range for it will be 20 (as determined via interpolation of this array using its default values). As a result, only bots between levels 15 and 35 will be allowed select that quest. 

**PMC Spawning Options:**
* **initial_PMC_spawns.enabled**: Enable initial PMC spawning (**true** by default). This should be changed to **false** if you're using any other mod that manages spawning like [SWAG + DONUTS](https://hub.sp-tarkov.com/files/file/878-swag-donuts-dynamic-spawn-waves-and-custom-spawn-points/).
* **initial_PMC_spawns.blacklisted_pmc_bot_brains**: An array of the bot "brain" types that SPT will not be able to use when generating initial PMC's. These "brain" types have behaviors that inhibit their ability to quest, and this causes them to get stuck in areas for a long time (including their spawn locations). **Do not change this unless you know what you're doing!**
* **initial_PMC_spawns.min_distance_from_players_initial**: The minimum distance (in meters) that a bot must be from you and other bots when selecting its spawn point. This is used for the first wave of initial PMC spawns and is **25** m by default. 
* **initial_PMC_spawns.min_distance_from_players_during_raid**: The minimum distance (in meters) that a bot must be from you and other bots when selecting its spawn point. This is used after the first wave of initial PMC spawns and is **100** m by default. 
* **initial_PMC_spawns.min_distance_from_players_during_raid_factory**: The minimum distance (in meters) that a bot must be from you and other bots when selecting its spawn point. This is used after the first wave of initial PMC spawns and is **50** m by default. However, this is only used for Factory raids and replaces **initial_PMC_spawns.min_distance_from_players_during_raid**.
* **initial_PMC_spawns.max_alive_initial_pmcs**: The maximum number of initial PMC's that can be alive at the same time on each map. This only applies to initial PMC's generated by this mod; it doesn't apply to PMC's spawned by other mods or for Scavs converted to PMC's automatically by SPT. 
* **initial_PMC_spawns.initial_pmcs_vs_raidET**: If you spawn late into the raid, the minimum and maximum initial PMC's will be reduced by a factor determined by this array. The array contains [fraction of raid time remaining, fraction of initial PMC's allowed] pairs, and there is no limit to the number of pairs. This requires [Late to the Party](https://hub.sp-tarkov.com/files/file/1099-late-to-the-party/) to function. 
* **initial_PMC_spawns.bots_per_group_distribution**: An array describing how likely PMC groups of various sizes are allowed to spawn. When generating initial PMC groups, this mod will select a random number for each group between 0 and 1. It will then use interpolation to determine how many bots to add to the group using this array. The first column is the look-up value for the random number selected for the group, and the second column is the number of bots to add to the group. The interpolated value for number of bots is rounded to the nearest integer.
* **initial_PMC_spawns.spawn_retry_time**: If any PMC's fail to spawn, no other attempts will be made to spawn PMC's for this amount of time (in seconds). By default, this is **10** s.
* **initial_PMC_spawns.min_other_bots_allowed_to_spawn**: PMC's will not be allowed to spawn unless there are fewer than this value below the maximum bot count for the map. For example, if this value is 4 and the maximum bot cap is 20, PMC's will not be allowed to spawn if there are 17 or more alive bots in the map. This is to retain a "buffer" below the maximum bot cap so that Scavs are able to continue spawning throughout the raid. This is **4** by default. 
* **initial_PMC_spawns.max_initial_bosses**: The maximum number of bosses that are allowed to spawn at the beginning of the raid (including Raiders and Rogues). After this number is reached, all remaining initial boss spawns will be canceled. If this number is too high, few Scavs will be able to spawn after the initial PMC spawns. This is **10** by default. 
* **initial_PMC_spawns.max_initial_rogues**: The maximum number of Rogues that are allowed to spawn at the beginning of the raid. After this number is reached, all remaining initial Rogue spawns will be canceled. If this number is too high, few Scavs will be able to spawn after the initial PMC spawns. This is **6** by default. 
* **initial_PMC_spawns.add_max_players_to_bot_cap**: If this is **true** (which is the default setting), the maximum bot cap for the map will be increased by the maximum number of players for the map. This is to better emulate live Tarkov where there can still be many Scavs around the map even with a full lobby. 
* **initial_PMC_spawns.max_initial_rogues**: The maximum bot cap for the map will not be allowed to be increased by more than this value. If this value is too high, performance may be impacted. This is **5** by default. 
* **initial_PMC_spawns.max_total_bots**: The highest allowed maximum bot cap for any map. If this value is too high, performance may be impacted. This is **26** by default. 

**---------- Known Issues ----------**

**Objective System:**
* Mods that add a lot of new quests may cause latency issues that may result in game stability problems and stuttering
* Bots tend to get trapped in certain areas. Known areas:
    * Customs between Warehouse 4 and New Gas
    * Lighthouse in the mountains near the Resort spawn
    * Lighthouse on the rocks near the helicopter crash
    * Lighthouse in various rocky areas
* Bots blindly run to their objective (unless they're in combat) even if it's certain death (i.e. running into the Sawmill when Shturman is there). They will only engage you if they see you, so they may blindly run right past you. Honestly, this isn't so unrealistic compared to live Tarkov...
* Bots take the most direct path to their objectives, which may involve running in the middle of an open area without any cover.
* Certain bot "brains" stay in a combat state for a long time, during which they're unable to continue their quests.
* Certain bot "brains" are blacklisted because they cause the bot to always be in a combat state and therefore never quest (i.e. exUSEC's when they're near a stationary weapon)
* Some quest items or locations can't be resolved:
    * Fortress for Capturing Outposts in Customs
    * Scav Base for Capturing Outposts in Woods
    * Health Resort for Capturing Outposts in Shoreline
    * Bronze pocket watch for Checking in Customs
    * Flash drive with fake info for Bullshit in Customs
    * Mountain Area for Return the Favor in Woods
    * The second and third bunkers for Assessment Part 2 in Woods
    * The satellite antenna in the USEC camp for Return the Favor in Woods
    * The USEC camp for Search Mission in Woods
    * The cottage area for Overpopulation in Lighthouse
    * The main area for Assessment - Part 1 in Lighthouse
    * The bridge for Knock-Knock in Lighthouse
    * All locations for Long Line in Interchange
    * The 21WS Container for Provocation in Interchange
    * The underground depot for Safe Corridor in Reserve
    * One of the locations for Bunker Part 2 in Reserve (not sure which)
* Bots sometimes unlock doors for no reason if they can't properly resolve their quest locations. Examples include marking the tanker at New Gas in Customs; bots will fail to find a position to mark the tanker and then nearby unlock rooms in New Gas for no reason.
* Bots will frequently unlock doors, go into the room, and not loot anything.
* A *"Destroying GameObjects immediately is not permitted during physics trigger/contact, animation event callbacks or OnValidate. You must use Destroy instead."* error will sometimes appear in the game console after a bot unlocks a door. This can be ignored. 
* Player-level ranges for some quests are not reasonable, so bots may do late-game quests at low player levels and vice versa. This is because EFT has no minimum level defined for several quest lines.

**PMC Spawning System:**
* If one of the members of a PMC group is a straggler, the whole group will wait around for him
* Not all PMC's spawn into Streets because too many Scavs spawn into the map first
* Scavs can spawn close to PMC's (SPT limitation)
* If there is a lot of PMC action at the beginning of the raid, the rest of the raid will feel dead. However, this isn't so different from live Tarkov. 
* In maps with a high number of max players, Scavs don't always spawn when the game generates them if your **max_alive_initial_pmcs** setting is high
* In maps with a high number of max players, performance can be pretty bad if your **max_alive_initial_pmcs** or **max_total_bots** settings are high
* Noticeable stuttering for (possibly) several seconds when the initial PMC wave spawns if your **max_alive_initial_pmcs** setting is high

**---------- Roadmap (Expect Similar Accuracy to EFT's) ----------**

* **0.4.0** (ETA: Early January)
    * New standard quests for Streets expansion areas
    * Prevent bots from sprinting in more areas
    * Another quest-selection algorithm overhaul to replace the "priority" system with a "desirability" score for each quest
* **0.5.0** (ETA: Mid January)
    * Move initial quest-data generation to the server to protect for mods that add lots of quests (like QuestManiac)
    * Invoke SAIN's logic for having bots extract from the map (advanced system based on the properties of quests that have been completed)
* **0.5.1** (ETA: Late January)
    * Add new quest type: hidden-stash running
    * Add optional quest prerequisite to have at least one item in a list (i.e. a sniper rifle for sniping areas or an encoded DSP for Lighthouse)
    * Add configuration options to overwrite default settings for EFT-based quests and their objectives
* **Backlog (No ETA)**
    * Control spawning of player Scavs. Requires SPT changes.
    * Allow player Scavs to quest (without allowing all Scavs to quest).
    * Improve bot-spawn scheduling with initial PMC spawns to prevent them from getting "stuck in the queue" and not spawning until most of the Scavs die
* **Not Planned**
    * Add waypoints to have PMC's path around dangerous spots in the map or in very open areas
    * Improve PMC senses to dissuade them from going to areas where many bots have died. Might require interaction with SAIN; TBD.

**---------- Credits ----------**

* Thanks to [Props](https://hub.sp-tarkov.com/user/18746-props/) for sharing the code [DONUTS](https://hub.sp-tarkov.com/files/file/878-swag-donuts-dynamic-spawn-waves-and-custom-spawn-points/) uses to spawn bots. This was the inspiration to create this mod. 
* Thanks to [DrakiaXYZ](https://hub.sp-tarkov.com/user/30839-drakiaxyz/) for creating [BigBrain](https://hub.sp-tarkov.com/files/file/1219-bigbrain/) and [Waypoints](https://hub.sp-tarkov.com/files/file/1119-waypoints-expanded-bot-patrols-and-navmesh/) and for all of your help with developing this mod. 
* Thanks to [nooky](https://hub.sp-tarkov.com/user/29062-nooky/) for lots of help with testing and ensuring this mod remains compatible with [SWAG + DONUTS](https://hub.sp-tarkov.com/files/file/878-swag-donuts-dynamic-spawn-waves-and-custom-spawn-points/). 
* Thanks to everyone else on Discord who helped to test the many alpha releases of this mod and provided feedback to make it better. There are too many people to name, but you're all awesome. 
* Of course, thanks to the SPT development team who made this possible in the first place. 