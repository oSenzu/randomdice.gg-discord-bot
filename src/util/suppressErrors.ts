import { Constants, DiscordAPIError } from 'discord.js';

export const suppressCannotDmUser = (error: DiscordAPIError): null => {
    if (error.code !== Constants.APIErrors.CANNOT_MESSAGE_USER) throw error;
    return null;
};

export const suppressUnknownBan = (error: DiscordAPIError): null => {
    if (error.code !== Constants.APIErrors.UNKNOWN_BAN) throw error;
    return null;
};

export const suppressUnknownUser = (error: DiscordAPIError): null => {
    if (error.code !== Constants.APIErrors.UNKNOWN_USER) throw error;
    return null;
};
