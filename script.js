/**
 * ============================================================================
 * Magic Oceans - Slot Game Core Script (Engineered & Hardened)
 * ============================================================================
 * Architecture:
 * - AudioManager: 사운드 로딩, 재생, 음소거 관리 (기존 에셋 유지)
 * - BubbleSystem: 해저 입체 물방울 파티클 엔진
 * - GameEconomy: 크레딧, 베팅, 당첨 칩 수치 관리 및 환전
 * - SlotMachine: 릴 및 배당 결과 연동 (Confidential Jackpot Engine)
 * - GameUI: DOM 렌더링, GPU 가속(transform) 릴 회전/바운스, 모달 및 메뉴 제어
 * - GameEngine: 상태 머신 무결성 및 오토스핀 무결점 시퀀스 총괄
 * ============================================================================
 */

// ==========================================
// 1. 🔊 Audio Manager
// ==========================================
class AudioManager {
    constructor() {
        this.isSoundOn = true;
        this.soundSpin = new Audio('assets/ReelStart.wav');
        this.soundStop = new Audio('assets/Reelstop.wav');
        this.soundWin = new Audio('assets/hitbell.wav');

        this.soundSpin.loop = true;
        this.soundSpin.preload = 'auto';
        this.soundSpin.volume = 0.45; // 기존 0.56 대비 20% 추가 감소 (0.56 -> 0.45)
        this.soundStop.preload = 'auto';
        this.soundWin.preload = 'auto';
    }

    setSound(enabled) {
        this.isSoundOn = enabled;
        if (!this.isSoundOn) {
            this.stopSpin();
        }
    }

    toggleSound() {
        this.setSound(!this.isSoundOn);
        return this.isSoundOn;
    }

    playSpin() {
        if (!this.isSoundOn) return;
        try {
            this.soundSpin.currentTime = 0;
            this.soundSpin.volume = 0.45; // 기존 0.56에서 20% 추가 감소
            this.soundSpin.play().catch(() => {});
        } catch (e) {}
    }

    stopSpin() {
        try {
            this.soundSpin.pause();
            this.soundSpin.currentTime = 0;
        } catch (e) {}
    }

    playStop() {
        if (!this.isSoundOn) return;
        try {
            const stopInstance = this.soundStop.cloneNode();
            stopInstance.currentTime = 0.04;
            stopInstance.volume = 1.0;
            stopInstance.play().catch(() => {});
        } catch (e) {
            try {
                this.soundStop.currentTime = 0.04;
                this.soundStop.volume = 1.0;
                this.soundStop.play().catch(() => {});
            } catch (err) {}
        }
    }

    playWin() {
        if (!this.isSoundOn) return;
        try {
            this.soundWin.currentTime = 0;
            this.soundWin.play().catch(() => {});
        } catch (e) {}
    }
}

// ==========================================
// 2. 🫧 Bubble System (해저 파티클)
// ==========================================
class BubbleSystem {
    constructor(containerId = 'bubble-container') {
        this.container = document.getElementById(containerId);
        this.timer = null;
    }

    init() {
        if (!this.container) return;

        // 초기 물방울
        for (let i = 0; i < 5; i++) {
            setTimeout(() => this.createBubble(), Math.random() * 2500);
        }

        // 주기적 물방울 생성
        this.timer = setInterval(() => {
            const count = Math.floor(Math.random() * 3) + 1;
            for (let i = 0; i < count; i++) {
                setTimeout(() => this.createBubble(), Math.random() * 1800);
            }
        }, 3000);
    }

    createBubble() {
        if (!this.container) return;

        const bubble = document.createElement('div');
        const sizes = ['bubble-small', 'bubble-medium', 'bubble-large'];
        const randomSize = sizes[Math.floor(Math.random() * sizes.length)];
        bubble.classList.add('bubble', randomSize);

        if (randomSize === 'bubble-large') {
            bubble.style.filter = 'blur(1px)';
            bubble.style.opacity = (Math.random() * 0.3 + 0.3).toFixed(2);
        } else {
            bubble.style.opacity = (Math.random() * 0.2 + 0.4).toFixed(2);
        }

        bubble.style.left = (Math.random() * 90 + 5).toFixed(1) + '%';

        let duration = 6;
        if (randomSize === 'bubble-small') duration = Math.random() * 3 + 5;
        else if (randomSize === 'bubble-medium') duration = Math.random() * 4 + 7;
        else duration = Math.random() * 5 + 9;

        bubble.style.animationDuration = duration.toFixed(1) + 's';
        this.container.appendChild(bubble);

        setTimeout(() => {
            bubble.remove();
        }, duration * 1000);
    }
}

// ==========================================
// 3. 💰 Game Economy (재화 관리)
// ==========================================
class GameEconomy {
    constructor() {
        this.credit = 100000;
        this.bet = 1000;
        this.chip = 0;
        this.lastWin = 0;
    }

    canBet() {
        return this.credit >= this.bet;
    }

    deductBet() {
        if (this.canBet()) {
            this.credit -= this.bet;
            return true;
        }
        return false;
    }

    addWin(amount) {
        this.lastWin = amount;
        this.chip += amount; // 🎯 잭팟 당첨금은 우측 Chip으로 누적
    }

    exchangeChipToCredit(amount = null) {
        const targetAmount = (amount === null || isNaN(amount)) ? this.chip : Math.min(amount, this.chip);
        if (targetAmount <= 0) return 0;
        this.chip -= targetAmount;
        this.credit += targetAmount; // 1:1 환전
        return targetAmount;
    }
}

// ==========================================
// 4. 🎰 Slot Machine (연동 엔진)
// ※ jackpot-config.js의 비밀 기밀 수학 모델 연동
// ==========================================
class SlotMachine {
    constructor() {
        this.secretEngine = (typeof window !== 'undefined' && window.__JackpotSecretEngine) 
            ? window.__JackpotSecretEngine 
            : null;
        this.multipliers = this.secretEngine ? this.secretEngine.multipliers : [1, 2, 3, 4, 5, 10];
    }

