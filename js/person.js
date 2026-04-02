class Person {
    constructor(value) {
        this.value = value;
        this.id = Date.now() + Math.floor(Math.random() * 10000);
        this.status = Status.SINGLE;
        this.partner = null;
        this.divorceTrend = 0;
        this.pairHistory = [];
        this.bannedWith = {};
        this.quarrelWaitRounds = 0;
        this.divorcedThisRound = false;
        this.justPaired = false;
        this.cheatingStartRound = 0;
        this.currentRound = 0;

        this.totalMarriedRounds = 0;
        this.totalQuarrelRounds = 0;
        this.cheatingCount = 0;
        this.marriageStartRound = 0;
        this.quarrelStartRound = 0;
    }

    calculateStabilityScore(divorceRate) {
        const score = (0.4 * this.totalMarriedRounds - 0.2 * this.totalQuarrelRounds - 0.4 * this.cheatingCount) * (1/3) * divorceRate;
        return score.toFixed(2);
    }
}