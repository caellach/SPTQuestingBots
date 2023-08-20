import modConfig from "../config/config.json";
import { CommonUtils } from "./CommonUtils";

import { DependencyContainer } from "tsyringe";
import type { IPreAkiLoadMod } from "@spt-aki/models/external/IPreAkiLoadMod";
import type { IPostDBLoadMod } from "@spt-aki/models/external/IPostDBLoadMod";
import type { IPostAkiLoadMod } from "@spt-aki/models/external/IPostAkiLoadMod";
import type { StaticRouterModService } from "@spt-aki/services/mod/staticRouter/StaticRouterModService";
import type { DynamicRouterModService } from "@spt-aki/services/mod/dynamicRouter/DynamicRouterModService";

import { MinMax } from "@spt-aki/models/common/MinMax";
import { ConfigServer } from "@spt-aki/servers/ConfigServer";
import { ConfigTypes } from "@spt-aki/models/enums/ConfigTypes";
import { ILogger } from "@spt-aki/models/spt/utils/ILogger";
import { DatabaseServer } from "@spt-aki/servers/DatabaseServer";
import { IDatabaseTables } from "@spt-aki/models/spt/server/IDatabaseTables";
import { LocaleService } from "@spt-aki/services/LocaleService";
import { QuestHelper } from "@spt-aki/helpers/QuestHelper";
import { ProfileHelper } from "@spt-aki/helpers/ProfileHelper";
import { IBotConfig } from "@spt-aki/models/spt/config/IBotConfig";
import { ILocationConfig } from "@spt-aki/models/spt/config/ILocationConfig";

const modName = "SPTQuestingBots";

class QuestingBots implements IPreAkiLoadMod, IPostAkiLoadMod, IPostDBLoadMod
{
    private commonUtils: CommonUtils

    private logger: ILogger;
    private configServer: ConfigServer;
    private databaseServer: DatabaseServer;
    private databaseTables: IDatabaseTables;
    private localeService: LocaleService;
    private questHelper: QuestHelper;
    private profileHelper: ProfileHelper;
    private iBotConfig: IBotConfig;
    private iLocationConfig: ILocationConfig;

    private convertIntoPmcChanceOrig: Record<string, MinMax> = {};
	
    public preAkiLoad(container: DependencyContainer): void 
    {
        this.logger = container.resolve<ILogger>("WinstonLogger");
        const staticRouterModService = container.resolve<StaticRouterModService>("StaticRouterModService");
        const dynamicRouterModService = container.resolve<DynamicRouterModService>("DynamicRouterModService");
		
        // Get config.json settings for the bepinex plugin
        staticRouterModService.registerStaticRouter(`StaticGetConfig${modName}`,
            [{
                url: "/QuestingBots/GetConfig",
                action: () => 
                {
                    return JSON.stringify(modConfig);
                }
            }], "GetConfig"
        ); 
        
        // Report error messages to the SPT-AKI server console in case the user hasn't enabled the bepinex console
        dynamicRouterModService.registerDynamicRouter(`DynamicReportError${modName}`,
            [{
                url: "/QuestingBots/ReportError/",
                action: (url: string) => 
                {
                    const urlParts = url.split("/");
                    const errorMessage = urlParts[urlParts.length - 1];

                    const regex = /%20/g;
                    this.commonUtils.logError(errorMessage.replace(regex, " "));

                    return JSON.stringify({ resp: "OK" });
                }
            }], "ReportError"
        );

        if (!modConfig.enabled)
        {
            return;
        }

        // Game start
        // Needed to update Scav timer
        staticRouterModService.registerStaticRouter(`StaticAkiGameStart${modName}`,
            [{
                url: "/client/game/start",
                action: (url: string, info: any, sessionId: string, output: string) => 
                {
                    if (modConfig.debug.enabled)
                    {
                        this.updateScavTimer(sessionId);
                    }

                    return output;
                }
            }], "aki"
        );

        // Apply a scalar factor to the SPT-AKI PMC conversion chances
        dynamicRouterModService.registerDynamicRouter(`DynamicAdjustPMCConversionChances${modName}`,
            [{
                url: "/QuestingBots/AdjustPMCConversionChances/",
                action: (url: string) => 
                {
                    const urlParts = url.split("/");
                    const factor = Number(urlParts[urlParts.length - 1]);

                    this.adjustPmcConversionChance(factor);
                    return JSON.stringify({ resp: "OK" });
                }
            }], "AdjustPMCConversionChances"
        );
        
        // Get all quest templates
        staticRouterModService.registerStaticRouter(`GetAllQuestTemplates${modName}`,
            [{
                url: "/QuestingBots/GetAllQuestTemplates",
                action: () => 
                {
                    return JSON.stringify({ quests: this.questHelper.getQuestsFromDb() });
                }
            }], "GetAllQuestTemplates"
        );
    }
	