    generateSpinResult(betAmount) {
        if (this.secretEngine) {
            return this.secretEngine.generateSpinResult(betAmount);
        }
        // 폴백
        return {
            reels: [1, 2, 3],
            multiplierIndex: 0,
            multiplierValue: 1,
            isWin: false,
            winAmount: 0
        };
    }
}

// ==========================================
// 5. 🎨 Game UI (DOM 조작 및 GPU 가속 연출)
// ==========================================
class GameUI {
    constructor(audio) {
        this.audio = audio;
        this.reels = ['reel1-strip', 'reel2-strip', 'reel3-strip'];
        this.multStripId = 'multiplier-strip';
        this.jackpotLine = document.getElementById('jackpot-line');
        this.winAmountEl = document.getElementById('win-amount');
        this.creditValEl = document.getElementById('credit-val');
        this.chipValEl = document.getElementById('chip-val');
        this.betTextEl = document.getElementById('bet-text');
        this.btnSpinEl = document.getElementById('btn-spin');
        this.btnAutoEl = document.getElementById('btn-auto');
        this.autoMenu = document.getElementById('auto-menu');
        this.sideDrawer = document.getElementById('side-drawer');
        this.menuOverlay = document.getElementById('menu-overlay');
        this.soundStatusText = document.getElementById('sound-status-text');

        this.currentReelSymbols = [1, 1, 1];
        this.currentMultIndex = 0;
        this.multipliersList = [1, 2, 3, 4, 5, 10];
    }

    init(multipliers, onSpinClick, onAutoSelect, onAutoToggle, onMenuAction, onChipClick, onDrawerOpen, onDrawerClose, onExchangeSubmit) {
        this.multipliersList = multipliers || [1, 2, 3, 4, 5, 10];
        this.onDrawerOpen = onDrawerOpen;
        this.onDrawerClose = onDrawerClose;
        this.initMultiplierReel();
        this.initSymbolReels();
        this.bindEvents(onSpinClick, onAutoSelect, onAutoToggle, onMenuAction, onChipClick);
        this.initModals(onExchangeSubmit);
    }

    initMultiplierReel() {
        const strip = document.getElementById(this.multStripId);
        if (!strip) return;

        strip.innerHTML = '';
        strip.style.transform = 'translate3d(0, 0, 0)';
        strip.style.transition = 'none';

        const itemDiv = document.createElement('div');
        itemDiv.className = 'mult-item';
        const img = document.createElement('img');
        img.src = `assets/mult_x1.png`;
        img.onerror = () => { img.src = 'assets/mult_x1.png'; };
        itemDiv.appendChild(img);
        strip.appendChild(itemDiv);

        this.currentMultIndex = 0;
    }

    initSymbolReels() {
        this.reels.forEach((id, index) => {
            const strip = document.getElementById(id);
            if (!strip) return;

            strip.innerHTML = '';
            strip.style.transform = 'translate3d(0, 0, 0)';
            strip.style.transition = 'none';

            const randSym = Math.floor(Math.random() * 12) + 1;
            this.currentReelSymbols[index] = randSym;

            const symDiv = document.createElement('div');
            symDiv.className = 'reel-symbol';
            const img = document.createElement('img');
            img.src = `assets/sym_${String(randSym).padStart(2, '0')}.png`;
            img.onerror = () => { img.src = 'assets/sym_01.png'; };
            symDiv.appendChild(img);
            strip.appendChild(symDiv);
        });
    }

    bindEvents(onSpinClick, onAutoSelect, onAutoToggle, onMenuAction, onChipClick) {
        // 스핀 버튼 클릭 및 3D 물리 타격감 피드백 (오토스핀 버튼과 100% 독립 분리)
        if (this.btnSpinEl) {
            const triggerSpinPress = (e) => {
                if (e && e.stopPropagation) e.stopPropagation();
                if (this.btnSpinEl.classList.contains('disabled')) return;
                this.btnSpinEl.classList.add('pressed');
                if (typeof navigator !== 'undefined' && navigator.vibrate) {
                    try { navigator.vibrate(25); } catch (err) {}
                }
            };
            const releaseSpinPress = (e) => {
                if (e && e.stopPropagation) e.stopPropagation();
                this.btnSpinEl.classList.remove('pressed');
            };

            this.btnSpinEl.addEventListener('pointerdown', triggerSpinPress);
            this.btnSpinEl.addEventListener('pointerup', releaseSpinPress);
            this.btnSpinEl.addEventListener('pointerleave', releaseSpinPress);
            this.btnSpinEl.addEventListener('pointercancel', releaseSpinPress);

            this.btnSpinEl.addEventListener('click', (e) => {
                e.stopPropagation();
                triggerSpinPress();
                setTimeout(releaseSpinPress, 120);
                onSpinClick();
            });
        }

        // 칩 박스 클릭 (환전)
        const chipBox = document.querySelector('.chip-box');
        if (chipBox && onChipClick) {
            chipBox.addEventListener('click', (e) => {
                e.stopPropagation();
                onChipClick();
            });
        }

        // 오토스핀 버튼 클릭 및 타격감 (스핀 버튼과 100% 독립 분리)
        if (this.btnAutoEl) {
            const triggerAutoPress = (e) => {
                if (e && e.stopPropagation) e.stopPropagation();
                if (this.btnAutoEl.classList.contains('disabled')) return;
                this.btnAutoEl.classList.add('pressed');
                if (typeof navigator !== 'undefined' && navigator.vibrate) {
                    try { navigator.vibrate(15); } catch (err) {}
                }
            };
            const releaseAutoPress = (e) => {
                if (e && e.stopPropagation) e.stopPropagation();
                this.btnAutoEl.classList.remove('pressed');
            };

            this.btnAutoEl.addEventListener('pointerdown', triggerAutoPress);
            this.btnAutoEl.addEventListener('pointerup', releaseAutoPress);
            this.btnAutoEl.addEventListener('pointerleave', releaseAutoPress);
            this.btnAutoEl.addEventListener('pointercancel', releaseAutoPress);

            this.btnAutoEl.addEventListener('click', (e) => {
                e.stopPropagation();
                triggerAutoPress();
                setTimeout(releaseAutoPress, 120);
                onAutoToggle();
            });
        }

        // 오토스핀 횟수 옵션 선택
        document.querySelectorAll('.auto-option').forEach(opt => {
            opt.addEventListener('click', (e) => {
                e.stopPropagation();
                const countVal = opt.getAttribute('data-count');
                const count = (countVal === 'Infinity') ? Infinity : parseInt(countVal, 10);
                this.hideAutoMenu();
                onAutoSelect(count);
            });
        });

        // 배경 클릭 시 팝업 닫기
        document.addEventListener('click', () => {
            this.hideAutoMenu();
        });

        // 사이드 메뉴 열기/닫기
        const btnMenu = document.getElementById('btn-menu');
        const btnMenuClose = document.getElementById('btn-menu-close');

        if (btnMenu) btnMenu.addEventListener('click', () => this.openSideDrawer());
        if (btnMenuClose) btnMenuClose.addEventListener('click', () => this.closeSideDrawer());
        if (this.menuOverlay) this.menuOverlay.addEventListener('click', () => this.closeSideDrawer());

        // 사이드 메뉴 항목 클릭
        document.querySelectorAll('.drawer-menu-list .menu-item').forEach(item => {
            item.addEventListener('click', () => {
                const action = item.getAttribute('data-action');
                onMenuAction(action);
            });
        });
    }

