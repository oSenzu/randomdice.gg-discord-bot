import { Client } from 'discord.js';
import { fixClownNicknamesOnReboot } from 'community discord/currency/fun commands/clown';
import { fetchGeneralOnBoot } from 'community discord/chatrevivePing';
import { pickCoinsInit } from 'community discord/currency/coinbomb';
import { weeklyAutoReset } from 'community discord/currency/leaderboard';
import { setRaffleTimerOnBoot } from 'community discord/currency/raffle';
import infoVC from 'community discord/infoVC';
import { registerTimer } from 'community discord/timer';
import logMessage from 'util/logMessage';
import { fetchDatabase } from 'util/cache';
import updateListener from 'util/updateListener';
import purgeRolesOnReboot from 'util/purgeRolesOnReboot';
import registerSlashCommands from 'register/commandData';

export default async function ready(client: Client<true>): Promise<void> {
    client.user.setActivity('/help', {
        type: 'PLAYING',
    });
    const bootMessage = `Timestamp: ${new Date().toTimeString()}, bot is booted on ${
        process.env.NODE_ENV
    }`;
    try {
        updateListener(client);
        await logMessage(client, 'info', bootMessage);
        // eslint-disable-next-line no-console
        console.log(bootMessage);
        await Promise.all([
            purgeRolesOnReboot(client, '🤡'),
            purgeRolesOnReboot(client, 'rick'),
            fixClownNicknamesOnReboot(client),
            fetchGeneralOnBoot(client),
            fetchDatabase(),
        ]);
        // call these after database ready
        await Promise.all([
            registerSlashCommands(client),
            setRaffleTimerOnBoot(client),
            pickCoinsInit(client),
            weeklyAutoReset(client),
            registerTimer(client),
            infoVC(client),
        ]);
    } catch (err) {
        await logMessage(
            client,
            'warning',
            `Oops, something went wrong in client#Ready : ${
                (err as Error).stack ?? (err as Error).message ?? err
            }`
        );
    }
}
