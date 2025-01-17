﻿using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Reflection;
using System.Text;
using System.Threading.Tasks;
using Comfort.Common;
using DrakiaXYZ.BigBrain.Brains;
using EFT;
using EFT.Interactive;
using HarmonyLib;
using SPTQuestingBots.Configuration;
using SPTQuestingBots.Controllers;
using UnityEngine;

namespace SPTQuestingBots.BehaviorExtensions
{
    public abstract class CustomLogicDelayedUpdate : CustomLogic
    {
        protected BotLogic.Objective.BotObjectiveManager ObjectiveManager { get; private set; }
        protected GClass114 baseAction { get; private set; } = null;
        protected static int updateInterval { get; private set; } = 100;

        private PropertyInfo cornerIndexField = null;
        private Stopwatch updateTimer = Stopwatch.StartNew();
        private Stopwatch actionElapsedTime = new Stopwatch();

        // Find by CreateNode(BotLogicDecision type, BotOwner bot) -> case BotLogicDecision.simplePatrol -> private gclass object
        private GClass288 baseSteeringLogic = new GClass288();

        protected double ActionElpasedTime => actionElapsedTime.ElapsedMilliseconds / 1000.0;

        public CustomLogicDelayedUpdate(BotOwner botOwner) : base(botOwner)
        {
            cornerIndexField = AccessTools.Property(typeof(BotMover), "_cornerIndex");
            ObjectiveManager = BotLogic.Objective.BotObjectiveManager.GetObjectiveManagerForBot(botOwner);
        }

        public CustomLogicDelayedUpdate(BotOwner botOwner, int delayInterval) : this(botOwner)
        {
            updateInterval = delayInterval;
        }

        public override void Start()
        {
            RestartActionElapsedTime();
        }

        public override void Stop()
        {
            actionElapsedTime.Stop();

            BotOwner.Mover.Sprint(false);
        }

        public void StartActionElapsedTime()
        {
            actionElapsedTime.Start();
        }

        public void PauseActionElapsedTime()
        {
            actionElapsedTime.Stop();
        }

        public void RestartActionElapsedTime()
        {
            actionElapsedTime.Restart();
        }

        public void SetBaseAction(GClass114 _baseAction)
        {
            baseAction = _baseAction;
            baseAction.Awake();
        }

        public void UpdateBaseAction()
        {
            baseAction?.Update();
        }

        public void CheckMinElapsedActionTime()
        {
            if (ActionElpasedTime >= ObjectiveManager.MinElapsedActionTime)
            {
                ObjectiveManager.CompleteObjective();
            }
        }

        public void UpdateBotMovement(bool canSprint = true)
        {
            // Stand up
            BotOwner.SetPose(1f);

            // Move as fast as possible
            BotOwner.SetTargetMoveSpeed(1f);
            
            // Open doors blocking the bot's path
            BotOwner.DoorOpener.Update();

            Configuration.MinMaxConfig staminaLimits = ConfigController.Config.Questing.SprintingLimitations.Stamina;
            if (canSprint && BotOwner.GetPlayer.Physical.CanSprint && (BotOwner.GetPlayer.Physical.Stamina.NormalValue > staminaLimits.Max))
            {
                BotOwner.GetPlayer.EnableSprint(true);
            }
            if (!canSprint || !BotOwner.GetPlayer.Physical.CanSprint || (BotOwner.GetPlayer.Physical.Stamina.NormalValue < staminaLimits.Min))
            {
                BotOwner.GetPlayer.EnableSprint(false);
            }
        }

        public void UpdateBotSteering()
        {
            BotOwner.Steering.LookToMovingDirection();
            baseSteeringLogic.Update(BotOwner);
        }

        public void UpdateBotSteering(Vector3 point)
        {
            BotOwner.Steering.LookToPoint(point);
            baseSteeringLogic.Update(BotOwner);
        }

        public bool IsAllowedToSprint()
        {
            if (!QuestingBotsPluginConfig.SprintingEnabled.Value)
            {
                return false;
            }

            if (!ObjectiveManager.CanSprintToObjective())
            {
                return false;
            }

            // Disable sprinting if the bot is very close to its current destination point to prevent it from sliding into staircase corners, etc.
            if (IsNearPathCorner(ConfigController.Config.Questing.SprintingLimitations.SharpPathCorners))
            {
                return false;
            }

            // Prevent bots from sliding into doors
            if (IsNearAndMovingTowardClosedDoor(ConfigController.Config.Questing.SprintingLimitations.ApproachingClosedDoors))
            {
                return false;
            }

            return true;
        }