    openSideDrawer() {
        if (this.sideDrawer) this.sideDrawer.classList.add('show');
        if (this.menuOverlay) this.menuOverlay.classList.add('show');
        if (typeof this.onDrawerOpen === 'function') this.onDrawerOpen();
    }

    closeSideDrawer() {
        if (this.sideDrawer) this.sideDrawer.classList.remove('show');
        if (this.menuOverlay) this.menuOverlay.classList.remove('show');
        if (typeof this.onDrawerClose === 'function') this.onDrawerClose();
    }

    initModals(onExchangeSubmit) {
        // Exchange 모달 이벤트
        const btnExClose = document.getElementById('btn-exchange-close');
        const exModal = document.getElementById('exchange-modal-overlay');
        if (btnExClose) btnExClose.addEventListener('click', () => this.closeExchangeModal());
        if (exModal) {
            exModal.addEventListener('click', (e) => {
                if (e.target === exModal) this.closeExchangeModal();
            });
        }

        // Paytable 모달 이벤트
        const btnPtClose = document.getElementById('btn-paytable-close');
        const ptModal = document.getElementById('paytable-modal-overlay');
        if (btnPtClose) btnPtClose.addEventListener('click', () => this.closePaytableModal());
        if (ptModal) {
            ptModal.addEventListener('click', (e) => {
                if (e.target === ptModal) this.closePaytableModal();
            });
        }

        // Exchange 50% / 전액 퀵 버튼
        const btnHalf = document.getElementById('btn-exchange-half');
        const btnAll = document.getElementById('btn-exchange-all');
        const inputAmount = document.getElementById('exchange-modal-input');

        if (btnHalf && inputAmount) {
            btnHalf.addEventListener('click', () => {
                const currentSp = this.currentExchangeSp || 0;
                inputAmount.value = Math.floor(currentSp / 2);
            });
        }

        if (btnAll && inputAmount) {
            btnAll.addEventListener('click', () => {
                const currentSp = this.currentExchangeSp || 0;
                inputAmount.value = currentSp;
            });
        }

        // Exchange 실행 제출
        const btnSubmit = document.getElementById('btn-exchange-submit');
        if (btnSubmit && inputAmount && onExchangeSubmit) {
            btnSubmit.addEventListener('click', () => {
                const val = parseInt(inputAmount.value, 10);
                if (isNaN(val) || val <= 0) {
                    alert('올바른 환전 수량을 숫자로 입력해주세요.');
                    return;
                }
                onExchangeSubmit(val);
            });
        }
    }

    openExchangeModal(currentSp) {
        this.currentExchangeSp = currentSp;
        const modal = document.getElementById('exchange-modal-overlay');
        const spEl = document.getElementById('exchange-modal-sp');
        const input = document.getElementById('exchange-modal-input');
        if (spEl) spEl.textContent = currentSp.toLocaleString() + ' SP';
        if (input) input.value = currentSp;
        if (modal) modal.classList.add('show');
    }

    closeExchangeModal() {
        const modal = document.getElementById('exchange-modal-overlay');
        if (modal) modal.classList.remove('show');
    }

    openPaytableModal() {
        const modal = document.getElementById('paytable-modal-overlay');
        if (modal) modal.classList.add('show');
    }

    closePaytableModal() {
        const modal = document.getElementById('paytable-modal-overlay');
        if (modal) modal.classList.remove('show');
    }

    toggleAutoMenu() {
        if (this.autoMenu) this.autoMenu.classList.toggle('show');
    }

    hideAutoMenu() {
        if (this.autoMenu) this.autoMenu.classList.remove('show');
    }

    setAutoSpinActive(isActive) {
        if (this.btnAutoEl) {
            this.btnAutoEl.classList.toggle('active', isActive);
        }
    }

