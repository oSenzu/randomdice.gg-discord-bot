import * as Discord from 'discord.js';
import cooldown from '../helper/cooldown';

export default async function LFG(message: Discord.Message): Promise<void> {
    const { member, channel, content, deletable, reply } = message;

    const msg = content.replace(/!lfg ?/i, '');

    if (!member) {
        return;
    }

    if (
        await cooldown(message, '!lfg', {
            default: 600 * 1000,
            donator: 600 * 1000,
        })
    ) {
        return;
    }

    if (
        !(
            member.roles.cache.has('804513079319592980') ||
            member.roles.cache.has('804496339794264085') ||
            member.roles.cache.has('805817742081916988') ||
            member.roles.cache.has('806896328255733780') ||
            member.roles.cache.has('805388604791586826') ||
            member.hasPermission('MENTION_EVERYONE')
        )
    ) {
        await channel.send(
            new Discord.MessageEmbed()
                .setTitle('Unable to cast command')
                .setDescription(
                    'You need one of the following roles to use this command.\n' +
                        '<@&804513079319592980> <@&804496339794264085> <@&805817742081916988> <@&806896328255733780> <@&805388604791586826>'
                )
        );
        return;
    }

    let embed = new Discord.MessageEmbed()
        .setAuthor(
            `${member.user.username}#${member.user.discriminator}`,
            member.user.displayAvatarURL({
                dynamic: true,
            })
        )
        .setColor(member.displayHexColor)
        .addField('Ping / DM', member);

    let rawMessage: string;

    switch (channel.id) {
        case '804224162364129320': // #lfg
            embed = embed.setTitle(
                `${member.displayName} is looking for a Random Dice partner!`
            );
            rawMessage = '<@&805757095232274442>';
            break;
        case '806589220000890930': // # bloons-td-6
            embed = embed.setTitle(
                `${member.displayName} is organizing a Bloons TD 6 game!`
            );
            rawMessage = '@here';
            break;
        case '806589343354847302': // #among-us-lfg
            embed = embed.setTitle(
                `${member.displayName} is organizing an Among Us game!`
            );
            rawMessage = '@here';
            break;
        case '806589489068638239': // #catag-lfg
            embed = embed.setTitle(
                `${member.displayName} is organizing a Catan game!`
            );
            rawMessage = '@here';
            break;
        case '810879645196222495': // #skribbl-io-lfg
            embed = embed.setTitle(
                `${member.displayName} is organizing a Skribbl.io game!`
            );
            rawMessage = '@here';
            break;
        default:
            await channel.send(
                'You can only use this command in dedicated lfg channels.'
            );
            return;
    }

    if (msg.length > 1024) {
        await reply('Your message cannot be longer than 1024 characters.');
        return;
    }
    if (msg) {
        embed = embed.addField('Message', msg);
    }

    if (deletable) await message.delete();
    await channel.send(rawMessage, embed);
}
