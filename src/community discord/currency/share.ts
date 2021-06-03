import firebase from 'firebase-admin';
import Discord from 'discord.js';
import getBalance from './balance';
import cooldown from '../../util/cooldown';
import cache from '../../util/cache';
import fetchMention from '../../util/fetchMention';

export default async function share(message: Discord.Message): Promise<void> {
    const app = firebase.app();
    const database = app.database();
    const numberFormat = new Intl.NumberFormat();
    if (
        await cooldown(message, `!share`, {
            default: 10 * 1000,
            donator: 2 * 1000,
        })
    )
        return;

    const { channel, content, guild, member } = message;
    const [, amountArg, memberArg] = content.split(' ');
    if (!guild || !member) return;

    const yourBalance = await getBalance(message, 'emit new member');
    if (yourBalance === false) return;

    const target = await fetchMention(memberArg, guild, {
        content,
        mentionIndex: 2,
    });

    const amount = Number(amountArg);
    if (Number.isNaN(amount) || !target) {
        await channel.send(
            'Usage of the command `!share <amount> <member>`, example```!share +5000 @JackyKit#0333```'
        );
        return;
    }
    if (target.id === member.id) {
        await channel.send(
            'You cannot share <:dicecoin:839981846419079178> to yourself.'
        );
        return;
    }
    if (!Number.isInteger(amount) || amount <= 0) {
        await channel.send('The amount shared should be a positive integer.');
        return;
    }
    if (amount > yourBalance) {
        await channel.send(
            `You only have <:dicecoin:839981846419079178> ${yourBalance}, you can't share that many.`
        );
        return;
    }

    let theirBalance = await getBalance(message, 'silence', target);
    if (!Object.keys(cache['discord_bot/community/currency']).length) return;
    if (theirBalance === false) theirBalance = 10000;

    await database
        .ref(`discord_bot/community/currency/${target.id}/balance`)
        .set(theirBalance + amount);
    await database
        .ref(`discord_bot/community/currency/${member.id}/balance`)
        .set(yourBalance - amount);
    await channel.send(
        `You have shared <:dicecoin:839981846419079178> ${numberFormat.format(
            amount
        )} to ${
            target.user.username
        }, they now have <:dicecoin:839981846419079178> ${numberFormat.format(
            theirBalance + amount
        )} and you have <:dicecoin:839981846419079178> ${numberFormat.format(
            yourBalance - amount
        )}!`
    );
}
