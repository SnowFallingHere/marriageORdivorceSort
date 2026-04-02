class GambleController {
    constructor() {
        this.guessedValue = null;
        this.guessCount = 0;
        this.maxGuesses = 2;
        this.isGuessed = false;
        this.result = null;
        this.initialValues = [];
    }

    reset() {
        this.guessedValue = null;
        this.guessCount = 0;
        this.isGuessed = false;
        this.result = null;
        this.initialValues = [];
    }

    setInitialValues(values) {
        this.initialValues = values.map(v => v.value);
    }

    canGuess() {
        return !this.isGuessed;
    }

    canAdjust() {
        return this.isGuessed && this.guessCount < this.maxGuesses && this.result === null;
    }

    makeGuess(value) {
        if (!this.canGuess()) {
            return { success: false, message: '已经猜过了！' };
        }

        if (!this.initialValues.includes(value)) {
            return { success: false, message: `数值 ${value} 不在初始数据中！` };
        }

        this.guessedValue = value;
        this.isGuessed = true;
        this.result = null;
        return { success: true, message: `竞猜成功！你选择了数值 ${value}！` };
    }

    adjustGuess(newValue) {
        if (!this.canAdjust()) {
            if (this.result !== null) {
                return { success: false, message: '排序已完成，无法调整！' };
            }
            if (this.guessCount >= this.maxGuesses) {
                return { success: false, message: `已用完 ${this.maxGuesses} 次调整机会！` };
            }
            return { success: false, message: '请先进行竞猜！' };
        }

        if (!this.initialValues.includes(newValue)) {
            return { success: false, message: `数值 ${newValue} 不在初始数据中！` };
        }

        const oldValue = this.guessedValue;
        this.guessedValue = newValue;
        this.guessCount++;
        return { 
            success: true, 
            message: `调整成功！${this.guessCount}/${this.maxGuesses} 次调整机会已用，你选择了数值 ${newValue}（原来是 ${oldValue}）` 
        };
    }

    checkResult(marriedData) {
        if (this.result !== null) {
            return this.result;
        }

        if (this.guessedValue === null) {
            this.result = { won: false, message: '你没有竞猜！', guessedValue: null, survived: false };
            return this.result;
        }

        const finalValues = [];
        if (marriedData && marriedData.length > 0) {
            marriedData.forEach(pair => {
                if (Array.isArray(pair)) {
                    finalValues.push(pair[0].value, pair[1].value);
                }
            });
        }

        const survived = finalValues.includes(this.guessedValue);

        if (survived) {
            this.result = {
                won: true,
                message: `🎉 恭喜！你竞猜的数值 ${this.guessedValue} 成功留在了主表格中！`,
                guessedValue: this.guessedValue,
                survived: true
            };
        } else {
            this.result = {
                won: false,
                message: `😅 可惜！你竞猜的数值 ${this.guessedValue} 未能留在主表格中...`,
                guessedValue: this.guessedValue,
                survived: false
            };
        }

        return this.result;
    }

    getStatus() {
        return {
            guessed: this.isGuessed,
            guessedValue: this.guessedValue,
            guessCount: this.guessCount,
            maxGuesses: this.maxGuesses,
            remainingAdjustments: this.maxGuesses - this.guessCount,
            canGuess: this.canGuess(),
            canAdjust: this.canAdjust(),
            result: this.result
        };
    }
}