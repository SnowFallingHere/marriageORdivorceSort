class UIController {
    constructor() {
        this.sorter = new MarriageOrDivorceSort();
        this.gamble = new GambleController();
        this.timerId = null;
        this.isPaused = false;
        this.hasGuessed = false;
        this.gambleEnabled = false;

        this.elements = {
            startBtn: document.getElementById('startBtn'),
            pauseBtn: document.getElementById('pauseBtn'),
            resetBtn: document.getElementById('resetBtn'),
            dataCountInput: document.getElementById('dataCount'),
            speedInput: document.getElementById('speed'),
            chart: document.getElementById('chart'),
            poolArea: document.getElementById('poolArea'),
            roundNumber: document.getElementById('roundNumber'),
            marriedCount: document.getElementById('marriedCount'),
            poolCount: document.getElementById('poolCount'),
            eliminatedCount: document.getElementById('eliminatedCount'),
            eventList: document.getElementById('eventList'),
            flowchart: document.getElementById('flowchart'),
            helpIcon: document.getElementById('helpIcon'),
            helpModal: document.getElementById('helpModal'),
            modalClose: document.getElementById('modalClose'),
            gambleArea: document.getElementById('gambleArea'),
            gambleValue: document.getElementById('gambleValue'),
            gambleBtn: document.getElementById('gambleBtn'),
            gambleStatus: document.getElementById('gambleStatus'),
            gambleResult: document.getElementById('gambleResult'),
            gambleAdjustArea: document.getElementById('gambleAdjustArea'),
            gambleAdjustValue: document.getElementById('gambleAdjustValue'),
            gambleAdjustBtn: document.getElementById('gambleAdjustBtn'),
            gambleEnabled: document.getElementById('gambleEnabled')
        };

        this._createTooltip();
        this._initEventListeners();
        this._initFlowchart();
        this._initGamble();
        this.reset();
    }

    _createTooltip() {
        this.tooltip = document.createElement('div');
        this.tooltip.className = 'data-tooltip';
        this.tooltip.style.cssText = 'position:fixed;background:#1e1e3f;color:#fff;padding:12px;border-radius:8px;z-index:9999;display:none;border:2px solid #f5576c;box-shadow:0 5px 20px rgba(0,0,0,0.5);';
        document.body.appendChild(this.tooltip);
    }

    _showTooltip(person, x, y) {
        const divorceRate = (person.divorceTrend / CONSTANTS.DIVORCE_THRESHOLD * 100).toFixed(1);
        const stabilityScore = person.calculateStabilityScore(person.divorceTrend / CONSTANTS.DIVORCE_THRESHOLD);

        const statusText = {
            'single': '单身',
            'married': '已婚',
            'wait-to-match': '等待配对',
            'quarrel-wait': '争吵中',
            'cheating': '出轨中'
        }[person.status] || person.status;

        this.tooltip.innerHTML = `
            <div class="tooltip-header">数值: ${person.value}</div>
            <div class="tooltip-row">
                <span class="tooltip-label">状态:</span>
                <span class="tooltip-value">${statusText}</span>
            </div>
            <div class="tooltip-row">
                <span class="tooltip-label">离婚倾向:</span>
                <span class="tooltip-value ${person.divorceTrend > 50 ? 'negative' : 'positive'}">${person.divorceTrend.toFixed(1)}/100</span>
            </div>
            <div class="tooltip-row">
                <span class="tooltip-label">离婚率:</span>
                <span class="tooltip-value ${divorceRate > 50 ? 'negative' : 'positive'}">${divorceRate}%</span>
            </div>
            <div class="tooltip-divider"></div>
            <div class="tooltip-row">
                <span class="tooltip-label">婚姻维持回合:</span>
                <span class="tooltip-value positive">${person.totalMarriedRounds}</span>
            </div>
            <div class="tooltip-row">
                <span class="tooltip-label">争吵回合:</span>
                <span class="tooltip-value negative">${person.totalQuarrelRounds}</span>
            </div>
            <div class="tooltip-row">
                <span class="tooltip-label">出轨次数:</span>
                <span class="tooltip-value negative">${person.cheatingCount}</span>
            </div>
            <div class="tooltip-score">
                婚姻稳定指数: ${stabilityScore}
            </div>
        `;

        this.tooltip.style.display = 'block';
        this.tooltip.style.visibility = 'hidden';

        const rect = this.tooltip.getBoundingClientRect();
        const tooltipHeight = rect.height || 200;
        const tooltipWidth = rect.width || 220;

        let left = x + 15;
        let top = y + 15;

        if (left + tooltipWidth > window.innerWidth - 10) {
            left = x - tooltipWidth - 15;
        }
        if (left < 10) left = 10;

        if (top + tooltipHeight > window.innerHeight - 10) {
            top = y - tooltipHeight - 15;
        }
        if (top < 10) top = 10;

        this.tooltip.style.left = `${left}px`;
        this.tooltip.style.top = `${top}px`;
        this.tooltip.style.visibility = 'visible';
        this.tooltip.classList.add('visible');
    }

    _hideTooltip() {
        this.tooltip.style.display = 'none';
        this.tooltip.classList.remove('visible');
    }

    _initEventListeners() {
        const { startBtn, pauseBtn, resetBtn, dataCountInput, speedInput,
                helpIcon, helpModal, modalClose } = this.elements;

        startBtn.addEventListener('click', () => this.start());
        pauseBtn.addEventListener('click', () => this.togglePause());
        resetBtn.addEventListener('click', () => this.reset());

        dataCountInput.addEventListener('change', () => this._validateInput(dataCountInput, CONSTANTS.MIN_DATA_COUNT, CONSTANTS.MAX_DATA_COUNT));
        speedInput.addEventListener('change', () => this._validateInput(speedInput, CONSTANTS.MIN_SPEED, CONSTANTS.MAX_SPEED, CONSTANTS.DEFAULT_SPEED));

        helpIcon.addEventListener('click', () => helpModal.classList.add('active'));
        modalClose.addEventListener('click', () => helpModal.classList.remove('active'));
        helpModal.addEventListener('click', (e) => {
            if (e.target === helpModal) helpModal.classList.remove('active');
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && helpModal.classList.contains('active')) {
                helpModal.classList.remove('active');
            }
        });
    }

    _validateInput(input, min, max, defaultVal = null) {
        let value = parseInt(input.value);
        if (isNaN(value) || value < min || value > max) {
            input.classList.add('invalid');
            if (defaultVal !== null) input.value = defaultVal;
            setTimeout(() => input.classList.remove('invalid'), 300);
            return false;
        }
        input.value = value;
        return true;
    }

    _initFlowchart() {
        const steps = [
            '初始化',
            '第一回合配对',
            '池配对',
            '出轨处理',
            '离婚倾向',
            '排序检查'
        ];
        this.elements.flowchart.innerHTML = steps.map(s =>
            `<div class="flow-step" data-step="${s}">${s}</div>`
        ).join('');
    }

    _updateFlowchart(stepName) {
        document.querySelectorAll('.flow-step').forEach(el => {
            el.classList.toggle('active', el.dataset.step === stepName);
        });
    }

    _initGamble() {
        const { gambleBtn, gambleAdjustBtn, gambleValue, gambleAdjustValue, gambleEnabled, gambleArea } = this.elements;

        gambleEnabled.addEventListener('change', () => {
            this.gambleEnabled = gambleEnabled.checked;
            if (this.gambleEnabled) {
                gambleArea.classList.add('active');
                gambleArea.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } else {
                gambleArea.classList.remove('active');
            }
        });

        gambleBtn.addEventListener('click', () => {
            const value = parseInt(gambleValue.value);
            if (isNaN(value)) {
                this._showGambleMessage('请输入有效数值！', 'error');
                return;
            }
            const result = this.gamble.makeGuess(value);
            if (result.success) {
                this._showGambleMessage(result.message, 'success');
                gambleValue.value = '';
                gambleValue.disabled = true;
                gambleBtn.disabled = true;
                this.hasGuessed = true;
                this._updateGambleStatus();
            } else {
                this._showGambleMessage(result.message, 'error');
            }
        });

        gambleAdjustBtn.addEventListener('click', () => {
            if (!this.isPaused) {
                this._showGambleMessage('暂停后才能调整竞猜！', 'error');
                return;
            }
            const value = parseInt(gambleAdjustValue.value);
            if (isNaN(value)) {
                this._showGambleMessage('请输入有效数值！', 'error');
                return;
            }
            const result = this.gamble.adjustGuess(value);
            if (result.success) {
                this._showGambleMessage(result.message, 'success');
                gambleAdjustValue.value = '';
                this._updateGambleStatus();
            } else {
                this._showGambleMessage(result.message, 'error');
            }
        });
    }

    _showGambleMessage(message, type) {
        const { gambleStatus } = this.elements;
        gambleStatus.textContent = message;
        gambleStatus.className = 'gamble-status ' + type;
    }

    _updateGambleStatus() {
        const { gambleStatus, gambleAdjustArea, gambleResult } = this.elements;
        const status = this.gamble.getStatus();

        if (status.result !== null) {
            gambleResult.textContent = status.result.message;
            gambleResult.className = 'gamble-result ' + (status.result.won ? 'won' : 'lost');
            gambleAdjustArea.style.display = 'none';
            return;
        }

        if (status.canGuess) {
            gambleStatus.textContent = '请竞猜一个数值，使其最终留在主表格中！';
            gambleStatus.className = 'gamble-status';
            gambleAdjustArea.style.display = 'none';
        } else if (status.canAdjust) {
            gambleStatus.textContent = `已竞猜数值 ${status.guessedValue}，还可调整 ${status.remainingAdjustments} 次`;
            gambleStatus.className = 'gamble-status success';
            gambleAdjustArea.style.display = 'block';
        } else if (status.guessed) {
            gambleStatus.textContent = `已竞猜数值 ${status.guessedValue}，调整次数已用完`;
            gambleStatus.className = 'gamble-status';
            gambleAdjustArea.style.display = 'none';
        }
    }

    start() {
        if (this.sorter.sortSucceeded) {
            this.reset();
        }

        if (this.gambleEnabled && !this.hasGuessed) {
            this._showGambleMessage('请先进行竞猜！', 'error');
            return;
        }

        const { startBtn, pauseBtn } = this.elements;
        startBtn.disabled = true;
        pauseBtn.disabled = false;

        this._runStep();
    }

    _runStep() {
        if (this.isPaused || this.sorter.sortSucceeded) return;

        const result = this.sorter.step();
        this._render(result);

        if (!result.sortSucceeded) {
            const speed = parseInt(this.elements.speedInput.value);
            this.timerId = setTimeout(() => this._runStep(), speed);
        } else {
            this._onSortComplete();
        }
    }

    _onSortComplete() {
        const { startBtn, pauseBtn } = this.elements;
        startBtn.disabled = true;
        pauseBtn.disabled = true;
        pauseBtn.textContent = 'Pause';

        this._playSuccessSound();

        if (this.gambleEnabled) {
            const gambleResult = this.gamble.checkResult(this.sorter.married);
            this._showGambleMessage(gambleResult.message, gambleResult.won ? 'success' : 'error');
            this._updateGambleStatus();
        }

        this.sorter._addEvent('🎉 排序完成！恭喜！');
        this._render({
            round: this.sorter.roundNumber,
            married: this.sorter.married.map(pair => [
                { id: pair[0].id, value: pair[0].value, status: pair[0].status, divorceTrend: pair[0].divorceTrend, cheatingStartRound: pair[0].cheatingStartRound, currentRound: this.sorter.roundNumber },
                { id: pair[1].id, value: pair[1].value, status: pair[1].status, divorceTrend: pair[1].divorceTrend, cheatingStartRound: pair[1].cheatingStartRound, currentRound: this.sorter.roundNumber }
            ]),
            pool: this.sorter.pool.map(p => ({ id: p.id, value: p.value, status: p.status, divorceTrend: p.divorceTrend })),
            eliminated: this.sorter.eliminated.map(p => ({ id: p.id, value: p.value })),
            allEvents: this.sorter.events
        });
    }

    _playSuccessSound() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime);
            oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1);
            oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2);

            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
        } catch (e) {
            console.log('Audio not supported');
        }
    }

    togglePause() {
        const { pauseBtn } = this.elements;

        if (this.isPaused) {
            this.isPaused = false;
            pauseBtn.textContent = 'Pause';
            this._runStep();
        } else {
            this.isPaused = true;
            pauseBtn.textContent = 'Resume';
            if (this.timerId) {
                clearTimeout(this.timerId);
            }
        }
    }

    reset() {
        const { startBtn, pauseBtn, gambleValue, gambleBtn, gambleStatus, gambleResult, gambleAdjustArea, gambleArea, gambleEnabled } = this.elements;

        if (this.timerId) {
            clearTimeout(this.timerId);
        }

        this.isPaused = false;
        this.hasGuessed = false;
        this.gambleEnabled = gambleEnabled.checked;
        pauseBtn.textContent = 'Pause';
        startBtn.disabled = false;
        pauseBtn.disabled = true;

        this.gamble.reset();
        this.sorter = new MarriageOrDivorceSort();

        gambleValue.value = '';
        gambleValue.disabled = false;
        gambleBtn.disabled = false;
        gambleStatus.textContent = '请竞猜一个数值，使其最终留在主表格中！';
        gambleStatus.className = 'gamble-status';
        gambleResult.textContent = '';
        gambleResult.className = 'gamble-result';
        gambleAdjustArea.style.display = 'none';

        if (!this.gambleEnabled) {
            gambleArea.classList.remove('active');
        }

        const dataCount = parseInt(this.elements.dataCountInput.value);
        this.sorter.generateData(dataCount);
        this.gamble.setInitialValues(this.sorter.people);

        this._render({
            round: 0,
            eliminated: [],
            married: [],
            pool: this.sorter.people.map(p => ({ id: p.id, value: p.value })),
            sortSucceeded: false,
            allEvents: []
        });

        this._updateFlowchart('初始化');
    }

    _render(result) {
        this._updateStatistics(result);
        this._renderChart(result.married);
        this._renderPool(result.pool);
        this._renderEvents(result.allEvents || []);
        this._updateFlowchart(this._getCurrentStep(result.round));
    }

    _updateStatistics(result) {
        this.elements.roundNumber.textContent = result.round;
        this.elements.marriedCount.textContent = result.married.length;
        this.elements.poolCount.textContent = result.pool.length;
        this.elements.eliminatedCount.textContent = result.eliminated.length;
    }

    _getCurrentStep(round) {
        if (round === 0) return '初始化';
        if (round === 1) return '第一回合配对';
        if (this.sorter.pool.length > 0) return '池配对';
        if (this.sorter.married.some(p => p[0].status === Status.QUARREL_WAIT)) return '出轨处理';
        return '离婚倾向';
    }

    _renderChart(marriedData) {
        const { chart } = this.elements;

        let maxValue = 1;
        marriedData.forEach(pair => {
            if (pair[0].value > maxValue) maxValue = pair[0].value;
            if (pair[1].value > maxValue) maxValue = pair[1].value;
        });

        const self = this;
        const fragment = document.createDocumentFragment();

        marriedData.forEach(pair => {
            const [p1, p2] = pair;

            const pairWrapper = document.createElement('div');
            pairWrapper.className = 'pair-wrapper paired';

            const slot1 = document.createElement('div');
            slot1.className = 'bar-slot';

            const bar1 = document.createElement('div');
            bar1.className = 'bar ' + p1.status;
            bar1.style.height = `${((p1.value / maxValue) * 180 + 30)}px`;
            bar1.style.background = this._calculateColor(
                p1.status,
                p1.divorceTrend || 0,
                p1.cheatingStartRound || 0,
                p1.currentRound || this.sorter?.roundNumber || 0
            );

            bar1.dataset.personId = p1.id;
            bar1.dataset.personValue = p1.value;

            bar1.addEventListener('mouseenter', function(e) {
                const person = self.sorter.people.find(p => p.id === parseInt(this.dataset.personId));
                if (person) {
                    self._showTooltip(person, e.clientX, e.clientY);
                }
            });
            bar1.addEventListener('mousemove', function(e) {
                const person = self.sorter.people.find(p => p.id === parseInt(this.dataset.personId));
                if (person) {
                    self._showTooltip(person, e.clientX, e.clientY);
                }
            });
            bar1.addEventListener('mouseleave', function() {
                self._hideTooltip();
            });

            const valueLabel1 = document.createElement('div');
            valueLabel1.className = 'bar-value';
            valueLabel1.textContent = p1.value;
            bar1.appendChild(valueLabel1);

            slot1.appendChild(bar1);
            pairWrapper.appendChild(slot1);

            const slot2 = document.createElement('div');
            slot2.className = 'bar-slot';

            const bar2 = document.createElement('div');
            bar2.className = 'bar ' + p2.status;
            bar2.style.height = `${((p2.value / maxValue) * 180 + 30)}px`;
            bar2.style.background = this._calculateColor(
                p2.status,
                p2.divorceTrend || 0,
                p2.cheatingStartRound || 0,
                p2.currentRound || this.sorter?.roundNumber || 0
            );

            bar2.dataset.personId = p2.id;
            bar2.dataset.personValue = p2.value;

            bar2.addEventListener('mouseenter', function(e) {
                const person = self.sorter.people.find(p => p.id === parseInt(this.dataset.personId));
                if (person) {
                    self._showTooltip(person, e.clientX, e.clientY);
                }
            });
            bar2.addEventListener('mousemove', function(e) {
                const person = self.sorter.people.find(p => p.id === parseInt(this.dataset.personId));
                if (person) {
                    self._showTooltip(person, e.clientX, e.clientY);
                }
            });
            bar2.addEventListener('mouseleave', function() {
                self._hideTooltip();
            });

            const valueLabel2 = document.createElement('div');
            valueLabel2.className = 'bar-value';
            valueLabel2.textContent = p2.value;
            bar2.appendChild(valueLabel2);

            slot2.appendChild(bar2);
            pairWrapper.appendChild(slot2);

            fragment.appendChild(pairWrapper);
        });

        chart.innerHTML = '';
        chart.appendChild(fragment);
    }

    _calculateColor(status, divorceTrend, cheatingStartRound, currentRound) {
        const CHEATING_FADE_ROUNDS = 10;
        const cheatingRounds = currentRound - cheatingStartRound;
        const cheatingFade = Math.min(1, cheatingRounds / CHEATING_FADE_ROUNDS);
        const quarrelIntensity = divorceTrend / 100;

        if (status === 'wait-to-match' || status === 'single') {
            return 'linear-gradient(180deg, #868e96, #495057)';
        } else if (status === 'married') {
            const r1 = 255, g1 = 107, b1 = 107;
            const r2 = 139, g2 = 0, b2 = 0;
            const r = Math.round(r1 + (r2 - r1) * quarrelIntensity);
            const g = Math.round(g1 + (g2 - g1) * quarrelIntensity);
            const b = Math.round(b1 + (b2 - b1) * quarrelIntensity);
            return `linear-gradient(180deg, rgb(${r},${g},${b}), rgb(${Math.round(r*0.7)},${Math.round(g*0.3)},${Math.round(b*0.3)}))`;
        } else if (status === 'quarrel-wait') {
            const baseR = 255, baseG = 135, baseB = 135;
            const deepR = 180, deepG = 30, deepB = 30;
            const r = Math.round(baseR + (deepR - baseR) * quarrelIntensity);
            const g = Math.round(baseG + (deepG - baseG) * quarrelIntensity);
            const b = Math.round(baseB + (deepB - baseB) * quarrelIntensity);
            return `linear-gradient(180deg, rgb(${r},${g},${b}), rgb(${Math.round(r*0.6)},${Math.round(g*0.2)},${Math.round(b*0.2)}))`;
        } else if (status === 'cheating') {
            const pr = 218, pg = 119, pb = 242;
            const rr = 255, rg = 107, rb = 107;
            const r = Math.round(pr + (rr - pr) * cheatingFade);
            const g = Math.round(pg + (rg - pg) * cheatingFade);
            const b = Math.round(pb + (rb - pb) * cheatingFade);
            return `linear-gradient(180deg, rgb(${r},${g},${b}), rgb(${Math.round(r*0.7)},${Math.round(g*0.5)},${Math.round(b*0.5)}))`;
        } else {
            return 'linear-gradient(180deg, #ff6b6b, #c92a2a)';
        }
    }

    _renderPool(poolData) {
        const { poolArea } = this.elements;

        console.log('_renderPool called with:', poolData.length, 'items');

        if (!poolArea) {
            console.error('poolArea is null!');
            return;
        }

        const html = poolData.map(p =>
            `<div class="pool-item wait">${p.value}</div>`
        ).join('');

        poolArea.innerHTML = html;
    }

    _renderEvents(events) {
        const { eventList } = this.elements;

        const recentEvents = events.slice(-50);

        eventList.innerHTML = recentEvents.map((event, i) => {
            let className = 'event-item';
            if (event.includes('成功') || event.includes('配对')) className += ' new';
            else if (event.includes('离婚') || event.includes('争吵')) className += ' error';
            else if (event.includes('踢')) className += ' warning';

            return `<div class="${className}">${event}</div>`;
        }).join('');

        eventList.scrollTop = eventList.scrollHeight;
    }
}