    setButtonsDisabled(disabled, isAutoRunning = false) {
        if (this.btnSpinEl) {
            this.btnSpinEl.classList.toggle('disabled', disabled);
        }
        if (this.btnAutoEl && !isAutoRunning) {
            this.btnAutoEl.classList.toggle('disabled', disabled);
        }
    }

    updateEconomyDisplay(economy) {
        if (this.creditValEl) this.creditValEl.textContent = economy.credit.toLocaleString();
        if (this.chipValEl) this.chipValEl.textContent = economy.chip.toLocaleString() + ' SP';
        if (this.betTextEl) this.betTextEl.textContent = 'BET ' + economy.bet.toLocaleString();
    }

    setWinDisplay(amount) {
        if (!this.winAmountEl) return;
        const text = typeof amount === 'number' ? amount.toLocaleString() : String(amount);
        this.updateWinAmountText(text);
    }

    updateWinAmountText(text) {
        if (!this.winAmountEl) return;
        this.winAmountEl.textContent = text;
        const len = text.length;
        if (len > 12) {
            this.winAmountEl.style.fontSize = '1.55vh';
        } else if (len > 9) {
            this.winAmountEl.style.fontSize = '1.82vh';
        } else {
            this.winAmountEl.style.fontSize = '';
        }
    }

    updateSoundStatus(isOn) {
        if (this.soundStatusText) {
            this.soundStatusText.textContent = isOn ? 'ON' : 'OFF';
            this.soundStatusText.classList.toggle('off', !isOn);
        }
    }

    /**
     * 🚀 GPU 가속(transform) 기반 릴 회전 및 탄성 감속 착지 시퀀스
     */
    async executeSpinSequence(result, onReelStop, onMultStop) {
        const multPromise = this.spinMultiplierReel(result.multiplierIndex, onMultStop);
        const reelsPromise = this.spinReelsSequence(result.reels, onReelStop);
        await Promise.all([multPromise, reelsPromise]);
    }

    spinReelsSequence(targetReels, onReelStop) {
        return new Promise((resolve) => {
            // 🎯 대표님 황금 박자 모델 (방안 A): 1번 릴 36개(3바퀴)/1.8초, 2번 44개/2.2초, 3번 52개/2.6초
            const reelDurations = [1.8, 2.2, 2.6];
            const blurCountPerReel = [36, 44, 52];
            let completed = 0;

            this.reels.forEach((id, index) => {
                const strip = document.getElementById(id);
                if (!strip) {
                    completed++;
                    if (completed === 3) resolve();
                    return;
                }

                const currentSym = this.currentReelSymbols[index] || 1;
                const targetSym = targetReels[index];
                const count = blurCountPerReel[index];
                const duration = reelDurations[index];

                // 1. 위에서 아래로 회전하기 위한 스트립 구축 (타겟 심볼 -> 잔상 심볼들 -> 현재 심볼)
                strip.innerHTML = '';
                strip.style.transition = 'none';

                // [0] 최상단: 최종 착지 타겟 심볼
                const targetDiv = document.createElement('div');
                targetDiv.className = 'reel-symbol';
                targetDiv.innerHTML = `<img src="assets/sym_${String(targetSym).padStart(2, '0')}.png">`;
                strip.appendChild(targetDiv);

                // [1 ~ count-1] 중간 회전 잔상 심볼
                for (let i = 1; i < count; i++) {
                    const rand = Math.floor(Math.random() * 12) + 1;
                    const midDiv = document.createElement('div');
                    midDiv.className = 'reel-symbol';
                    midDiv.innerHTML = `<img src="assets/sym_${String(rand).padStart(2, '0')}.png">`;
                    strip.appendChild(midDiv);
                }

                // [count] 최하단: 현재 표시 중이던 심볼
                const currentDiv = document.createElement('div');
                currentDiv.className = 'reel-symbol';
                currentDiv.innerHTML = `<img src="assets/sym_${String(currentSym).padStart(2, '0')}.png">`;
                strip.appendChild(currentDiv);

                const itemHeight = strip.parentElement.clientHeight || 75;
                const targetOffset = count * itemHeight;

                // 2. 현재 심볼이 화면에 보이도록 스트립을 상단(-targetOffset)으로 대기 배치
                strip.style.transform = `translate3d(0, -${targetOffset}px, 0)`;
                void strip.offsetHeight; // 강제 리플로우

                // 3. 위에서 아래로(0px) 쏟아져 내리며 쫀득하게 탄성 착지
                strip.style.transition = `transform ${duration}s cubic-bezier(0.12, 0.82, 0.35, 1.05)`;
                strip.style.transform = 'translate3d(0, 0, 0)';

                // 4. 착지 타이밍 핸들링
                setTimeout(() => {
                    if (typeof onReelStop === 'function') {
                        onReelStop(index);
                    }

                    // 착지 안정화 후 DOM 정돈
                    strip.style.transition = 'none';
                    strip.innerHTML = '';
                    const finalDiv = document.createElement('div');
                    finalDiv.className = 'reel-symbol';
                    finalDiv.innerHTML = `<img src="assets/sym_${String(targetSym).padStart(2, '0')}.png">`;
                    strip.appendChild(finalDiv);
                    strip.style.transform = 'translate3d(0, 0, 0)';
                    this.currentReelSymbols[index] = targetSym;

                    completed++;
                    if (completed === 3) {
                        resolve();
                    }
                }, duration * 1000);
            });
        });
    }

