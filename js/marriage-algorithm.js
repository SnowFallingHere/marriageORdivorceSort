class MarriageOrDivorceSort {
    constructor() {
        this.roundNumber = 0;
        this.eliminated = [];
        this.married = [];
        this.pool = [];
        this.events = [];
        this.sortSucceeded = false;
        this.people = [];
        this.quarrelQuota = 0;
    }

    generateData(count, minVal = CONSTANTS.MIN_VALUE, maxVal = CONSTANTS.MAX_VALUE) {
        const rangeSize = maxVal - minVal + 1;
        if (count > rangeSize) {
            console.error(`无法生成 ${count} 个不重复的值在范围 [${minVal}, ${maxVal}] 内`);
            return [];
        }

        const allValues = [];
        for (let v = minVal; v <= maxVal; v++) {
            allValues.push(v);
        }

        for (let i = allValues.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [allValues[i], allValues[j]] = [allValues[j], allValues[i]];
        }

        this.people = allValues.slice(0, count).map(value => new Person(value));
        return this.people;
    }

    step() {
        if (this.sortSucceeded) {
            return { sortSucceeded: true };
        }

        this.roundNumber++;
        this._processRound();
        this._checkSorting();

        const result = {
            round: this.roundNumber,
            eliminated: this.eliminated.map(p => ({ id: p.id, value: p.value })),
            married: this.married.map(pair => {
                const s1 = pair[0].status;
                const s2 = pair[1].status;
                return [
                    {
                        id: pair[0].id,
                        value: pair[0].value,
                        status: typeof s1 === 'object' ? s1.value : s1,
                        divorceTrend: pair[0].divorceTrend,
                        cheatingStartRound: pair[0].cheatingStartRound,
                        currentRound: this.roundNumber,
                        totalMarriedRounds: pair[0].totalMarriedRounds,
                        totalQuarrelRounds: pair[0].totalQuarrelRounds,
                        cheatingCount: pair[0].cheatingCount
                    },
                    {
                        id: pair[1].id,
                        value: pair[1].value,
                        status: typeof s2 === 'object' ? s2.value : s2,
                        divorceTrend: pair[1].divorceTrend,
                        cheatingStartRound: pair[1].cheatingStartRound,
                        currentRound: this.roundNumber,
                        totalMarriedRounds: pair[1].totalMarriedRounds,
                        totalQuarrelRounds: pair[1].totalQuarrelRounds,
                        cheatingCount: pair[1].cheatingCount
                    }
                ];
            }),
            pool: this.pool.map(p => {
                const s = p.status;
                return {
                    id: p.id,
                    value: p.value,
                    status: typeof s === 'object' ? s.value : s,
                    divorceTrend: p.divorceTrend,
                    totalMarriedRounds: p.totalMarriedRounds,
                    totalQuarrelRounds: p.totalQuarrelRounds,
                    cheatingCount: p.cheatingCount
                };
            }),
            sortSucceeded: this.sortSucceeded,
            newEvents: this.events.slice(-5),
            allEvents: [...this.events]
        };

        this._checkDataIntegrity();
        return result;
    }

    _checkDataIntegrity() {
        const idCounts = {};
        const idLocations = {};
        this.married.forEach((pair, i) => {
            idCounts[pair[0].id] = (idCounts[pair[0].id] || 0) + 1;
            idCounts[pair[1].id] = (idCounts[pair[1].id] || 0) + 1;
            idLocations[pair[0].id] = `married[${i}][0]`;
            idLocations[pair[1].id] = `married[${i}][1]`;
        });
        this.pool.forEach((p, i) => {
            idCounts[p.id] = (idCounts[p.id] || 0) + 1;
            idLocations[p.id] = (idLocations[p.id] ? idLocations[p.id] + ',' : '') + `pool[${i}]`;
        });
        this.eliminated.forEach((p, i) => {
            idCounts[p.id] = (idCounts[p.id] || 0) + 1;
            idLocations[p.id] = (idLocations[p.id] ? idLocations[p.id] + ',' : '') + `eliminated[${i}]`;
        });

        const duplicates = Object.entries(idCounts).filter(([id, count]) => count > 1);
        if (duplicates.length > 0) {
            console.warn(`发现 ${duplicates.length} 个重复，自动修复中...`);
            duplicates.forEach(([id, count]) => {
                const person = this.people.find(p => p.id == id);
                const locations = idLocations[id].split(',');
                const inMarried = locations.some(loc => loc.includes('married'));

                if (inMarried) {
                    this.pool = this.pool.filter(p => p.id != id);
                    console.warn(`  修复: ${person?.value} 保留在 married，从 pool 移除`);
                } else {
                    const firstLoc = locations[0];
                    if (firstLoc.includes('pool')) {
                        let foundFirst = false;
                        this.pool = this.pool.filter(p => {
                            if (p.id == id) {
                                if (foundFirst) return false;
                                foundFirst = true;
                            }
                            return true;
                        });
                    }
                }
            });
        }

        const newMarriedCount = this.married.length * 2;
        const newPoolCount = this.pool.length;
        const newEliminatedCount = this.eliminated.length;
        const newTotal = newMarriedCount + newPoolCount + newEliminatedCount;

        if (newTotal !== this.people.length) {
            console.error(`数据异常！总人数: ${newTotal}, 期望: ${this.people.length}`);
            console.error(`  Married: ${newMarriedCount}, Pool: ${newPoolCount}, Eliminated: ${newEliminatedCount}`);

            const allIds = new Set();
            this.married.forEach(pair => {
                allIds.add(pair[0].id);
                allIds.add(pair[1].id);
            });
            this.pool.forEach(p => allIds.add(p.id));
            this.eliminated.forEach(p => allIds.add(p.id));

            const lost = this.people.filter(p => !allIds.has(p.id));
            console.error('丢失的人员:', JSON.stringify(lost.map(p => ({ id: p.id, value: p.value, status: p.status })), null, 2));

            lost.forEach(p => {
                this._moveToPool(p);
                console.log(`已修复: 将 ${p.value} 添加到 pool`);
            });
        }
    }

    _processRound() {
        const marriedPairs = this.married.length;
        this.quarrelQuota = Math.max(1, Math.ceil(marriedPairs / 3));

        this.people.forEach(p => {
            p.divorcedThisRound = false;
            p.justPaired = false;
            p.currentRound = this.roundNumber;
        });

        this._restoreQuarrelWaitStatus();

        if (this.roundNumber === 1) {
            this._firstRoundPairing();
        } else {
            this._processLaterRounds();
        }

        this._updateStatistics();
    }

    _updateStatistics() {
        this.married.forEach(pair => {
            const [p1, p2] = pair;

            if (p1.status === Status.MARRIED || p1.status === Status.QUARREL_WAIT) {
                p1.totalMarriedRounds++;
            }
            if (p2.status === Status.MARRIED || p2.status === Status.QUARREL_WAIT) {
                p2.totalMarriedRounds++;
            }

            if (p1.status === Status.QUARREL_WAIT) {
                p1.totalQuarrelRounds++;
            }
            if (p2.status === Status.QUARREL_WAIT) {
                p2.totalQuarrelRounds++;
            }
        });
    }

    _restoreQuarrelWaitStatus() {
        this.people.forEach(p => {
            if (p.quarrelWaitRounds > 0) {
                p.quarrelWaitRounds--;
                if (p.quarrelWaitRounds === 0 && p.status === Status.QUARREL_WAIT) {
                    p.status = Status.MARRIED;
                    if (p.quarrelStartRound > 0) {
                        p.totalQuarrelRounds += this.roundNumber - p.quarrelStartRound;
                        p.quarrelStartRound = 0;
                    }
                }
            }
        });

        this.pool.forEach(p => {
            if (p.quarrelWaitRounds > 0) {
                p.quarrelWaitRounds--;
                if (p.quarrelWaitRounds === 0 && p.status === Status.QUARREL_WAIT) {
                    p.status = Status.MARRIED;
                }
            }
        });
    }

    _firstRoundPairing() {
        const singles = this.people.filter(p => p.status === Status.SINGLE);

        if (singles.length % 2 !== 0) {
            let minIndex = 0;
            for (let i = 1; i < singles.length; i++) {
                if (singles[i].value < singles[minIndex].value) {
                    minIndex = i;
                }
            }
            const eliminated = singles.splice(minIndex, 1)[0];
            eliminated.status = Status.WAIT_TO_MATCH;
            this.pool.push(eliminated);
            this._addEvent(`踢最小: ${eliminated.value}`);
        }

        for (let i = 0; i < singles.length; i += 2) {
            const p1 = singles[i];
            const p2 = singles[i + 1];
            if (p2) {
                this._createPair(p1, p2);
            }
        }
    }

    _moveToPool(person) {
        if (!person) return;

        this.married = this.married.filter(pair => {
            return pair[0].id !== person.id && pair[1].id !== person.id;
        });

        this.pool = this.pool.filter(p => p.id !== person.id);

        person.status = Status.WAIT_TO_MATCH;
        person.partner = null;

        this.pool.push(person);
    }

    _createPair(p1, p2) {
        if (p1.id === p2.id) {
            this._addEvent(`错误：无法自己和自己配对 ${p1.value}`);
            return;
        }

        const p1InMarried = this.married.some(m => m[0].id === p1.id || m[1].id === p1.id);
        const p2InMarried = this.married.some(m => m[0].id === p2.id || m[1].id === p2.id);

        if (p1InMarried || p2InMarried) {
            this._addEvent(`错误：${p1.value} 或 ${p2.value} 已在配对中`);
            if (!p1InMarried) this._moveToPool(p1);
            if (!p2InMarried) this._moveToPool(p2);
            return;
        }

        this.pool = this.pool.filter(p => p.id !== p1.id && p.id !== p2.id);

        p1.status = Status.MARRIED;
        p2.status = Status.MARRIED;
        p1.partner = p2;
        p2.partner = p1;
        p1.justPaired = true;
        p2.justPaired = true;
        p1.marriageStartRound = this.roundNumber;
        p2.marriageStartRound = this.roundNumber;
        this.married.push([p1, p2]);
        this._addEvent(`配对成功: ${p1.value} <-> ${p2.value}`);
        this._recordPairHistory(p1, p2);
        this._checkQuarrel(p1, p2);
    }

    _processLaterRounds() {
        console.log(`[_processLaterRounds] 开始第 ${this.roundNumber} 回合后续处理`);
        this._processPoolPairing();
        this._processCheating();
        this._processDivorceTrend();
        this._processMainTableRepairing();
        console.log(`[_processLaterRounds] 结束第 ${this.roundNumber} 回合后续处理`);
    }

    _processPoolPairing() {
        const seenIds = new Set();
        this.pool = this.pool.filter(p => {
            if (seenIds.has(p.id)) {
                return false;
            }
            seenIds.add(p.id);
            return true;
        });

        if (this.pool.length < 2) {
            this._addEvent(`匹配池：待配对0人，非待配对${this.pool.length}人`);
            return;
        }

        const toPair = [];
        const remaining = [];

        this.pool.forEach(p => {
            p.currentRound = this.roundNumber;
            if (p.status !== Status.WAIT_TO_MATCH) {
                p.status = Status.WAIT_TO_MATCH;
            }
            if (p.divorcedThisRound) {
                p.divorcedThisRound = false;
            }
            if (p.status === Status.WAIT_TO_MATCH && !p.divorcedThisRound) {
                toPair.push(p);
            } else {
                remaining.push(p);
            }
        });

        this._addEvent(`匹配池：待配对${toPair.length}人，非待配对${remaining.length}人`);

        const pairedIds = new Set();
        for (let i = 0; i < toPair.length; i += 2) {
            const p1 = toPair[i];
            const p2 = toPair[i + 1];

            if (p2) {
                if (p1.id === p2.id) {
                    remaining.push(p1);
                    continue;
                }
                if (this._isBanned(p1, p2)) {
                    remaining.push(p1, p2);
                    continue;
                }
                this._createPair(p1, p2);
                pairedIds.add(p1.id);
                pairedIds.add(p2.id);
            } else {
                remaining.push(p1);
            }
        }

        this.pool = remaining.filter(p => !pairedIds.has(p.id));
    }

    _isBanned(person1, person2) {
        const banRound = person1.bannedWith[person2.id];
        return banRound !== undefined && this.roundNumber < banRound;
    }

    _recordPairHistory(p1, p2) {
        const currentRound = this.roundNumber;

        p1.pairHistory.push(currentRound);
        p2.pairHistory.push(currentRound);

        p1.pairHistory = p1.pairHistory.filter(r => currentRound - r < CONSTANTS.PAIR_CHECK_ROUNDS);
        p2.pairHistory = p2.pairHistory.filter(r => currentRound - r < CONSTANTS.PAIR_CHECK_ROUNDS);

        if (p1.pairHistory.length > CONSTANTS.PAIR_LIMIT ||
            p2.pairHistory.length > CONSTANTS.PAIR_LIMIT) {
            this._addEvent(`禁止配对：${p1.value} 和 ${p2.value} 禁止 ${CONSTANTS.PAIR_BAN_ROUNDS} 回合`);
            p1.bannedWith[p2.id] = this.roundNumber + CONSTANTS.PAIR_BAN_ROUNDS;
            p2.bannedWith[p1.id] = this.roundNumber + CONSTANTS.PAIR_BAN_ROUNDS;
        }
    }

    _checkQuarrel(p1, p2) {
        if (this.quarrelQuota <= 0) return;

        if (Math.random() < CONSTANTS.QUARREL_RATE) {
            p1.status = Status.QUARREL_WAIT;
            p2.status = Status.QUARREL_WAIT;
            p1.quarrelWaitRounds = CONSTANTS.QUARREL_WAIT_ROUNDS;
            p2.quarrelWaitRounds = CONSTANTS.QUARREL_WAIT_ROUNDS;
            p1.quarrelStartRound = this.roundNumber;
            p2.quarrelStartRound = this.roundNumber;
            this._addEvent(`争吵：${p1.value} <-> ${p2.value} (等待 ${CONSTANTS.QUARREL_WAIT_ROUNDS} 回合)`);
            this.quarrelQuota--;
        }
    }

    _processCheating() {
        const toRemoveIds = new Set();
        const newMarriedPairs = [];
        const usedThirdParties = new Set();
        const victimsToPool = [];

        this.married.forEach((pair, i) => {
            const [p1, p2] = pair;

            let cheater, victim;
            if (p1.value < p2.value) {
                cheater = p1;
                victim = p2;
            } else {
                cheater = p2;
                victim = p1;
            }

            if (cheater.justPaired || victim.justPaired) return;
            if (cheater.value >= victim.value) return;

            let thirdParty = null;
            let maxValue = cheater.value;

            this.pool.forEach(person => {
                if (person.status === Status.WAIT_TO_MATCH &&
                    !person.justPaired &&
                    !usedThirdParties.has(person.id) &&
                    person.value > maxValue) {
                    maxValue = person.value;
                    thirdParty = person;
                }
            });

            if (!thirdParty) return;
            if (thirdParty.value <= cheater.value) return;
            if (Math.random() >= CONSTANTS.CHEATING_OUTSIDE_RATE) return;

            usedThirdParties.add(thirdParty.id);

            this._addEvent(`出轨：${cheater.value} (受害者:${victim.value}) 被 ${thirdParty.value} 吸引`);

            if (Math.random() < CONSTANTS.DATING_SUCCESS_RATE) {
                this._addEvent(`约会成功：${cheater.value} 与 ${thirdParty.value} 在一起`);

                toRemoveIds.add(`${p1.id}-${p2.id}`);

                victim.divorcedThisRound = true;
                victimsToPool.push(victim);

                this.pool = this.pool.filter(p => p.id !== thirdParty.id);

                cheater.status = Status.CHEATING;
                cheater.partner = thirdParty;
                cheater.cheatingStartRound = this.roundNumber;
                cheater.currentRound = this.roundNumber;
                cheater.cheatingCount++;

                thirdParty.status = Status.CHEATING;
                thirdParty.partner = cheater;
                thirdParty.cheatingStartRound = this.roundNumber;
                thirdParty.currentRound = this.roundNumber;

                newMarriedPairs.push([cheater, thirdParty]);
            }
        });

        console.log(`[出轨处理] 移除前 married 数量: ${this.married.length}, toRemoveIds: ${Array.from(toRemoveIds).join(', ')}`);
        this.married = this.married.filter(pair => {
            const key = `${pair[0].id}-${pair[1].id}`;
            const reverseKey = `${pair[1].id}-${pair[0].id}`;
            return !toRemoveIds.has(key) && !toRemoveIds.has(reverseKey);
        });
        console.log(`[出轨处理] 移除后 married 数量: ${this.married.length}`);

        console.log(`[出轨处理] 受害者数量: ${victimsToPool.length}`);
        victimsToPool.forEach(p => {
            console.log(`[出轨处理] 移动受害者 ${p.value} 到 pool`);
            this._moveToPool(p);
        });

        const usedIds = new Set();
        newMarriedPairs.forEach(pair => {
            const [p1, p2] = pair;

            const p1InMarried = this.married.some(m => m[0].id === p1.id || m[1].id === p1.id);
            const p2InMarried = this.married.some(m => m[0].id === p2.id || m[1].id === p2.id);

            if (!p1InMarried && !p2InMarried && !usedIds.has(p1.id) && !usedIds.has(p2.id)) {
                this.married.push(pair);
                usedIds.add(p1.id);
                usedIds.add(p2.id);
            } else {
                if (!p1InMarried && !usedIds.has(p1.id)) {
                    this._moveToPool(p1);
                }
                if (!p2InMarried && !usedIds.has(p2.id)) {
                    this._moveToPool(p2);
                }
            }
        });
    }

    _processDivorceTrend() {
        const toRemoveIds = new Set();

        this.married.forEach(([p1, p2]) => {
            p1.divorceTrend += CONSTANTS.DIVORCE_NATURAL_GROWTH;
            p2.divorceTrend += CONSTANTS.DIVORCE_NATURAL_GROWTH;

            if (p1.status === Status.QUARREL_WAIT || p2.status === Status.QUARREL_WAIT) {
                p1.divorceTrend += CONSTANTS.DIVORCE_TREND_INCREMENT;
                p2.divorceTrend += CONSTANTS.DIVORCE_TREND_INCREMENT;
            }

            if (p1.divorceTrend >= CONSTANTS.DIVORCE_THRESHOLD ||
                p2.divorceTrend >= CONSTANTS.DIVORCE_THRESHOLD) {
                this._addEvent(`离婚!: ${p1.value} <-> ${p2.value} (倾向:${Math.round(p1.divorceTrend)}/${Math.round(p2.divorceTrend)})`);

                if (p1.marriageStartRound > 0) {
                    p1.totalMarriedRounds += this.roundNumber - p1.marriageStartRound;
                }
                if (p2.marriageStartRound > 0) {
                    p2.totalMarriedRounds += this.roundNumber - p2.marriageStartRound;
                }

                toRemoveIds.add(`${p1.id}-${p2.id}`);

                p1.bannedWith[p2.id] = this.roundNumber + CONSTANTS.PAIR_BAN_ROUNDS;
                p2.bannedWith[p1.id] = this.roundNumber + CONSTANTS.PAIR_BAN_ROUNDS;

                p1.divorceTrend = 0;
                p2.divorceTrend = 0;

                p1.divorcedThisRound = true;
                p2.divorcedThisRound = true;
                this._moveToPool(p1);
                this._moveToPool(p2);
            }
        });

        if (toRemoveIds.size > 0) {
            this.married = this.married.filter(pair => {
                const key = `${pair[0].id}-${pair[1].id}`;
                const reverseKey = `${pair[1].id}-${pair[0].id}`;
                return !toRemoveIds.has(key) && !toRemoveIds.has(reverseKey);
            });
        }
    }

    _processMainTableRepairing() {
        const toRemove = [];
        const toMoveToPool = [];

        this.married.forEach((pair, i) => {
            const [p1, p2] = pair;

            const p1InPair = [Status.MARRIED, Status.QUARREL_WAIT, Status.CHEATING].includes(p1.status);
            const p2InPair = [Status.MARRIED, Status.QUARREL_WAIT, Status.CHEATING].includes(p2.status);

            if (!p1InPair || !p2InPair) {
                toRemove.push(i);

                if (p1.marriageStartRound > 0) {
                    p1.totalMarriedRounds += this.roundNumber - p1.marriageStartRound;
                }
                if (p2.marriageStartRound > 0) {
                    p2.totalMarriedRounds += this.roundNumber - p2.marriageStartRound;
                }

                if (!p1InPair) toMoveToPool.push(p1);
                if (!p2InPair) toMoveToPool.push(p2);
            }
        });

        toRemove.reverse().forEach(i => this.married.splice(i, 1));

        toMoveToPool.forEach(p => this._moveToPool(p));
    }

    _checkSorting() {
        const allValues = [];

        this.married.forEach(([p1, p2]) => {
            allValues.push(p1.value, p2.value);
        });

        if (allValues.length === 0) return;

        const ascending = allValues.every((v, i) => i === 0 || v >= allValues[i - 1]);
        const descending = allValues.every((v, i) => i === 0 || v <= allValues[i - 1]);

        if (ascending || descending) {
            this.sortSucceeded = true;
            const order = ascending ? '正序' : '倒序';
            this._addEvent(`💕 排序成功! (${order}) 值：${allValues.join(', ')}`);
            this._addEvent('🎉 有情人终成眷属！祝福每一对新人！');
        }
    }

    _addEvent(message) {
        const now = new Date();
        const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
        const eventStr = `[${timeStr}] ${message}`;
        this.events.push(eventStr);
        console.log(eventStr);
    }
}