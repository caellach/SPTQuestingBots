﻿using Aki.Reflection.Patching;
using Comfort.Common;
using EFT;
using EFT.Game.Spawning;
using HarmonyLib;
using SPTQuestingBots.Controllers;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Text;
using System.Threading.Tasks;

namespace SPTQuestingBots.Patches
{
    public class TryToSpawnInZoneAndDelayPatch : ModulePatch
    {
        protected override MethodBase GetTargetMethod()
        {
            return typeof(BotSpawner).GetMethod("TryToSpawnInZoneAndDelay", BindingFlags.Public | BindingFlags.Instance);
        }

        [PatchPostfix]
        private static void PatchPostfix(BotZone botZone, GClass513 data, bool withCheckMinMax, bool newWave, List<ISpawnPoint> pointsToSpawn, bool forcedSpawn)
        {
            IEnumerable<string> botData = data.Profiles.Select(p => "[" + p.Info.Settings.Role.ToString() + " " + p.Nickname + "]");
            //LoggingController.LogInfo("Trying to spawn wave with: " + string.Join(", ", botData) + "...");
        }
    }
}