    public postDBLoad(container: DependencyContainer): void
    {
        this.configServer = container.resolve<ConfigServer>("ConfigServer");
        this.databaseServer = container.resolve<DatabaseServer>("DatabaseServer");
        this.localeService = container.resolve<LocaleService>("LocaleService");
        this.questHelper = container.resolve<QuestHelper>("QuestHelper");
        this.profileHelper = container.resolve<ProfileHelper>("ProfileHelper");

        this.iBotConfig = this.configServer.getConfig(ConfigTypes.BOT);
        this.iLocationConfig = this.configServer.getConfig(ConfigTypes.LOCATION);

        this.databaseTables = this.databaseServer.getTables();
        this.commonUtils = new CommonUtils(this.logger, this.databaseTables, this.localeService);

        // Adjust parameters to make debugging easier
        if (modConfig.debug.enabled)
        {
            this.commonUtils.logInfo("Applying debug options...");

            if (modConfig.debug.scav_cooldown_time < this.databaseTables.globals.config.SavagePlayCooldown)
            {
                this.databaseTables.globals.config.SavagePlayCooldown = modConfig.debug.scav_cooldown_time;
            }
        }
    }
	
    public postAkiLoad(): void
    {
        this.setOriginalPMCConversionChances();
        this.disableCustomBossWaves();
        this.increaseBotCaps();
        this.iLocationConfig.rogueLighthouseSpawnTimeSettings.waitTimeSeconds = -1;
    }

    private updateScavTimer(sessionId: string): void
    {
        const pmcData = this.profileHelper.getPmcProfile(sessionId);
        const scavData = this.profileHelper.getScavProfile(sessionId);
		
        if ((scavData.Info === null) || (scavData.Info === undefined))
        {
            this.commonUtils.logInfo("Scav profile hasn't been created yet.");
            return;
        }
		
        // In case somebody disables scav runs and later wants to enable them, we need to reset their Scav timer unless it's plausible
        const worstCooldownFactor = this.getWorstSavageCooldownModifier();
        if (scavData.Info.SavageLockTime - pmcData.Info.LastTimePlayedAsSavage > this.databaseTables.globals.config.SavagePlayCooldown * worstCooldownFactor * 1.1)
        {
            this.commonUtils.logInfo(`Resetting scav timer for sessionId=${sessionId}...`);
            scavData.Info.SavageLockTime = 0;
        }
    }
	
    // Return the highest Scav cooldown factor from Fence's rep levels
    private getWorstSavageCooldownModifier(): number
    {
        // Initialize the return value at something very low
        let worstCooldownFactor = 0.01;

        for (const level in this.databaseTables.globals.config.FenceSettings.Levels)
        {
            if (this.databaseTables.globals.config.FenceSettings.Levels[level].SavageCooldownModifier > worstCooldownFactor)
                worstCooldownFactor = this.databaseTables.globals.config.FenceSettings.Levels[level].SavageCooldownModifier;
        }
        return worstCooldownFactor;
    }

    private setOriginalPMCConversionChances(): void
    {
        // Store the default PMC-conversion chances for each bot type defined in SPT's configuration file
        let logMessage = "";
        for (const pmcType in this.iBotConfig.pmc.convertIntoPmcChance)
        {
            if (this.convertIntoPmcChanceOrig[pmcType] !== undefined)
            {
                logMessage += `${pmcType}: already buffered, `;
                continue;
            }

            const chances: MinMax = {
                min: this.iBotConfig.pmc.convertIntoPmcChance[pmcType].min,
                max: this.iBotConfig.pmc.convertIntoPmcChance[pmcType].max
            }
            this.convertIntoPmcChanceOrig[pmcType] = chances;

            logMessage += `${pmcType}: ${chances.min}-${chances.max}%, `;
        }

        this.commonUtils.logInfo(`Reading default PMC spawn chances: ${logMessage}`);
    }

