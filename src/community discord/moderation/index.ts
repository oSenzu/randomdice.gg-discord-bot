import checkPermission from 'community discord/util/checkPermissions';
import { moderatorRoleIds } from 'config/roleId';
import {
    ApplicationCommandData,
    ApplicationCommandOptionData,
    CommandInteraction,
} from 'discord.js';
import { ModLog } from 'util/cache';
import { parseStringIntoMs } from 'util/parseMS';
import { sendBanMessage } from './banMessage';
import { broadcastHackBan } from './hack ban log sharing/broadcast';
import { writeModLog } from './modlog';
import Reasons from './reasons.json';
import {
    actionNameToPastParticiple,
    checkModActionValidity,
    dmOffender,
    startHackWarnTimer,
} from './util';

export default async function moderation(
    interaction: CommandInteraction<'cached'>
): Promise<void> {
    if (!(await checkPermission(interaction, ...moderatorRoleIds))) return;
    const { member: moderator, options, channel, guild } = interaction;
    const { members } = guild;
    const action = interaction.commandName as ModLog['action'];
    let reason = options.getString('reason');
    reason = (reason && Reasons[reason as keyof typeof Reasons]) || reason;
    const offender = options.getUser('member', true);
    const offenderMember = members.cache.get(offender.id);
    const durationArg = options.getString('duration');
    const deleteMessageDay = options.getInteger('delete-message-days');
    const actioned = actionNameToPastParticiple(action);

    if (
        !(await checkModActionValidity(
            interaction,
            offender.id,
            action,
            durationArg
        ))
    )
        return;

    const auditLogReason = `${actioned} by ${moderator.user.tag}${
        reason ? ` Reason: ${reason}` : ''
    }`;

    const duration =
        action === 'mute'
            ? (durationArg && parseStringIntoMs(durationArg)) ||
              1000 * 60 * 60 * 24 * 7
            : null;

    await dmOffender(offender, moderator, action, reason, duration);
    await writeModLog(offender, reason, moderator.user, action, duration);

    switch (action) {
        case 'kick':
            await members.kick(offender, auditLogReason);
            break;
        case 'ban':
            await members.ban(offender, {
                days:
                    deleteMessageDay || reason === Reasons['Scam Links']
                        ? 7
                        : 0,
                reason: auditLogReason,
            });
            await sendBanMessage(guild, offender, reason, moderator.user);
            break;
        case 'unban':
            await members.unban(offender, auditLogReason);
            break;
        case 'mute':
            await offenderMember?.timeout(duration, auditLogReason);
            break;
        case 'unmute':
            await offenderMember?.timeout(null, auditLogReason);
            break;
        default:
    }
    await interaction.reply(
        `${offender} has been ${actioned} ${(reason && `for ${reason}`) || ''}.`
    );
    if (action === 'warn' && reason === Reasons['Warn to Leave Hack Servers']) {
        await startHackWarnTimer(moderator, offenderMember, channel);
    }
    if (action === 'ban' && reason === Reasons['Member in Hack Servers']) {
        await broadcastHackBan(guild, offender, moderator.user, reason);
    }
}

const getCommonOptions = (
    commandName: string,
    reasonIsAutoComplete = false
): ApplicationCommandOptionData[] => [
    {
        name: 'member',
        description: `The member to be ${actionNameToPastParticiple(
            commandName
        )}.`,
        type: 'USER',
        required: true,
    },
    {
        name: 'reason',
        description: `The reason to ${commandName} the member.`,
        type: 'STRING',
        required: false,
        autocomplete: reasonIsAutoComplete,
    },
];

export const commandData: ApplicationCommandData[] = [
    {
        name: 'warn',
        defaultPermission: false,
        description: 'Warn a member.',
        options: getCommonOptions('warn', true),
    },
    {
        name: 'kick',
        defaultPermission: false,
        description: 'Kick a member.',
        options: getCommonOptions('kick', true),
    },
    {
        name: 'ban',
        defaultPermission: false,
        description: 'Ban a member.',
        options: [
            ...getCommonOptions('ban', true),
            {
                name: 'delete-message-days',
                description:
                    "The number of days to delete the member's messages.",
                type: 'INTEGER',
                minValue: 0,
            },
        ],
    },
    {
        name: 'unban',
        defaultPermission: false,
        description: 'Unban a member.',
        options: getCommonOptions('unban'),
    },
    {
        name: 'mute',
        defaultPermission: false,
        description: 'Mute a member.',
        options: [
            ...getCommonOptions('mute', true),
            {
                name: 'duration',
                description:
                    'The duration of the mute. Default to 1 week (longest possible timeout). Use a valid duration string.',
                type: 'STRING',
            },
        ],
    },
    {
        name: 'unmute',
        defaultPermission: false,
        description: 'Unmute a member.',
        options: getCommonOptions('unmute'),
    },
];

export { hackDiscussionLogging, hackLogBanHandler } from './logHackWordTrigger';