        public bool IsNearPathCorner(Configuration.DistanceAngleConfig maxDistanceMinAngle)
        {
            if (BotOwner?.Mover?.CurPath == null)
            {
                return false;
            }

            if (Vector3.Distance(BotOwner.Position, BotOwner.Mover.RealDestPoint) > maxDistanceMinAngle.Distance)
            {
                return false;
            }

            int currentCornerIndex = (int)cornerIndexField.GetValue(BotOwner.Mover);
            if (currentCornerIndex == BotOwner.Mover.CurPath.Length - 1)
            {
                return true;
            }

            ObjectiveManager.LastCorner = BotOwner.Mover.CurPath[currentCornerIndex];

            Vector3 currentSegment = BotOwner.Mover.CurPath[currentCornerIndex] - BotOwner.Mover.CurPath[currentCornerIndex - 1];
            Vector3 nextSegment = BotOwner.Mover.CurPath[currentCornerIndex + 1] - BotOwner.Mover.CurPath[currentCornerIndex];
            float cornerAngle = Vector3.Angle(currentSegment, nextSegment);

            if (cornerAngle >= maxDistanceMinAngle.Angle)
            {
                //LoggingController.LogInfo("Angle of corner for " + BotOwner.GetText() + ": " + cornerAngle);
                return true;
            }

            return false;
        }

        public bool IsNearAndMovingTowardClosedDoor(Configuration.DistanceAngleConfig maxDistanceMaxAngle)
        {
            Vector3 botMovingDirection = BotOwner.GetPlayer.MovementContext.TransformForwardVector;
            foreach (Door door in FindNearbyDoors(maxDistanceMaxAngle.Distance))
            {
                if (door.DoorState == EDoorState.Open)
                { 
                    continue;
                }

                Vector3 doorDirection = door.transform.position - BotOwner.Position;
                float doorAngle = Vector3.Angle(botMovingDirection, doorDirection);
                if (doorAngle < maxDistanceMaxAngle.Angle)
                {
                    //LoggingController.LogInfo(BotOwner.GetText() + " is approaching a closed door");
                    return true;
                }

                //LoggingController.LogInfo(BotOwner.GetText() + " is heading at an angle of " + doorAngle + " to a closed door");
            }

            return false;
        }

        public IEnumerable<Door> FindNearbyDoors(float distance)
        {
            return BotOwner.CellData.CurrentDoorLinks()
                .Select(d => d.Door)
                .Where(d => Vector3.Distance(BotOwner.Position, d.transform.position) <= distance);
        }

        public bool TryLookToLastCorner()
        {
            if (ObjectiveManager.LastCorner.HasValue)
            {
                UpdateBotSteering(ObjectiveManager.LastCorner.Value + new Vector3(0, 1, 0));
                return true;
            }

            return false;
        }

        public Vector3? FindDangerPoint()
        {
            // Enumerate all alive bots on the map
            IEnumerable<Vector3> alivePlayerPositions = Singleton<IBotGame>.Instance.BotsController.Bots.BotOwners
                .Where(b => b.Id != BotOwner.Id)
                .Where(b => b.BotState == EBotState.Active)
                .Where(b => !b.IsDead)
                .Select(b => b.Position)
                .AddItem(Singleton<GameWorld>.Instance.MainPlayer.Position);

            int botCount = alivePlayerPositions.Count();
            if (botCount == 0)
            {
                return null;
            }

            // Combine the positions of all bots on the map into one average position
            Vector3 dangerPoint = Vector3.zero;
            foreach (Vector3 alivePlayerPosition in alivePlayerPositions)
            {
                dangerPoint += alivePlayerPosition;
            }
            dangerPoint /= botCount;

            return dangerPoint;
        }

        public Vector3? FindNearestDangerPoint()
        {
            // Enumerate all alive bots on the map
            IEnumerable<Vector3> alivePlayerPositions = Singleton<IBotGame>.Instance.BotsController.Bots.BotOwners
                .Where(b => b.Id != BotOwner.Id)
                .Where(b => b.BotState == EBotState.Active)
                .Where(b => !b.IsDead)
                .Select(b => b.Position)
                .AddItem(Singleton<GameWorld>.Instance.MainPlayer.Position);

            int botCount = alivePlayerPositions.Count();
            if (botCount == 0)
            {
                return null;
            }

            return alivePlayerPositions.First();
        }

        protected bool canUpdate()
        {
            if (updateTimer.ElapsedMilliseconds < updateInterval)
            {
                return false;
            }

            updateTimer.Restart();
            return true;
        }
    }
}