    spinMultiplierReel(targetMultIndex, onMultStop) {
        return new Promise((resolve) => {
            const strip = document.getElementById(this.multStripId);
            if (!strip) {
                resolve();
                return;
            }

            const itemHeight = strip.parentElement.clientHeight || 25;
            const currentMultIndex = this.currentMultIndex || 0;
            const currentVal = this.multipliersList[currentMultIndex] || 1;
            const targetVal = this.multipliersList[targetMultIndex] || 1;
            const baseLoops = 36; // 36개 배당 심볼 맹렬한 회전
            const duration = 3.4; // 🎯 대표님 지정 (방안 A): 정확히 3.4초에 피날레 콰광 착지 (3번 릴 2.6초 후 0.8초 뒤)

            // 1. 위에서 아래로 회전하기 위한 스트립 구축 (타겟 배당 -> 잔상 배당들 -> 현재 배당)
            strip.innerHTML = '';
            strip.style.transition = 'none';

            // [0] 최상단: 최종 착지 타겟 배당
            const targetDiv = document.createElement('div');
            targetDiv.className = 'mult-item';
            targetDiv.innerHTML = `<img src="assets/mult_x${targetVal}.png">`;
            strip.appendChild(targetDiv);

            // [1 ~ baseLoops-1] 중간 회전 잔상 배당
            for (let i = 1; i < baseLoops; i++) {
                const randVal = this.multipliersList[Math.floor(Math.random() * this.multipliersList.length)];
                const midDiv = document.createElement('div');
                midDiv.className = 'mult-item';
                midDiv.innerHTML = `<img src="assets/mult_x${randVal}.png">`;
                strip.appendChild(midDiv);
            }

            // [baseLoops] 최하단: 현재 표시 중이던 배당
            const currentDiv = document.createElement('div');
            currentDiv.className = 'mult-item';
            currentDiv.innerHTML = `<img src="assets/mult_x${currentVal}.png">`;
            strip.appendChild(currentDiv);

            const targetOffset = baseLoops * itemHeight;

            // 2. 현재 배당이 화면에 보이도록 스트립을 상단(-targetOffset)으로 대기 배치
            strip.style.transform = `translate3d(0, -${targetOffset}px, 0)`;
            void strip.offsetHeight; // 강제 리플로우

            // 3. 위에서 아래로(0px) 쏟아져 내리며 쫀득하게 탄성 착지
            strip.style.transition = `transform ${duration}s cubic-bezier(0.12, 0.85, 0.32, 1.08)`;
            strip.style.transform = 'translate3d(0, 0, 0)';

            setTimeout(() => {
                if (typeof onMultStop === 'function') {
                    onMultStop();
                }

                // 착지 안정화 후 DOM 정돈
                strip.style.transition = 'none';
                strip.innerHTML = '';
                const finalDiv = document.createElement('div');
                finalDiv.className = 'mult-item';
                finalDiv.innerHTML = `<img src="assets/mult_x${targetVal}.png">`;
                strip.appendChild(finalDiv);
                strip.style.transform = 'translate3d(0, 0, 0)';
                this.currentMultIndex = targetMultIndex;

                resolve();
            }, duration * 1000);
        });
    }

    showWinAnimation(amount) {
        if (this.jackpotLine) {
            this.jackpotLine.classList.add('active');
        }

        if (this.winAmountEl) {
            this.winAmountEl.classList.add('highlight');
            this.animateNumberRollup(this.winAmountEl, 0, amount, 600);
        }
    }

    clearWinAnimation() {
        if (this.jackpotLine) {
            this.jackpotLine.classList.remove('active');
        }
        if (this.winAmountEl) {
            this.winAmountEl.classList.remove('highlight');
        }
    }

    animateNumberRollup(element, start, end, duration) {
        const startTime = performance.now();
        const update = (now) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const current = Math.floor(start + (end - start) * progress);
            this.updateWinAmountText(current.toLocaleString());
            if (progress < 1) {
                requestAnimationFrame(update);
            } else {
                this.updateWinAmountText(end.toLocaleString());
            }
        };
        requestAnimationFrame(update);
    }
}

// ==========================================
// 6. 🎁 Recharge Manager (일일 충전 및 리워드 광고)
// ==========================================
class RechargeManager {
    constructor(economy, ui) {
        this.economy = economy;
        this.ui = ui;
        this.MAX_DAILY_RECHARGE = 5; // 👑 대표님 결정: 1일 최대 5회
        this.RECHARGE_AMOUNT = 100000; // 👑 1회당 100,000 Point 지급 (100회 스핀)
        this.STORAGE_KEY = 'magic_oceans_daily_recharge';
        this.countdownTimer = null;
    }

    getTodayDateString() {
        // 🌍 글로벌 표준: 협정 세계시(UTC 00:00 자정 = 한국 시간 매일 오전 09:00) 기준 리셋
        try {
            return new Intl.DateTimeFormat('en-CA', {
                timeZone: 'UTC',
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            }).format(new Date());
        } catch (e) {
            return new Date().toISOString().slice(0, 10);
        }
    }

    getTimeUntilNextUtcMidnight() {
        const now = new Date();
        const nextMidnight = new Date(Date.UTC(
            now.getUTCFullYear(),
            now.getUTCMonth(),
            now.getUTCDate() + 1,
            0, 0, 0
        ));
        const diffMs = Math.max(0, nextMidnight.getTime() - now.getTime());
        const hours = Math.floor(diffMs / 3600000);
        const minutes = Math.floor((diffMs % 3600000) / 60000);
        const seconds = Math.floor((diffMs % 60000) / 1000);
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    getRecord() {
        try {
            const raw = localStorage.getItem(this.STORAGE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed.date === this.getTodayDateString()) {
                    return parsed;
                }
            }
        } catch (e) {}

        const fresh = { date: this.getTodayDateString(), count: 0 };
        this.saveRecord(fresh);
        return fresh;
    }

