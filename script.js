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
        this.soundSpin = new Audio('assets/sounds/ReelStart.wav');
        this.soundStop = new Audio('assets/sounds/Reelstop.wav');
        this.soundWin = new Audio('assets/sounds/hitbell.wav');

        // 💧 [대표님 지시] 평상시 대기(Idle) 물방울 앰비언스 사운드
        this.soundAmbientWater = new Audio('assets/sounds/waterdrop.wav');
        this.soundAmbientWater.preload = 'auto';
        this.soundAmbientWater.volume = 0.28; // 은은하고 신비로운 해저 동굴 볼륨

        this.ambientTimer = null;
        this.isAmbientActive = false; // 대기 상태 앰비언스 활성화 플래그
        this.isUnlocked = false;      // 브라우저 Autoplay 언락 플래그

        this.soundSpin.loop = true;
        this.soundSpin.preload = 'auto';
        this.soundSpin.volume = 0.22; // [대표님 지시] 릴 회전음 50% 감쇠 (0.45 -> 0.22)
        this.soundStop.preload = 'auto';
        this.soundWin.preload = 'auto';
        this.soundWin.volume = 0.85;

        // 💧 물방울 사운드 재생 종료 시, 대기 상태라면 5~8초 불규칙 인터벌 후 다음 물방울 스케줄링
        this.soundAmbientWater.addEventListener('ended', () => {
            if (this.isAmbientActive && this.isSoundOn) {
                this.scheduleNextWaterdrop();
            }
        });

        // 🎵 [대표님 지정] 12종 심볼별 맞춤 당첨 사운드 맵
        // 2번 조커: JokerNoHit.wav
        // 6번 타겟: pang_0000.wav
        // 1번 체리, 3번 조개 & 진주, 5번 불가사리: BONUS11.wav
        // 7번, 8번, 9번 BAR 종류: laser.wav
        // 11번("-") 다이아몬드, 12번("=") 스페이드 A: belt_itemreel.wav
        // 4번 골든 벨, 10번 행운의 7: hitbell.wav (정통 타종음 보존)
        const soundConfigs = {
            'assets/sounds/BONUS11.wav': { volume: 0.9 },
            'assets/sounds/JokerNoHit.wav': { volume: 0.85 },
            'assets/sounds/hitbell.wav': { volume: 0.85 },
            'assets/sounds/pang_0000.wav': { volume: 0.75 },
            'assets/sounds/laser.wav': { volume: 0.95 },
            'assets/sounds/belt_itemreel.wav': { volume: 1.0 }
        };

        this.audioCache = {};
        for (const [path, cfg] of Object.entries(soundConfigs)) {
            const audio = new Audio(path);
            audio.preload = 'auto';
            audio.volume = cfg.volume || 0.85;
            this.audioCache[path] = audio;
        }

        this.symbolSoundMap = {
            1: 'assets/sounds/BONUS11.wav',
            2: 'assets/sounds/JokerNoHit.wav',
            3: 'assets/sounds/BONUS11.wav',
            4: 'assets/sounds/hitbell.wav',
            5: 'assets/sounds/BONUS11.wav',
            6: 'assets/sounds/pang_0000.wav',
            7: 'assets/sounds/laser.wav',
            8: 'assets/sounds/laser.wav',
            9: 'assets/sounds/laser.wav',
            10: 'assets/sounds/hitbell.wav',
            11: 'assets/sounds/belt_itemreel.wav',
            12: 'assets/sounds/belt_itemreel.wav'
        };
    }

    // 💧 첫 유저 인터랙션 시 오디오 언락
    unlockAudio() {
        if (this.isUnlocked) return;
        this.isUnlocked = true;
        if (this.isAmbientActive && this.isSoundOn && !this.ambientTimer) {
            this.scheduleNextWaterdrop(1500); // 첫 터치 후 1.5초 뒤 자연스러운 첫 물방울
        }
    }

    // 💧 평상시 대기(Idle) 상태 진입 시 앰비언스 가동
    startIdleAmbience() {
        this.isAmbientActive = true;
        if (!this.isSoundOn) return;
        if (this.ambientTimer) return; // 이미 예약된 타이머가 있으면 중복 방지

        // 대기 진입 시 2.5초 대기 후 첫 물방울, 이후 5~8초 불규칙 인터벌
        this.scheduleNextWaterdrop(2500);
    }

    // 💧 릴 회전, 게임 진행, 오토스핀 시 앰비언스 즉시 전면 중지 (재생 절대 금지)
    stopIdleAmbience() {
        this.isAmbientActive = false;
        if (this.ambientTimer) {
            clearTimeout(this.ambientTimer);
            this.ambientTimer = null;
        }
        try {
            this.soundAmbientWater.pause();
            this.soundAmbientWater.currentTime = 0;
        } catch (e) {}
    }

    // 💧 5~8초 불규칙 인터벌 스케줄러 (대표님 지정 방안 A)
    scheduleNextWaterdrop(customDelay = null) {
        if (this.ambientTimer) {
            clearTimeout(this.ambientTimer);
            this.ambientTimer = null;
        }
        if (!this.isAmbientActive || !this.isSoundOn) return;

        // 5초 ~ 8초 사이의 불규칙한(Random) 간격
        const delay = (customDelay !== null) ? customDelay : (5000 + Math.random() * 3000);

        this.ambientTimer = setTimeout(() => {
            this.ambientTimer = null;
            if (!this.isAmbientActive || !this.isSoundOn) return;

            try {
                this.soundAmbientWater.currentTime = 0;
                const p = this.soundAmbientWater.play();
                if (p !== undefined) {
                    p.catch(() => {
                        // 브라우저 정책으로 차단된 경우 대기 상태라면 4초 후 재시도
                        if (this.isAmbientActive && this.isSoundOn) {
                            this.scheduleNextWaterdrop(4000);
                        }
                    });
                }
            } catch (e) {}
        }, delay);
    }

    setSound(enabled) {
        this.isSoundOn = enabled;
        if (!this.isSoundOn) {
            this.stopSpin();
            this.stopIdleAmbience();
        } else {
            if (this.isAmbientActive) {
                this.startIdleAmbience();
            }
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
            this.soundSpin.volume = 0.22;
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

    playWin(symbolId = null) {
        if (!this.isSoundOn) return;
        try {
            const path = (symbolId && this.symbolSoundMap[symbolId])
                ? this.symbolSoundMap[symbolId]
                : 'assets/sounds/hitbell.wav';
            const sound = this.audioCache[path] || this.soundWin;

            sound.currentTime = 0;
            sound.play().catch(() => {});
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
        let targetAmount = (amount === null || isNaN(amount)) ? this.chip : Math.min(amount, this.chip);
        // 🔒 [대표님 절대 헌법] 환전은 무조건 1,000 SP 단위로만 환전 (1,000 SP 미만 환전 불가)
        targetAmount = Math.floor(targetAmount / 1000) * 1000;
        if (targetAmount < 1000) return 0;
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
        this.multipliers = this.secretEngine ? this.secretEngine.multipliers : [1, 2, 3, 4, 5, 10, 20, 30, 50, 100];
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

        // 🌊 범용 시스템 알림 다이얼로그 요소 캐싱
        this.dialogOverlay = document.getElementById('system-dialog-overlay');
        this.dialogIconWrap = document.getElementById('dialog-icon-wrap');
        this.dialogIcon = document.getElementById('dialog-icon');
        this.dialogTitle = document.getElementById('dialog-title');
        this.dialogMessage = document.getElementById('dialog-message');
        this.dialogInfoBox = document.getElementById('dialog-info-box');
        this.dialogSubTip = document.getElementById('dialog-sub-tip');
        this.btnDialogConfirm = document.getElementById('btn-dialog-confirm');
        this.btnDialogCancel = document.getElementById('btn-dialog-cancel');
        this.dialogResolver = null;

        this.currentReelSymbols = [1, 1, 1];
        this.currentMultIndex = 0;
        this.multipliersList = [1, 2, 3, 4, 5, 10, 20, 30, 50, 100];
    }

    init(multipliers, onSpinClick, onAutoSelect, onAutoToggle, onMenuAction, onChipClick, onDrawerOpen, onDrawerClose, onExchangeSubmit) {
        this.multipliersList = multipliers || [1, 2, 3, 4, 5, 10, 20, 30, 50, 100];
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
        img.src = `assets/images/mult_x1.png`;
        img.onerror = () => { img.src = 'assets/images/mult_x1.png'; };
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
            img.src = `assets/images/sym_${String(randSym).padStart(2, '0')}.png`;
            img.onerror = () => { img.src = 'assets/images/sym_01.png'; };
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

        // ⌨️ 대표님 전용 [무결점 스마트 보안 격리 단축키]:
        // 1. 대표님 로컬 PC 환경(localhost, 127.0.0.1, file://, 로컬 네트워크)에서는 번거로운 주소창 입력 없이 무조건 100% 즉시 활성화!
        // 2. 외부 인터넷 상용 배포 도메인(magic-oceans.com 등)에서는 일반 유저의 단축키 접근을 100% 원천 차단!
        const isLocalEnv = (typeof window !== 'undefined' && window.location) ? (
            window.location.hostname === 'localhost' ||
            window.location.hostname === '127.0.0.1' ||
            window.location.hostname === '' ||
            window.location.hostname.startsWith('192.168.') ||
            window.location.hostname.startsWith('10.') ||
            window.location.hostname.endsWith('.local') ||
            window.location.protocol === 'file:'
        ) : false;

        const urlParams = (typeof window !== 'undefined' && window.location)
            ? new URLSearchParams(window.location.search)
            : null;
        const hasDevSecret = (urlParams && urlParams.get('dev') === 'master') ||
            (typeof window !== 'undefined' && window.location && window.location.hash && window.location.hash.includes('dev=master'));

        // 대표님 로컬 PC에서는 무조건 즉시 활성화, 외부 배포 서버에서는 오직 시크릿 암호가 있을 때만 활성화 (일반 유저 100% 원천 차단)
        const isShortcutActive = isLocalEnv || hasDevSecret;

        if (isShortcutActive) {
            console.log('👑 [12종 심볼 테스트 단축키 활성화 완료] 숫자 1~9, 0, -, = 키를 누르면 해당 심볼 당첨 효과가 즉시 재생됩니다.');
            window.addEventListener('keydown', (e) => {
                if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;

                const keyMap = {
                    '1': 1, 'Digit1': 1, 'Numpad1': 1,
                    '2': 2, 'Digit2': 2, 'Numpad2': 2,
                    '3': 3, 'Digit3': 3, 'Numpad3': 3,
                    '4': 4, 'Digit4': 4, 'Numpad4': 4,
                    '5': 5, 'Digit5': 5, 'Numpad5': 5,
                    '6': 6, 'Digit6': 6, 'Numpad6': 6,
                    '7': 7, 'Digit7': 7, 'Numpad7': 7,
                    '8': 8, 'Digit8': 8, 'Numpad8': 8,
                    '9': 9, 'Digit9': 9, 'Numpad9': 9,
                    '0': 10, 'Digit0': 10, 'Numpad0': 10,
                    '-': 11, 'Minus': 11, 'NumpadSubtract': 11,
                    '=': 12, 'Equal': 12, 'NumpadAdd': 12
                };

                const targetId = keyMap[e.key] || keyMap[e.code];
                if (targetId) {
                    e.preventDefault();
                    this.previewSymbolWin(targetId);
                    if (this.audio) {
                        this.audio.playWin(targetId);
                    }
                }
            });
        }
    }

    previewSymbolWin(symId) {
        if (symId < 1 || symId > 12) return;
        this.clearWinAnimation();

        const pad = String(symId).padStart(2, '0');
        this.reels.forEach((id, index) => {
            const strip = document.getElementById(id);
            if (!strip) return;
            strip.style.transition = 'none';
            strip.style.transform = 'translate3d(0, 0, 0)';
            strip.innerHTML = `<div class="reel-symbol"><img src="assets/images/sym_${pad}.png" class="win-sym-active win-sym-${pad}"></div>`;
            this.currentReelSymbols[index] = symId;
        });

        if (this.jackpotLine) {
            this.jackpotLine.classList.add('active');
        }

        const samplePays = {
            1: 5000, 2: 1000000, 3: 3000, 4: 1000,
            5: 2000, 6: 10000, 7: 100000, 8: 300000,
            9: 500000, 10: 50000, 11: 10000, 12: 30000
        };
        const winAmt = samplePays[symId] || 777000;
        if (this.winAmountEl) {
            this.winAmountEl.classList.add('highlight');
            this.animateNumberRollup(this.winAmountEl, 0, winAmt, 500);
        }
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
                const halfSp = Math.floor((currentSp * 0.5) / 1000) * 1000;
                inputAmount.value = halfSp >= 1000 ? halfSp : (currentSp >= 1000 ? 1000 : 0);
            });
        }

        if (btnAll && inputAmount) {
            btnAll.addEventListener('click', () => {
                const currentSp = this.currentExchangeSp || 0;
                inputAmount.value = Math.floor(currentSp / 1000) * 1000;
            });
        }

        // Exchange 실행 제출
        const btnSubmit = document.getElementById('btn-exchange-submit');
        if (btnSubmit && inputAmount && onExchangeSubmit) {
            btnSubmit.addEventListener('click', () => {
                const rawVal = parseInt(inputAmount.value, 10);
                if (isNaN(rawVal) || rawVal < 1000) {
                    alert('⚠️ 환전은 최소 1,000 SP 이상부터 가능합니다.');
                    return;
                }
                if (rawVal % 1000 !== 0) {
                    const flooredVal = Math.floor(rawVal / 1000) * 1000;
                    alert(`⚠️ 환전은 1,000 SP 단위로만 가능합니다.\n(${flooredVal.toLocaleString()} SP로 자동 보정하여 환전합니다.)`);
                    inputAmount.value = flooredVal;
                    onExchangeSubmit(flooredVal);
                    return;
                }
                onExchangeSubmit(rawVal);
            });
        }

        // 🌊 범용 시스템 알림 & 다이얼로그 이벤트 바인딩
        if (this.btnDialogConfirm) {
            this.btnDialogConfirm.addEventListener('click', () => this.closeOceanDialog(true));
        }
        if (this.btnDialogCancel) {
            this.btnDialogCancel.addEventListener('click', () => this.closeOceanDialog(false));
        }
        if (this.dialogOverlay) {
            this.dialogOverlay.addEventListener('click', (e) => {
                if (e.target === this.dialogOverlay) this.closeOceanDialog(false);
            });
        }

        // 전역 안전 헬퍼 등록
        if (typeof window !== 'undefined') {
            window.showOceanDialog = (opts) => this.openOceanDialog(opts);
        }
    }

    openOceanDialog({ type = 'warning', icon = '⚠️', title = '알림', message = '', infoRows = [], subTip = '', confirmText = '확인', cancelText = null }) {
        return new Promise((resolve) => {
            if (!this.dialogOverlay) {
                alert(`${title}\n${message}`);
                resolve(true);
                return;
            }

            this.dialogResolver = resolve;

            // 1. 타입에 따른 아이콘 스타일
            if (this.dialogIconWrap) {
                this.dialogIconWrap.className = 'dialog-icon-wrap';
                if (type === 'success') this.dialogIconWrap.classList.add('type-success');
                else if (type === 'info') this.dialogIconWrap.classList.add('type-info');
            }
            if (this.dialogIcon) this.dialogIcon.textContent = icon;

            // 2. 타이틀 & 메시지
            if (this.dialogTitle) this.dialogTitle.textContent = title;
            if (this.dialogMessage) this.dialogMessage.innerHTML = message.replace(/\n/g, '<br>');

            // 3. 인포 박스 (키-값 구조)
            if (this.dialogInfoBox) {
                if (Array.isArray(infoRows) && infoRows.length > 0) {
                    this.dialogInfoBox.innerHTML = '';
                    infoRows.forEach(row => {
                        const rowDiv = document.createElement('div');
                        rowDiv.className = 'dialog-info-row';
                        const valClass = row.highlight === 'sp' ? 'highlight-sp' : (row.highlight === 'gold' ? 'highlight-gold' : '');
                        rowDiv.innerHTML = `<span>${row.label}</span><strong class="${valClass}">${row.value}</strong>`;
                        this.dialogInfoBox.appendChild(rowDiv);
                    });
                    this.dialogInfoBox.style.display = 'flex';
                } else {
                    this.dialogInfoBox.style.display = 'none';
                }
            }

            // 4. 서브 팁
            if (this.dialogSubTip) {
                if (subTip) {
                    this.dialogSubTip.innerHTML = subTip;
                    this.dialogSubTip.style.display = 'block';
                } else {
                    this.dialogSubTip.style.display = 'none';
                }
            }

            // 5. 버튼 텍스트 & 노출
            if (this.btnDialogConfirm) {
                this.btnDialogConfirm.textContent = confirmText || '확인';
            }
            if (this.btnDialogCancel) {
                if (cancelText) {
                    this.btnDialogCancel.textContent = cancelText;
                    this.btnDialogCancel.style.display = 'block';
                } else {
                    this.btnDialogCancel.style.display = 'none';
                }
            }

            // 6. 모달 표시
            this.dialogOverlay.classList.add('show');
        });
    }

    closeOceanDialog(result = true) {
        if (this.dialogOverlay) {
            this.dialogOverlay.classList.remove('show');
        }
        if (typeof this.dialogResolver === 'function') {
            const resolver = this.dialogResolver;
            this.dialogResolver = null;
            resolver(result);
        }
    }

    openExchangeModal(currentSp) {
        this.currentExchangeSp = currentSp;
        const modal = document.getElementById('exchange-modal-overlay');
        const spEl = document.getElementById('exchange-modal-sp');
        const input = document.getElementById('exchange-modal-input');
        if (spEl) spEl.textContent = currentSp.toLocaleString() + ' SP';
        const flooredSp = Math.floor(currentSp / 1000) * 1000;
        if (input) input.value = flooredSp >= 1000 ? flooredSp : '';
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
            // 🎯 대표님 지정 60개 황금 박자 모델: 1번 60개/3.0초, 2번 70개/3.5초(+0.5s), 3번 80개/4.0초(+0.5s)
            const reelDurations = [3.0, 3.5, 4.0];
            const blurCountPerReel = [60, 70, 80];
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
                targetDiv.innerHTML = `<img src="assets/images/sym_${String(targetSym).padStart(2, '0')}.png">`;
                strip.appendChild(targetDiv);

                // [1 ~ count-1] 중간 회전 잔상 심볼
                for (let i = 1; i < count; i++) {
                    const rand = Math.floor(Math.random() * 12) + 1;
                    const midDiv = document.createElement('div');
                    midDiv.className = 'reel-symbol';
                    midDiv.innerHTML = `<img src="assets/images/sym_${String(rand).padStart(2, '0')}.png">`;
                    strip.appendChild(midDiv);
                }

                // [count] 최하단: 현재 표시 중이던 심볼
                const currentDiv = document.createElement('div');
                currentDiv.className = 'reel-symbol';
                currentDiv.innerHTML = `<img src="assets/images/sym_${String(currentSym).padStart(2, '0')}.png">`;
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
                    finalDiv.innerHTML = `<img src="assets/images/sym_${String(targetSym).padStart(2, '0')}.png">`;
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
            const baseLoops = 60; // 60개 배당 심볼 맹렬한 회전
            const duration = 5.0; // 🎯 대표님 지정: 3번 릴(4.0초) 정지 후 정확히 1.0초 뒤(5.0초) 피날레 콰광 착지!

            // 1. 위에서 아래로 회전하기 위한 스트립 구축 (타겟 배당 -> 잔상 배당들 -> 현재 배당)
            strip.innerHTML = '';
            strip.style.transition = 'none';

            // [0] 최상단: 최종 착지 타겟 배당
            const targetDiv = document.createElement('div');
            targetDiv.className = 'mult-item';
            targetDiv.innerHTML = `<img src="assets/images/mult_x${targetVal}.png">`;
            strip.appendChild(targetDiv);

            // [1 ~ baseLoops-1] 중간 회전 잔상 배당
            for (let i = 1; i < baseLoops; i++) {
                const randVal = this.multipliersList[Math.floor(Math.random() * this.multipliersList.length)];
                const midDiv = document.createElement('div');
                midDiv.className = 'mult-item';
                midDiv.innerHTML = `<img src="assets/images/mult_x${randVal}.png">`;
                strip.appendChild(midDiv);
            }

            // [baseLoops] 최하단: 현재 표시 중이던 배당
            const currentDiv = document.createElement('div');
            currentDiv.className = 'mult-item';
            currentDiv.innerHTML = `<img src="assets/images/mult_x${currentVal}.png">`;
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
                finalDiv.innerHTML = `<img src="assets/images/mult_x${targetVal}.png">`;
                strip.appendChild(finalDiv);
                strip.style.transform = 'translate3d(0, 0, 0)';
                this.currentMultIndex = targetMultIndex;

                resolve();
            }, duration * 1000);
        });
    }

    showWinAnimation(amount, winningSymbolId) {
        if (this.jackpotLine) {
            this.jackpotLine.classList.add('active');
        }

        if (this.winAmountEl) {
            this.winAmountEl.classList.add('highlight');
            this.animateNumberRollup(this.winAmountEl, 0, amount, 600);
        }

        // 🌟 12종 당첨 심볼 및 체리 2개 콤보 전용 인박스(In-box) 마이크로 인터랙션 가동
        const symId = winningSymbolId || (this.currentReelSymbols ? this.currentReelSymbols[0] : null);
        if (symId === 13) {
            // 🍒 [체리 2개 콤보]: 릴 중 체리(sym_01) 심볼에만 하이라이트 부여
            this.reels.forEach((id) => {
                const strip = document.getElementById(id);
                if (!strip) return;
                const img = strip.querySelector('.reel-symbol img');
                if (img && img.src.includes('sym_01')) {
                    img.classList.add('win-sym-active', 'win-sym-01');
                }
            });
        } else if (symId) {
            const animClass = `win-sym-${String(symId).padStart(2, '0')}`;
            this.reels.forEach((id) => {
                const strip = document.getElementById(id);
                if (!strip) return;
                const img = strip.querySelector('.reel-symbol img');
                if (img) {
                    img.classList.add('win-sym-active', animClass);
                }
            });
        }
    }

    clearWinAnimation() {
        if (this.jackpotLine) {
            this.jackpotLine.classList.remove('active');
        }
        if (this.winAmountEl) {
            this.winAmountEl.classList.remove('highlight');
        }

        // 🌟 당첨 심볼 연출 클래스 초기화
        this.reels.forEach((id) => {
            const strip = document.getElementById(id);
            if (!strip) return;
            const img = strip.querySelector('.reel-symbol img');
            if (img) {
                img.className = img.className.replace(/\bwin-sym-\S+/g, '').trim();
            }
        });
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

        // 💧 평상시 대기(Idle) 물방울 앰비언스 가동 및 브라우저 Autoplay 언락 리스너
        this.audio.startIdleAmbience();
        const unlockAudio = () => {
            this.audio.unlockAudio();
            window.removeEventListener('pointerdown', unlockAudio);
            window.removeEventListener('keydown', unlockAudio);
        };
        window.addEventListener('pointerdown', unlockAudio);
        window.addEventListener('keydown', unlockAudio);

        // 💱 아바타 시스템 및 외부 안전 금융 트랜잭션 동기화 이벤트
        window.addEventListener('magic-oceans:sync-chip', (e) => {
            if (e.detail && typeof e.detail.delta === 'number') {
                this.economy.chip += e.detail.delta;
                if (this.economy.chip < 0) this.economy.chip = 0;
                this.ui.updateEconomyDisplay(this.economy);
            } else if (e.detail && typeof e.detail.setChip === 'number') {
                this.economy.chip = Math.max(0, e.detail.setChip);
                this.ui.updateEconomyDisplay(this.economy);
            }
        });

        window.addEventListener('magic-oceans:sp-to-credit', (e) => {
            const rawAmount = e.detail && typeof e.detail.amount === 'number' ? e.detail.amount : null;
            const amount = (rawAmount !== null) ? Math.floor(rawAmount / 1000) * 1000 : null;
            if (amount !== null && amount < 1000) {
                if (e.detail && typeof e.detail.callback === 'function') e.detail.callback(0);
                return;
            }
            const exchanged = this.economy.exchangeChipToCredit(amount);
            this.ui.updateEconomyDisplay(this.economy);
            if (exchanged > 0) this.audio.playWin();
            if (e.detail && typeof e.detail.callback === 'function') {
                e.detail.callback(exchanged);
            }
        });

        window.addEventListener('magic-oceans:query-economy', (e) => {
            if (e.detail && typeof e.detail.callback === 'function') {
                e.detail.callback({
                    credit: this.economy.credit,
                    chip: this.economy.chip,
                    bet: this.economy.bet
                });
            }
        });
    }

    onChipBoxClick() {
        if (this.state !== 'IDLE') {
            this.ui.openOceanDialog({
                type: 'warning',
                icon: '⏳',
                title: '스핀 진행 중',
                message: '스핀 릴이 완전히 정지한 후 환전을 진행해주세요.',
                confirmText: '확인'
            });
            return;
        }
        if (this.economy.chip < 1000) {
            this.ui.openOceanDialog({
                type: 'warning',
                icon: '⚠️',
                title: 'Point 환전 안내',
                message: '현재 보유 중인 당첨금이 부족하여 환전할 수 없습니다.',
                infoRows: [
                    { label: '🪙 현재 보유 당첨금', value: `${this.economy.chip.toLocaleString()} SP`, highlight: 'sp' },
                    { label: '⚡ 최소 환전 조건', value: '1,000 SP (1,000 단위)', highlight: 'gold' }
                ],
                subTip: '💡 릴을 돌려 짜릿한 잭팟 SP를 먼저 획득해보세요!',
                confirmText: '확인 (릴 회전하러 가기)'
            });
            return;
        }
        this.ui.openExchangeModal(this.economy.chip);
    }

    handleExchangeSubmit(amount) {
        if (amount < 1000) {
            this.ui.openOceanDialog({
                type: 'warning',
                icon: '⚠️',
                title: '환전 수량 미달',
                message: '환전은 최소 1,000 SP 이상부터 가능합니다.',
                confirmText: '확인'
            });
            return;
        }
        if (amount % 1000 !== 0) {
            amount = Math.floor(amount / 1000) * 1000;
        }
        if (amount > this.economy.chip) {
            this.ui.openOceanDialog({
                type: 'warning',
                icon: '⚠️',
                title: '보유 수량 초과',
                message: `보유 SP(${this.economy.chip.toLocaleString()} SP)보다 많은 수량을 환전할 수 없습니다.`,
                confirmText: '확인'
            });
            return;
        }
        const exchanged = this.economy.exchangeChipToCredit(amount);
        if (exchanged <= 0) {
            this.ui.openOceanDialog({
                type: 'warning',
                icon: '⚠️',
                title: '환전 불가',
                message: '환전 가능한 최소 수량(1,000 SP)에 미달합니다.',
                confirmText: '확인'
            });
            return;
        }
        this.ui.updateEconomyDisplay(this.economy);
        this.ui.closeExchangeModal();
        this.audio.playWin();
        this.ui.openOceanDialog({
            type: 'success',
            icon: '🎉',
            title: 'Point 환전 완료',
            message: '보유 잭팟 당첨금이 슬롯 Point로 정상 환전되었습니다!',
            infoRows: [
                { label: '💰 환전된 당첨금', value: `${exchanged.toLocaleString()} SP`, highlight: 'sp' },
                { label: '⚡ 충전된 크레딧', value: `+${exchanged.toLocaleString()} P`, highlight: 'gold' }
            ],
            subTip: '🎰 지금 바로 릴을 돌려 대박 잭팟을 노려보세요!',
            confirmText: '확인 (릴 회전하기)'
        });
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
            const availableSp = Math.floor(this.economy.chip / 1000) * 1000;
            if (availableSp >= this.economy.bet) {
                const doExchange = confirm(
                    `[Point 부족 알림]\n현재 Point가 부족합니다 (${this.economy.credit.toLocaleString()} Point).\n보유 중인 당첨금 중 ${availableSp.toLocaleString()} SP를 Point로 즉시 환전하시겠습니까? (1 SP = 1 Point / 1,000 SP 단위)`
                );
                if (doExchange) {
                    const exchanged = this.economy.exchangeChipToCredit(availableSp);
                    this.ui.updateEconomyDisplay(this.economy);
                    alert(`[환전 완료] ${exchanged.toLocaleString()} SP가 Point로 환전되었습니다! 스핀을 진행합니다.`);
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

        // 3. 사운드 및 GPU 가속 회전 시작 (릴 회전 및 게임 중에는 물방울 앰비언스 즉시 전면 금지)
        this.audio.stopIdleAmbience();
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

        // 💧 릴 회전 및 당첨 연출 종료 후 대기(Idle) 복귀 시 물방울 앰비언스 재개 (오토스핀 진행 중에는 금지)
        if (!this.isAutoSpinning) {
            this.audio.startIdleAmbience();
        }

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
            this.ui.showWinAnimation(result.winAmount, result.hitSymbol ? result.hitSymbol.id : result.reels[0]);
            this.audio.playWin(result.hitSymbol ? result.hitSymbol.id : result.reels[0]);
            this.ui.updateEconomyDisplay(this.economy);
            // 🎯 대표님 지정: 당첨 효과 및 축하 연출 집중 감상 시간 1.0초 (1000ms)
            await new Promise(r => setTimeout(r, 1000));
        }
    }

    startAutoSpin(count) {
        if (this.isAutoSpinning) return;

        this.isAutoSpinning = true;
        this.autoSpinRemaining = count;
        this.ui.setAutoSpinActive(true);
        this.audio.stopIdleAmbience(); // 💧 오토스핀 시작 시 물방울 앰비언스 즉시 전면 금지

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
                // 🎯 대표님 지정: 릴 재구동 안정화 텀 1.0초 (1000ms)
                this.autoSpinTimer = setTimeout(() => {
                    if (this.isAutoSpinning) {
                        this.runNextAutoSpin();
                    }
                }, 1000);
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

        // 💧 오토스핀 종료 후 현재 릴이 돌지 않는 IDLE 상태라면 평상시 대기 앰비언스 즉시 복귀
        if (this.state === 'IDLE') {
            this.audio.startIdleAmbience();
        }
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