    private adjustPmcConversionChance(scalingFactor: number): void
    {
        // Adjust the chances for each applicable bot type
        let logMessage = "";
        for (const pmcType in this.iBotConfig.pmc.convertIntoPmcChance)
        {
            // For now, we only want to convert assault bots due to the way the client mod forces spawns
            if ((scalingFactor > 5) && (pmcType != "assault"))
            {
                continue;
            }

            // Do not allow the chances to exceed 100%. Who knows what might happen...
            const min = Math.round(Math.min(100, this.convertIntoPmcChanceOrig[pmcType].min * scalingFactor));
            const max = Math.round(Math.min(100, this.convertIntoPmcChanceOrig[pmcType].max * scalingFactor));

            this.iBotConfig.pmc.convertIntoPmcChance[pmcType].min = min;
            this.iBotConfig.pmc.convertIntoPmcChance[pmcType].max = max;

            logMessage += `${pmcType}: ${min}-${max}%, `;
        }

        this.commonUtils.logInfo(`Adjusting PMC spawn chances (${scalingFactor}): ${logMessage}`);
    }

    private disableCustomBossWaves(): void
    {
        if (modConfig.initial_PMC_spawns.enabled)
        {
            this.commonUtils.logInfo("Disabling custom boss waves");
            this.iLocationConfig.customWaves.boss = {};
        }
    }

    private increaseBotCaps(): void
    {
        if (!modConfig.initial_PMC_spawns.add_max_players_to_bot_cap)
        {
            return;
        }

        const maxAddtlBots = modConfig.initial_PMC_spawns.max_additional_bots;
        const maxTotalBots = modConfig.initial_PMC_spawns.max_total_bots;

        this.iBotConfig.maxBotCap["factory4_day"] = Math.min(this.iBotConfig.maxBotCap["factory4_day"] + Math.min(this.databaseTables.locations.factory4_day.base.MaxPlayers, maxAddtlBots), maxTotalBots);
        this.iBotConfig.maxBotCap["factory4_night"] = Math.min(this.iBotConfig.maxBotCap["factory4_night"] + Math.min(this.databaseTables.locations.factory4_night.base.MaxPlayers, maxAddtlBots), maxTotalBots);
        this.iBotConfig.maxBotCap["bigmap"] = Math.min(this.iBotConfig.maxBotCap["bigmap"] + Math.min(this.databaseTables.locations.bigmap.base.MaxPlayers, maxAddtlBots), maxTotalBots);
        this.iBotConfig.maxBotCap["woods"] = Math.min(this.iBotConfig.maxBotCap["woods"] + Math.min(this.databaseTables.locations.woods.base.MaxPlayers, maxAddtlBots), maxTotalBots);
        this.iBotConfig.maxBotCap["shoreline"] = Math.min(this.iBotConfig.maxBotCap["shoreline"] + Math.min(this.databaseTables.locations.shoreline.base.MaxPlayers, maxAddtlBots), maxTotalBots);
        this.iBotConfig.maxBotCap["lighthouse"] = Math.min(this.iBotConfig.maxBotCap["lighthouse"] + Math.min(this.databaseTables.locations.lighthouse.base.MaxPlayers, maxAddtlBots), maxTotalBots);
        this.iBotConfig.maxBotCap["rezervbase"] = Math.min(this.iBotConfig.maxBotCap["rezervbase"] + Math.min(this.databaseTables.locations.rezervbase.base.MaxPlayers, maxAddtlBots), maxTotalBots);
        this.iBotConfig.maxBotCap["interchange"] = Math.min(this.iBotConfig.maxBotCap["interchange"] + Math.min(this.databaseTables.locations.interchange.base.MaxPlayers, maxAddtlBots), maxTotalBots);
        this.iBotConfig.maxBotCap["laboratory"] = Math.min(this.iBotConfig.maxBotCap["laboratory"] + Math.min(this.databaseTables.locations.laboratory.base.MaxPlayers, maxAddtlBots), maxTotalBots);
        this.iBotConfig.maxBotCap["tarkovstreets"] = Math.min(this.iBotConfig.maxBotCap["tarkovstreets"] + Math.min(this.databaseTables.locations.tarkovstreets.base.MaxPlayers, maxAddtlBots), maxTotalBots);
        this.iBotConfig.maxBotCap["default"] = Math.min(this.iBotConfig.maxBotCap["default"] + maxAddtlBots, maxTotalBots);

        for (const location in this.iBotConfig.maxBotCap)
        {
            this.commonUtils.logInfo(`Changed bot cap for ${location} to: ${this.iBotConfig.maxBotCap[location]}`);
        }
    }
}

module.exports = { mod: new QuestingBots() }