    saveRecord(record) {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(record));
        } catch (e) {}
    }

    getRemaining() {
        const record = this.getRecord();
        return Math.max(0, this.MAX_DAILY_RECHARGE - record.count);
    }

    updateBadge() {
        const remaining = this.getRemaining();
        const badge = document.getElementById('recharge-badge');
        if (badge) {
            if (remaining > 0) {
                badge.textContent = `${remaining}/${this.MAX_DAILY_RECHARGE}`;
                badge.classList.remove('empty');
            } else {
                badge.textContent = `0/5 (⏳ ${this.getTimeUntilNextUtcMidnight()})`;
                badge.classList.add('empty');
            }
        }
    }

    startCountdown() {
        this.stopCountdown();
        this.updateBadge();
        this.countdownTimer = setInterval(() => {
            this.updateBadge();
        }, 1000);
    }

    stopCountdown() {
        if (this.countdownTimer) {
            clearInterval(this.countdownTimer);
            this.countdownTimer = null;
        }
    }

    handleRecharge() {
        const record = this.getRecord();

        // 1. 일일 한도(5회) 초과 시
        if (record.count >= this.MAX_DAILY_RECHARGE) {
            alert(`[일일 충전 완료]\n오늘의 일일 무료 충전(${this.MAX_DAILY_RECHARGE}회)을 모두 완료하셨습니다!\n글로벌 표준시(UTC) 자정 / 한국 시간 매일 오전 09:00에 다시 충전됩니다.`);
            return;
        }

        // 2. 1회차: 100% 무광고 즉시 지급 (데일리 보너스)
        if (record.count === 0) {
            record.count = 1;
            this.saveRecord(record);
            this.economy.credit += this.RECHARGE_AMOUNT;
            this.ui.updateEconomyDisplay(this.economy);
            this.updateBadge();

            alert(
                `[🎁 데일리 첫 충전 선물]\n오늘의 첫 충전 보너스로 광고 없이 ${this.RECHARGE_AMOUNT.toLocaleString()} Point가 즉시 충전되었습니다!\n\n(오늘 남은 리워드 충전: ${this.getRemaining()}/${this.MAX_DAILY_RECHARGE}회)`
            );
            return;
        }

        // 3. 2회차 ~ 5회차 (4회): 보상형 리워드 광고 시청 후 지급
        const doWatch = confirm(
            `[🎬 보상형 동영상 광고 충전]\n동영상 광고를 시청하고 ${this.RECHARGE_AMOUNT.toLocaleString()} Point를 충전하시겠습니까?\n\n- 오늘 남은 충전 기회: ${this.getRemaining()}/${this.MAX_DAILY_RECHARGE}회`
        );

        if (!doWatch) return;

        // 리워드 광고 재생 (배포 시 구글 AdMob SDK 자동 연결)
        this.showRewardedAd(() => {
            record.count += 1;
            this.saveRecord(record);
            this.economy.credit += this.RECHARGE_AMOUNT;
            this.ui.updateEconomyDisplay(this.economy);
            this.updateBadge();

            alert(
                `[🎉 충전 완료]\n광고 시청이 완료되어 ${this.RECHARGE_AMOUNT.toLocaleString()} Point가 정상 지급되었습니다!\n\n(오늘 남은 충전: ${this.getRemaining()}/${this.MAX_DAILY_RECHARGE}회)`
            );
        });
    }

    showRewardedAd(onRewardGranted) {
        // 구글 애드몹 네이티브 SDK 브릿지 (앱 환경)
        if (typeof window.AdMob !== 'undefined' && window.AdMob.showRewardVideoAd) {
            window.AdMob.showRewardVideoAd({
                onSuccess: () => onRewardGranted(),
                onFailure: () => alert('광고 로딩에 실패했습니다. 잠시 후 다시 시도해주세요.')
            });
            return;
        }

        // 웹 & 개발 환경용 3초 고품격 광고 시뮬레이션 모달
        const overlay = document.getElementById('ad-modal-overlay');
        const fill = document.getElementById('ad-progress-fill');
        const timer = document.getElementById('ad-timer');

        if (!overlay) {
            onRewardGranted();
            return;
        }

        overlay.classList.add('show');
        if (fill) {
            fill.style.transition = 'none';
            fill.style.width = '0%';
        }
        if (timer) timer.textContent = '3s';

        let timeLeft = 3;
        void overlay.offsetHeight;

        if (fill) {
            fill.style.transition = 'width 3s linear';
            fill.style.width = '100%';
        }

        const countdownInterval = setInterval(() => {
            timeLeft--;
            if (timer) timer.textContent = `${timeLeft}s`;

            if (timeLeft <= 0) {
                clearInterval(countdownInterval);
                setTimeout(() => {
                    overlay.classList.remove('show');
                    if (fill) {
                        fill.style.transition = 'none';
                        fill.style.width = '0%';
                    }
                    onRewardGranted();
                }, 350);
            }
        }, 1000);
    }
}

// ==========================================
// 7. ⚙️ Game Engine (게임 상태 및 시퀀스)
// ==========================================
class GameEngine {
    constructor(economy, slotMachine, ui, audio) {
        this.economy = economy;
        this.slotMachine = slotMachine;
        this.ui = ui;
        this.audio = audio;
        this.rechargeManager = null;

        this.state = 'IDLE'; // IDLE, SPINNING, STOPPING, RESULT
        this.isAutoSpinning = false;
        this.autoSpinRemaining = 0;
        this.autoSpinTimer = null;
    }

    init() {
        this.rechargeManager = new RechargeManager(this.economy, this.ui);
        this.ui.init(
            this.slotMachine.multipliers,
            () => this.onSpinClick(),
            (count) => this.startAutoSpin(count),
            () => this.onAutoToggleClick(),
            (action) => this.handleMenuAction(action),
            () => this.onChipBoxClick(),
            () => this.rechargeManager.startCountdown(),
            () => this.rechargeManager.stopCountdown(),
            (amount) => this.handleExchangeSubmit(amount)
        );
        this.ui.updateEconomyDisplay(this.economy);
        this.ui.setWinDisplay(0);
        this.rechargeManager.updateBadge();
        this.updateShareBonusBadge();
    }

