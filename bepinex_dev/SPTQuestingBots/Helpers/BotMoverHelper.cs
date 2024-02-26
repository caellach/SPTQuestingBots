using HarmonyLib;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Text;
using System.Threading.Tasks;
using UnityEngine;

namespace SPTQuestingBots.Helpers
{
    public static class BotMoverHelper
    {

        static FieldInfo PathControllerField = AccessTools.Field(typeof(BotMover), "GClass422_0");
        static FieldInfo CurPathContainerField = AccessTools.Field(typeof(GClass466), "CurPath");
        static FieldInfo Vector3ArrayField = AccessTools.Field(typeof(Vector3[]), "vector3_0");

        public static Vector3[] GetCurPath(this BotMover botMover)
        {
            var pathController = (GClass422)PathControllerField.GetValue(botMover);
            var curPathContainer = (GClass466)CurPathContainerField.GetValue(pathController);
            var vector3Array = (Vector3[])Vector3ArrayField.GetValue(curPathContainer);

            return vector3Array;
        }
    }

}
