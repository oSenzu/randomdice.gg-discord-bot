import {
    CommandInteraction,
    Message,
    MessageEmbed,
    ReplyMessageOptions,
} from 'discord.js';

import cache, { Dice } from 'util/cache';
import parsedText from 'util/parseText';
import cooldown from 'util/cooldown';
import { reply } from 'util/typesafeReply';
import bestMatchFollowUp from 'util/bestMatchFollowUp';

export default async function dice(
    input: Message | CommandInteraction
): Promise<void> {
    if (
        await cooldown(input, '.gg dice', {
            default: 10 * 1000,
            donator: 2 * 1000,
        })
    ) {
        return;
    }

    const command =
        input instanceof Message
            ? input.content.replace(/^\.gg dice ?/i, '')
            : input.options.getString('die') ?? '';

    const diceList = cache.dice;
    const die = diceList.find(
        d =>
            command.toLowerCase().replace(/-.*/, '').trim() ===
            d.name.toLowerCase()
    );
    const getDiceInfo = (target?: Dice): string | ReplyMessageOptions => {
        let minClass: number;
        if (!target) return 'No dice found.';
        switch (target.rarity) {
            case 'Legendary':
                minClass = 7;
                break;
            case 'Unique':
                minClass = 5;
                break;
            case 'Rare':
                minClass = 3;
                break;
            default:
                minClass = 1;
        }

        const firstArgs = command.indexOf('-');
        if (firstArgs > -1) {
            const otherArgs = [
                ...command
                    .slice(firstArgs, command.length)
                    .replace(/(?:-l|--level|-c|--class)[=| +]\w+/gi, '')
                    .matchAll(/--?\w+(?:[=| +]\w+)?/gi),
            ];
            if (otherArgs.length) {
                return `Unknown arguments: ${otherArgs.map(
                    ([arg]) => `\`${arg}\``
                )}. Acceptable arguments are \`--class\` \`--level\` or alias \`-c\` \`-l\``;
            }
        }

        const dieClassArgs = [
            ...command
                .slice(firstArgs, command.length)
                .matchAll(/(?:-c|--class)[=| +](\w+)/gi),
        ];
        const dieLevelArgs = [
            ...command
                .slice(firstArgs, command.length)
                .matchAll(/(?:-l|--level)[=| +](\w+)/gi),
        ];
        if (dieClassArgs.length > 1 || dieLevelArgs.length > 1) {
            if (dieClassArgs.length > 1) {
                return `Duplicated arguments for dice class: ${dieClassArgs
                    .map(arg => `\`${arg?.[0]}\``)
                    .join(' ')}`;
            }

            if (dieLevelArgs.length > 1) {
                return `Duplicated arguments for dice level: ${dieLevelArgs
                    .map(arg => `\`${arg?.[0]}\``)
                    .join(' ')}`;
            }
        }
        const dieClassArg =
            input instanceof CommandInteraction
                ? input.options.getNumber('class')
                : dieClassArgs[0]?.[1];
        const dieLevelArg =
            input instanceof CommandInteraction
                ? input.options.getNumber('level')
                : dieLevelArgs[0]?.[1];
        const dieClass = Number(dieClassArg || minClass);
        const dieLevel = Number(dieLevelArg || 1);

        if (
            Number.isNaN(dieClass) ||
            Number.isNaN(dieLevel) ||
            dieClass < minClass ||
            dieClass > 15 ||
            dieLevel < 1 ||
            dieLevel > 5
        ) {
            if (Number.isNaN(dieClass)) {
                return `Invalid arguments for dice class, \`${dieClassArg}\` is not a number.`;
            }
            if (dieClass < minClass) {
                return `Invalid arguments for dice class, ${target.name} dice is in **${target.rarity} tier**, its minimum class is **${minClass}**.`;
            }
            if (dieClass > 15) {
                return `Invalid arguments for dice class, the maximum dice class is **15**.`;
            }
            if (Number.isNaN(dieLevel)) {
                return `Invalid arguments for dice level, \`${dieLevelArg}\` is not a number.`;
            }
            if (dieLevel < 1 || dieLevel > 5) {
                return `Invalid arguments for dice level, dice level should be between **1 - 5**.`;
            }
        }
        const atk =
            Math.round(
                (target.atk +
                    target.cupAtk * (dieClass - minClass) +
                    target.pupAtk * (dieLevel - 1)) *
                    100
            ) / 100;
        const spd =
            Math.round(
                (target.spd +
                    target.cupSpd * (dieClass - minClass) +
                    target.pupSpd * (dieLevel - 1)) *
                    100
            ) / 100;
        const eff1 =
            Math.round(
                (target.eff1 +
                    target.cupEff1 * (dieClass - minClass) +
                    target.pupEff1 * (dieLevel - 1)) *
                    100
            ) / 100;
        const eff2 =
            Math.round(
                (target.eff2 +
                    target.cupEff2 * (dieClass - minClass) +
                    target.pupEff2 * (dieLevel - 1)) *
                    100
            ) / 100;

        return {
            embeds: [
                new MessageEmbed()
                    .setTitle(`${target.name} Dice`)
                    .setDescription(parsedText(target.detail))
                    .setThumbnail(target.img)
                    .setAuthor(
                        'Random Dice Community Website',
                        'https://randomdice.gg/android-chrome-512x512.png',
                        'https://randomdice.gg/'
                    )
                    .setColor('#6ba4a5')
                    .setURL(`https://randomdice.gg/wiki/dice_mechanics`)
                    .addFields([
                        {
                            name: 'Attack Damage',
                            value: String(atk) || '-',
                            inline: true,
                        },
                        {
                            name: 'Type',
                            value: target.type,
                            inline: true,
                        },
                        {
                            name: 'Attack Speed',
                            value: spd ? `${spd}s` : '-',
                            inline: true,
                        },
                        {
                            name: 'Target',
                            value: target.target,
                            inline: true,
                        },
                        ...(!target.nameEff1 || target.nameEff1 === '-'
                            ? []
                            : [
                                  {
                                      name: target.nameEff1,
                                      value: eff1 + target.unitEff1,
                                      inline: true,
                                  },
                              ]),
                        ...(!target.nameEff2 || target.nameEff2 === '-'
                            ? []
                            : [
                                  {
                                      name: target.nameEff2,
                                      value: eff2 + target.unitEff2,
                                      inline: true,
                                  },
                              ]),
                    ])
                    .setFooter(
                        'randomdice.gg Dice Information',
                        'https://randomdice.gg/android-chrome-512x512.png'
                    ),
            ],
        };
    };

    if (die) {
        await reply(input, getDiceInfo(die));
        return;
    }

    const firstOptionalArgs = command.indexOf('-');
    const wrongDiceName =
        firstOptionalArgs > -1
            ? command.slice(0, firstOptionalArgs).trim()
            : command;

    await bestMatchFollowUp(
        input,
        wrongDiceName,
        diceList.map(d => d.name),
        ' is not a valid dice.',
        newDie => getDiceInfo(diceList.find(d => d.name === newDie))
    );
}