    onChipBoxClick() {
        if (this.state !== 'IDLE') {
            alert('스핀 진행 중에는 환전할 수 없습니다.');
            return;
        }
        if (this.economy.chip <= 0) {
            alert('현재 보유 중인 당첨 SP가 0개입니다.\n릴을 돌려 잭팟 SP를 획득해보세요!');
            return;
        }
        this.ui.openExchangeModal(this.economy.chip);
    }

    handleExchangeSubmit(amount) {
        if (amount > this.economy.chip) {
            alert(`보유 SP(${this.economy.chip.toLocaleString()} SP)보다 많은 수량을 환전할 수 없습니다.`);
            return;
        }
        const exchanged = this.economy.exchangeChipToCredit(amount);
        this.ui.updateEconomyDisplay(this.economy);
        this.ui.closeExchangeModal();
        this.audio.playWin();
        alert(`[환전 완료]\n${exchanged.toLocaleString()} SP가 ${exchanged.toLocaleString()} Point로 정상 환전되었습니다!`);
    }

    getShareBonusRecord() {
        const today = this.rechargeManager.getTodayDateString();
        try {
            const raw = localStorage.getItem('magic_oceans_daily_share_bonus');
            if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed.date === today) {
                    return parsed;
                }
            }
        } catch (e) {}
        return { date: today, claimed: false };
    }

    saveShareBonusRecord(record) {
        try {
            localStorage.setItem('magic_oceans_daily_share_bonus', JSON.stringify(record));
        } catch (e) {}
    }

    updateShareBonusBadge() {
        const badge = document.getElementById('share-bonus-badge');
        if (!badge) return;
        const record = this.getShareBonusRecord();
        if (record.claimed) {
            badge.textContent = '완료 ✓';
            badge.classList.add('claimed');
        } else {
            badge.textContent = '+100,000P 🎁';
            badge.classList.remove('claimed');
        }
    }

    handleShareAction() {
        const qrCard = document.getElementById('qr-container-card');
        const toggleBadge = document.getElementById('qr-toggle-badge');
        if (qrCard) {
            const isHidden = qrCard.style.display === 'none';
            qrCard.style.display = isHidden ? 'flex' : 'none';
            if (toggleBadge) toggleBadge.textContent = isHidden ? 'QR ▲' : 'QR ▼';
        }

        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(window.location.href);
            }
        } catch (e) {}

        if (navigator.share) {
            navigator.share({
                title: 'Magic Oceans Slot',
                text: '신비로운 바다 슬롯 머신 Magic Oceans를 플레이해보세요! 최대 2,000배 잭팟!',
                url: window.location.href
            }).catch(() => {});
        }

        const record = this.getShareBonusRecord();
        if (!record.claimed) {
            record.claimed = true;
            this.saveShareBonusRecord(record);
            this.economy.credit += 100000;
            this.ui.updateEconomyDisplay(this.economy);
            this.updateShareBonusBadge();
            this.audio.playWin();

            alert(
                '[🎉 데일리 앱 공유 보너스]\n앱을 공유해주셔서 대단히 감사합니다!\n\n🎁 데일리 보너스 100,000 Point가 즉시 지급되었습니다!\n\n(다음 공유 보너스는 매일 한국시간 오전 09:00에 다시 충전됩니다)'
            );
        } else {
            alert(
                '[게임 공유]\n게임 링크가 클립보드에 복사되었습니다!\n(오늘의 데일리 공유 보너스 100,000 Point는 이미 수령하셨습니다.)'
            );
        }
    }

    onSpinClick() {
        if (this.isAutoSpinning) {
            this.stopAutoSpin();
            return;
        }
        this.spin();
    }

    onAutoToggleClick() {
        if (this.isAutoSpinning) {
            this.stopAutoSpin();
        } else {
            this.ui.toggleAutoMenu();
        }
    }

    async spin(onComplete) {
        if (this.state !== 'IDLE') return;

        // 1. 베팅액 차감 검사 (Point 부족 시 스마트 환전 안내)
        if (!this.economy.canBet()) {
            if (this.economy.chip >= this.economy.bet) {
                const doExchange = confirm(
                    `[Point 부족 알림]\n현재 Point가 부족합니다 (${this.economy.credit.toLocaleString()} Point).\n보유 중인 당첨금(${this.economy.chip.toLocaleString()} SP)을 Point로 즉시 환전하시겠습니까? (1 SP = 1 Point)`
                );
                if (doExchange) {
                    const exchanged = this.economy.exchangeChipToCredit(this.economy.chip);
                    this.ui.updateEconomyDisplay(this.economy);
                    alert(`[환전 완료] ${exchanged.toLocaleString()} SP가 전액 Point로 환전되었습니다! 스핀을 진행합니다.`);
                } else {
                    this.stopAutoSpin();
                    return;
                }
            } else {
                const remaining = this.rechargeManager ? this.rechargeManager.getRemaining() : 0;
                if (remaining > 0) {
                    const doRecharge = confirm(
                        `Point와 보유 SP가 모두 부족합니다.\n[무료 충전]을 통해 100,000 Point를 충전하시겠습니까? (오늘 남은 횟수: ${remaining}/5회)`
                    );
                    if (doRecharge && this.rechargeManager) {
                        this.rechargeManager.handleRecharge();
                    }
                } else {
                    alert('Point와 보유 SP가 부족하며, 오늘의 일일 충전 한도(5회)를 모두 소진하셨습니다.\n글로벌 표준시(UTC) 자정 / 한국 시간 매일 오전 09:00에 다시 충전됩니다!');
                }
                this.stopAutoSpin();
                return;
            }
        }

        this.economy.deductBet();
        if (typeof window !== 'undefined' && window.avatarSystem && window.avatarSystem.profile) {
            window.avatarSystem.profile.recordSpin();
        }
        this.state = 'SPINNING';
        this.ui.setButtonsDisabled(true, this.isAutoSpinning);
        this.ui.updateEconomyDisplay(this.economy);
        this.ui.clearWinAnimation();
        this.ui.setWinDisplay(0);

        // 2. 결과 사전 생성 (기밀 수학 모델 연동)
        const result = this.slotMachine.generateSpinResult(this.economy.bet);

        // 3. 사운드 및 GPU 가속 회전 시작
        this.audio.playSpin();

        await this.ui.executeSpinSequence(
            result,
            (reelIdx) => {
                // 일반 릴은 마지막 릴(reelIdx === 2)이 멈출 때에만 정지 효과음 재생 및 회전음 정지
                if (reelIdx === 2) {
                    this.audio.stopSpin();
                    this.audio.playStop();
                }
            },
            () => {
                this.audio.playStop(); // 배당 숫자릴 정지음 유지
            }
        );

        // 4. 당첨 판정 및 연출
        await this.handleResultSequence(result);

        this.state = 'IDLE';
        this.ui.setButtonsDisabled(false, this.isAutoSpinning);

        if (typeof onComplete === 'function') {
            onComplete();
        }
    }

    async handleResultSequence(result) {
        await new Promise(r => setTimeout(r, 200));

        if (result.isWin) {
            this.economy.addWin(result.winAmount);
            if (typeof window !== 'undefined' && window.avatarSystem && window.avatarSystem.profile) {
                window.avatarSystem.profile.recordWin(result.winAmount);
                if (result.winAmount >= 100000) {
                    window.avatarSystem.triggerJackpotTicker(
                        window.avatarSystem.profile.state.username,
                        result.winAmount,
                        result.winAmount >= 1000000 ? 'MEGA JACKPOT' : 'SUPER JACKPOT'
                    );
                }
            }
            this.ui.showWinAnimation(result.winAmount);
            this.audio.playWin();
            this.ui.updateEconomyDisplay(this.economy);
            // 당첨 연출 감상 시간
            await new Promise(r => setTimeout(r, 900));
        }
    }

    startAutoSpin(count) {
        if (this.isAutoSpinning) return;

        this.isAutoSpinning = true;
        this.autoSpinRemaining = count;
        this.ui.setAutoSpinActive(true);

        this.runNextAutoSpin();
    }

    runNextAutoSpin() {
        if (!this.isAutoSpinning || this.autoSpinRemaining <= 0) {
            this.stopAutoSpin();
            return;
        }

        // 상태 머신 방어: 스핀 중이면 300ms 후 재확인 (교착 방지)
        if (this.state !== 'IDLE') {
            this.autoSpinTimer = setTimeout(() => {
                if (this.isAutoSpinning) {
                    this.runNextAutoSpin();
                }
            }, 300);
            return;
        }

        if (this.autoSpinRemaining !== Infinity) {
            this.autoSpinRemaining--;
        }

        this.spin(() => {
            if (this.isAutoSpinning) {
                this.autoSpinTimer = setTimeout(() => {
                    if (this.isAutoSpinning) {
                        this.runNextAutoSpin();
                    }
                }, 600);
            }
        });
    }

    stopAutoSpin() {
        this.isAutoSpinning = false;
        this.autoSpinRemaining = 0;
        if (this.autoSpinTimer) {
            clearTimeout(this.autoSpinTimer);
            this.autoSpinTimer = null;
        }
        this.ui.setAutoSpinActive(false);
        this.ui.setButtonsDisabled(false, false);
    }

    handleMenuAction(action) {
        switch (action) {
            case 'login': {
                alert('[Login (Join Membership)]\n회원가입 및 로그인 페이지 준비 중입니다.');
                this.ui.closeSideDrawer();
                break;
            }
            case 'free-recharge': {
                if (this.rechargeManager) {
                    this.rechargeManager.handleRecharge();
                }
                this.ui.closeSideDrawer();
                break;
            }
            case 'exchange': {
                this.ui.closeSideDrawer();
                this.onChipBoxClick();
                break;
            }
            case 'paytable': {
                this.ui.closeSideDrawer();
                this.ui.openPaytableModal();
                break;
            }
            case 'sound': {
                const isOn = this.audio.toggleSound();
                this.ui.updateSoundStatus(isOn);
                return; // 사운드 토글 시 드로어 유지
            }
            case 'share-qr': {
                this.handleShareAction();
                return; // QR 코드 및 보너스 확인을 위해 드로어 유지
            }
            case 'leave-membership': {
                if (confirm('[Membership Withdrawal]\n정말 회원 탈퇴를 진행하시겠습니까?\n탈퇴 시 보유 중인 모든 Point 및 당첨금(SP) 기록이 초기화됩니다.')) {
                    alert('회원 탈퇴 처리가 완료되었습니다.');
                }
                this.ui.closeSideDrawer();
                break;
            }
            case 'exit': {
                if (confirm('Magic Oceans 게임을 종료하시겠습니까?')) {
                    try {
                        window.close();
                    } catch (e) {}
                    alert('브라우저 탭을 닫아 게임을 종료하실 수 있습니다.');
                }
                this.ui.closeSideDrawer();
                break;
            }
        }
    }
}

// ==========================================
// 🚀 앱 부트스트랩 (전역 네임스페이스 오염 방지)
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const audio = new AudioManager();
    const bubbles = new BubbleSystem('bubble-container');
    const economy = new GameEconomy();
    const slotMachine = new SlotMachine();
    const ui = new GameUI(audio);
    const engine = new GameEngine(economy, slotMachine, ui, audio);

    bubbles.init();
    engine.init();

    // 🛡️ 보안 강화: window.gameEngine 전역 노출을 차단하여 콘솔 치팅 방어
});