/**
 * ============================================================================
 * 🌊 Magic Oceans - Avatar & Luxury Showcase System (avatar-system.js)
 * ============================================================================
 * Architecture:
 * - AVATAR_DB: 의상, 부동산, 탈것, VIP 칭호 아이템 데이터베이스 (Common ~ Legendary)
 * - LEADERBOARD_USERS: 10대 대부호 랭킹 및 쇼케이스 데이터
 * - AvatarSystem:
 *     - G-Coin 경제 및 SP ➔ G코인 교환기 (10,000 SP = 1 G코인)
 *     - 메인 화면 좌측 미니 랭킹보드 & 전체 랭킹 모달
 *     - 상단 중앙 실시간 메가/슈퍼 잭팟 전광판 티커
 *     - 우측 3대 퀵 메뉴 (내 아바타 대시보드 / 럭셔리 상점 / VIP 커뮤니티)
 *     - 타 유저 쇼케이스 팝업 뷰어
 * ============================================================================
 */

(function () {
    'use strict';

    // ==========================================
    // 1. 🏛️ 아이템 데이터베이스 (Common ~ Legendary)
    // ==========================================
    const AVATAR_DB = {
        outfit: [
            { id: 'outfit_01', name: '캐주얼 마린 셔츠', tier: 'common', price: 20, icon: '👕', desc: '편안한 해변 룩' },
            { id: 'outfit_02', name: '로열 네이비 블레이저', tier: 'rare', price: 150, icon: '🧥', desc: '모나코 카지노 정장' },
            { id: 'outfit_03', name: '순금 자수 VIP 턱시도', tier: 'epic', price: 1500, icon: '🤵', desc: '황금빛 자수 턱시도' },
            { id: 'outfit_04', name: '황제 크루즈 다이아 제복', tier: 'legendary', price: 15000, icon: '👑', desc: '대양의 황제만이 입는 제복' }
        ],
        estate: [
            { id: 'estate_01', name: '마이애미 비치 빌라', tier: 'common', price: 50, icon: '🏝️', desc: '햇살 가득한 해변 빌라' },
            { id: 'estate_02', name: '모나코 하버 펜트하우스', tier: 'rare', price: 350, icon: '🏙️', desc: '요트 항구가 내려다보이는 뷰' },
            { id: 'estate_03', name: '두바이 7성급 스카이라운지', tier: 'epic', price: 3000, icon: '🏰', desc: '구름 위의 최고급 라운지' },
            { id: 'estate_04', name: '아틀란티스 해저 황금궁전', tier: 'legendary', price: 30000, icon: '🔱', desc: '바다 깊은 곳의 전설의 궁전' }
        ],
        vehicle: [
            { id: 'vehicle_01', name: '도심형 스포츠 세단', tier: 'common', price: 40, icon: '🚗', desc: '날렵한 도심형 드라이브' },
            { id: 'vehicle_02', name: '이탈리안 V12 슈퍼카', tier: 'rare', price: 500, icon: '🏎️', desc: '포효하는 배기음의 스포츠카' },
            { id: 'vehicle_03', name: '럭셔리 하이퍼카 & 헬기', tier: 'epic', price: 4500, icon: '🚁', desc: '최고 속도 하이퍼카와 전용 헬기' },
            { id: 'vehicle_04', name: '120ft 메가 요트 & 전용기', tier: 'legendary', price: 50000, icon: '🛥️', desc: '바다와 하늘을 지배하는 메가 요트' }
        ],
        badge: [
            { id: 'badge_01', name: '바다의 모험가', tier: 'common', price: 10, icon: '🧭', desc: '슬롯 항해를 시작한 자' },
            { id: 'badge_02', name: '행운의 서퍼', tier: 'rare', price: 100, icon: '🏄', desc: '잭팟 파도를 타는 자' },
            { id: 'badge_03', name: '하이롤러 마스터', tier: 'epic', price: 1000, icon: '💎', desc: '거침없이 베팅하는 하이롤러' },
            { id: 'badge_04', name: '대양의 절대 지배자', tier: 'legendary', price: 10000, icon: '👑', desc: '바다의 전설로 군림하는 부호' }
        ]
    };

    // ==========================================
    // 2. 🏆 10대 대부호 랭킹 & 쇼케이스 데이터
    // ==========================================
    const LEADERBOARD_USERS = [
        {
            rank: 1,
            username: 'robinhood',
            title: '👑 대양의 절대 지배자',
            networth: '520,000 G',
            estate: '아틀란티스 해저 황금궁전',
            estateIcon: '🔱',
            vehicle: '120ft 메가 요트 & 전용기',
            vehicleIcon: '🛥️',
            avatarIcon: '🤵',
            maxJp: '50,000,000 SP'
        },
        {
            rank: 2,
            username: 'martin125',
            title: '💎 카지노 황제',
            networth: '380,000 G',
            estate: '두바이 7성급 스카이라운지',
            estateIcon: '🏰',
            vehicle: '럭셔리 하이퍼카 & 헬기',
            vehicleIcon: '🚁',
            avatarIcon: '🧑‍💼',
            maxJp: '32,000,000 SP'
        },
        {
            rank: 3,
            username: 'anfisanna',
            title: '🔱 심해의 여왕',
            networth: '290,000 G',
            estate: '모나코 하버 펜트하우스',
            estateIcon: '🏙️',
            vehicle: '이탈리안 V12 슈퍼카',
            vehicleIcon: '🏎️',
            avatarIcon: '💃',
            maxJp: '25,000,000 SP'
        },
        {
            rank: 4,
            username: 'sniper99',
            title: '🎯 잭팟 스나이퍼',
            networth: '185,000 G',
            estate: '모나코 하버 펜트하우스',
            estateIcon: '🏙️',
            vehicle: '이탈리안 V12 슈퍼카',
            vehicleIcon: '🏎️',
            avatarIcon: '🕵️',
            maxJp: '18,000,000 SP'
        },
        {
            rank: 5,
            username: 'superman26',
            title: '⚡ 불사조 하이롤러',
            networth: '120,000 G',
            estate: '마이애미 비치 빌라',
            estateIcon: '🏝️',
            vehicle: '도심형 스포츠 세단',
            vehicleIcon: '🚗',
            avatarIcon: '🦸',
            maxJp: '12,000,000 SP'
        },
        {
            rank: 6,
            username: 'rotiman',
            title: '🎰 메가잭팟 헌터',
            networth: '95,000 G',
            estate: '마이애미 비치 빌라',
            estateIcon: '🏝️',
            vehicle: '도심형 스포츠 세단',
            vehicleIcon: '🚗',
            avatarIcon: '🤠',
            maxJp: '10,000,000 SP'
        },
        {
            rank: 7,
            username: 'ocean_king',
            title: '🌊 파도의 군주',
            networth: '78,000 G',
            estate: '마이애미 비치 빌라',
            estateIcon: '🏝️',
            vehicle: '도심형 스포츠 세단',
            vehicleIcon: '🚗',
            avatarIcon: '🧙',
            maxJp: '8,500,000 SP'
        },
        {
            rank: 8,
            username: 'lucky_whale',
            title: '🐋 황금 고래',
            networth: '65,000 G',
            estate: '마이애미 비치 빌라',
            estateIcon: '🏝️',
            vehicle: '도심형 스포츠 세단',
            vehicleIcon: '🚗',
            avatarIcon: '🧑‍🚀',
            maxJp: '6,000,000 SP'
        },
        {
            rank: 9,
            username: 'gold_seeker',
            title: '💰 골드 시커',
            networth: '52,000 G',
            estate: '마이애미 비치 빌라',
            estateIcon: '🏝️',
            vehicle: '도심형 스포츠 세단',
            vehicleIcon: '🚗',
            avatarIcon: '🥷',
            maxJp: '5,000,000 SP'
        },
        {
            rank: 10,
            username: 'blue_pearl',
            title: '🦪 푸른 진주',
            networth: '41,000 G',
            estate: '마이애미 비치 빌라',
            estateIcon: '🏝️',
            vehicle: '도심형 스포츠 세단',
            vehicleIcon: '🚗',
            avatarIcon: '👸',
            maxJp: '3,500,000 SP'
        }
    ];

    // ==========================================
    // 3. 💾 유저 프로필 & 상태 관리
    // ==========================================
    class UserProfileManager {
        constructor() {
            this.storageKey = 'magic_oceans_user_avatar_v1';
            this.state = this.loadState();
        }

        loadState() {
            try {
                const saved = localStorage.getItem(this.storageKey);
                if (saved) {
                    return JSON.parse(saved);
                }
            } catch (e) {}

            return {
                username: '대표님 (VIP Owner)',
                gcoin: 50, // 초기 축하 지원금 50 G
                equipped: {
                    outfit: 'outfit_01',
                    estate: 'estate_01',
                    vehicle: 'vehicle_01',
                    badge: 'badge_01'
                },
                inventory: ['outfit_01', 'estate_01', 'vehicle_01', 'badge_01'],
                maxJackpot: 0,
                spinCount: 0
            };
        }

        saveState() {
            try {
                localStorage.setItem(this.storageKey, JSON.stringify(this.state));
            } catch (e) {}
        }

        calculateNetWorth() {
            let itemWorth = 0;
            this.state.inventory.forEach(itemId => {
                for (const cat in AVATAR_DB) {
                    const item = AVATAR_DB[cat].find(i => i.id === itemId);
                    if (item) itemWorth += item.price;
                }
            });
            // 보유 G코인 + 아이템 가치 지수
            return (this.state.gcoin * 1000) + (itemWorth * 1000);
        }

        recordSpin() {
            this.state.spinCount += 1;
            this.saveState();
        }

        recordWin(winAmount) {
            if (winAmount > this.state.maxJackpot) {
                this.state.maxJackpot = winAmount;
                this.saveState();
            }
        }
    }

    // ==========================================
    // 4. 🚀 AvatarSystem 메인 컨트롤러
    // ==========================================
    class AvatarSystem {
        constructor() {
            this.profile = new UserProfileManager();
            this.activeStoreCat = 'outfit';
            this.activeCommTab = 'chat';
            this.tickerTimer = null;
        }

        init() {
            this.bindElements();
            this.renderMiniRanking();
            this.renderFullRanking();
            this.renderStoreGrid();
            this.renderMyDashboard();
            this.bindEvents();
            this.startLiveTickerSimulator();
        }

        bindElements() {
            // HUD 버튼 & 위젯
            this.rankingMiniBoard = document.getElementById('ranking-mini-board');
            this.rankingMiniList = document.getElementById('ranking-mini-list');
            this.jackpotTickerWrap = document.getElementById('jackpot-ticker-wrap');
            this.jackpotTickerContent = document.getElementById('jackpot-ticker-content');
            this.btnNavAvatar = document.getElementById('btn-nav-avatar');
            this.btnNavStore = document.getElementById('btn-nav-store');
            this.btnNavCommunity = document.getElementById('btn-nav-community');

            // 모달 오버레이
            this.modalRanking = document.getElementById('ranking-modal-overlay');
            this.modalProfile = document.getElementById('user-profile-modal-overlay');
            this.modalMyAvatar = document.getElementById('my-avatar-modal-overlay');
            this.modalStore = document.getElementById('luxury-store-modal-overlay');
            this.modalCommunity = document.getElementById('community-modal-overlay');

            // 닫기 버튼
            this.btnCloseRanking = document.getElementById('btn-ranking-close');
            this.btnCloseProfile = document.getElementById('btn-profile-close');
            this.btnCloseMyAvatar = document.getElementById('btn-my-avatar-close');
            this.btnCloseStore = document.getElementById('btn-store-close');
            this.btnCloseCommunity = document.getElementById('btn-community-close');

            // 💱 중앙 환전소 듀얼 탭 요소
            this.tabBtnDeposit = document.getElementById('tab-btn-deposit');
            this.tabBtnWithdraw = document.getElementById('tab-btn-withdraw');
            this.paneGexDeposit = document.getElementById('pane-gex-deposit');
            this.paneGexWithdraw = document.getElementById('pane-gex-withdraw');

            // 탭 1: 자산 예치 (SP ➔ G)
            this.gexCurrentSp = document.getElementById('gex-current-sp');
            this.gexMaxGcoin = document.getElementById('gex-max-gcoin');
            this.btnGexHalf = document.getElementById('btn-gex-half');
            this.btnGexAll = document.getElementById('btn-gex-all');
            this.inputGexDepositSp = document.getElementById('input-gex-deposit-sp');
            this.btnGexDepositSubmit = document.getElementById('btn-gex-deposit-submit');

            // 탭 2: 비상금 환전 (G ➔ SP)
            this.gexWithdrawCurGcoin = document.getElementById('gex-withdraw-cur-gcoin');
            this.gexWithdrawEstSp = document.getElementById('gex-withdraw-est-sp');
            this.btnWithdraw10g = document.getElementById('btn-withdraw-10g');
            this.btnWithdraw50g = document.getElementById('btn-withdraw-50g');
            this.btnWithdrawAll = document.getElementById('btn-withdraw-all');
            this.labelWithdrawAllDesc = document.getElementById('label-withdraw-all-desc');
            this.inputWithdrawGcoin = document.getElementById('input-withdraw-gcoin');
            this.btnWithdrawSubmit = document.getElementById('btn-withdraw-submit');
            this.previewCalcText = document.getElementById('preview-calc-text');

            // 대시보드 뷰어
            this.myBgPreview = document.getElementById('my-bg-preview');
            this.myVehiclePreview = document.getElementById('my-vehicle-preview');
            this.myAvatarPreview = document.getElementById('my-avatar-preview');
            this.myTitleBadge = document.getElementById('my-title-badge');
            this.myGcoinVal = document.getElementById('my-gcoin-val');
            this.myNetWorth = document.getElementById('my-net-worth');
            this.myMaxJackpot = document.getElementById('my-max-jackpot');
            this.mySpinCount = document.getElementById('my-spin-count');

            // 상점 요소
            this.storeGcoinVal = document.getElementById('store-gcoin-val');
            this.storeTabs = document.querySelectorAll('.store-tab');
            this.storeItemsGrid = document.getElementById('store-items-grid');

            // 커뮤니티 요소
            this.commTabs = document.querySelectorAll('.comm-tab');
            this.commPaneChat = document.getElementById('comm-pane-chat');
            this.commPaneMarket = document.getElementById('comm-pane-market');
            this.chatFeed = document.getElementById('community-chat-feed');
            this.chatInput = document.getElementById('community-chat-input');
            this.btnChatSend = document.getElementById('btn-chat-send');
            this.marketList = document.getElementById('community-market-list');

            // 랭킹 리스트 래퍼
            this.rankingFullList = document.getElementById('ranking-full-list');
        }

        bindEvents() {
            // 1. 좌측 랭킹보드 클릭 시 전체 랭킹 오픈
            if (this.rankingMiniBoard) {
                this.rankingMiniBoard.addEventListener('click', () => {
                    this.openModal(this.modalRanking);
                });
            }

            // 2. 우측 3대 퀵 메뉴
            if (this.btnNavAvatar) {
                this.btnNavAvatar.addEventListener('click', () => {
                    this.renderMyDashboard();
                    this.openModal(this.modalMyAvatar);
                });
            }
            if (this.btnNavStore) {
                this.btnNavStore.addEventListener('click', () => {
                    this.updateStoreWallet();
                    this.renderStoreGrid();
                    this.openModal(this.modalStore);
                });
            }
            if (this.btnNavCommunity) {
                this.btnNavCommunity.addEventListener('click', () => {
                    this.renderCommunityMarket();
                    this.openModal(this.modalCommunity);
                });
            }

            // 3. 모달 닫기 버튼들
            const closeMap = [
                { btn: this.btnCloseRanking, modal: this.modalRanking },
                { btn: this.btnCloseProfile, modal: this.modalProfile },
                { btn: this.btnCloseMyAvatar, modal: this.modalMyAvatar },
                { btn: this.btnCloseStore, modal: this.modalStore },
                { btn: this.btnCloseCommunity, modal: this.modalCommunity }
            ];
            closeMap.forEach(({ btn, modal }) => {
                if (btn && modal) {
                    btn.addEventListener('click', () => this.closeModal(modal));
                }
            });

            // 오버레이 바깥 클릭 시 닫기
            [this.modalRanking, this.modalProfile, this.modalMyAvatar, this.modalStore, this.modalCommunity].forEach(modal => {
                if (modal) {
                    modal.addEventListener('click', (e) => {
                        if (e.target === modal) this.closeModal(modal);
                    });
                }
            });

            // 4. 💱 중앙 환전소 듀얼 탭 & 금융 이벤트 바인딩
            if (this.tabBtnDeposit && this.tabBtnWithdraw) {
                this.tabBtnDeposit.addEventListener('click', () => this.switchExchangeTab('deposit'));
                this.tabBtnWithdraw.addEventListener('click', () => this.switchExchangeTab('withdraw'));
            }

            // 4-1. [자산 예치] SP ➔ G코인
            if (this.btnGexHalf) {
                this.btnGexHalf.addEventListener('click', () => this.executeGcoinExchange(0.5));
            }
            if (this.btnGexAll) {
                this.btnGexAll.addEventListener('click', () => this.executeGcoinExchange(1.0));
            }
            if (this.btnGexDepositSubmit) {
                this.btnGexDepositSubmit.addEventListener('click', () => this.executeDepositAmount());
            }

            // 4-2. [비상금 환전] G코인 ➔ SP (대표님 지정 100회/500회 공식 준수)
            if (this.btnWithdraw10g) {
                this.btnWithdraw10g.addEventListener('click', () => this.executeSpWithdrawal(10));
            }
            if (this.btnWithdraw50g) {
                this.btnWithdraw50g.addEventListener('click', () => this.executeSpWithdrawal(50));
            }
            if (this.btnWithdrawAll) {
                this.btnWithdrawAll.addEventListener('click', () => this.executeSpWithdrawal(this.profile.state.gcoin));
            }
            if (this.btnWithdrawSubmit) {
                this.btnWithdrawSubmit.addEventListener('click', () => this.executeCustomWithdrawal());
            }
            if (this.inputWithdrawGcoin) {
                this.inputWithdrawGcoin.addEventListener('input', () => this.updateWithdrawPreview());
            }

            // 5. 상점 카테고리 탭 전환
            this.storeTabs.forEach(tab => {
                tab.addEventListener('click', () => {
                    this.storeTabs.forEach(t => t.classList.remove('active'));
                    tab.classList.add('active');
                    this.activeStoreCat = tab.dataset.cat;
                    this.renderStoreGrid();
                });
            });

            // 6. 커뮤니티 탭 전환
            this.commTabs.forEach(tab => {
                tab.addEventListener('click', () => {
                    this.commTabs.forEach(t => t.classList.remove('active'));
                    tab.classList.add('active');
                    const targetTab = tab.dataset.tab;
                    if (targetTab === 'chat') {
                        this.commPaneChat.style.display = 'block';
                        this.commPaneMarket.style.display = 'none';
                    } else {
                        this.commPaneChat.style.display = 'none';
                        this.commPaneMarket.style.display = 'block';
                    }
                });
            });

            // 7. 커뮤니티 채팅 전송
            if (this.btnChatSend && this.chatInput) {
                const sendMsg = () => {
                    const text = this.chatInput.value.trim();
                    if (!text) return;
                    this.addChatMessage(this.profile.state.username, text, true);
                    this.chatInput.value = '';

                    // 가상 유저 자동 반응 리액션
                    setTimeout(() => {
                        const replies = [
                            'Huge jackpot vibes today! 🔥',
                            'Congratulations on the big win! 💎',
                            'Saving G-Coins for the Penthouse! 🏰',
                            'Waiting for 3 Jokers on max bet! 🎰'
                        ];
                        const randomUser = LEADERBOARD_USERS[Math.floor(Math.random() * 5)].username;
                        const randomReply = replies[Math.floor(Math.random() * replies.length)];
                        this.addChatMessage(randomUser, randomReply, false);
                    }, 1200);
                };

                this.btnChatSend.addEventListener('click', sendMsg);
                this.chatInput.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') sendMsg();
                });
            }
        }

        openModal(modal) {
            if (modal) modal.classList.add('active');
        }

        closeModal(modal) {
            if (modal) modal.classList.remove('active');
        }

        // ==========================================
        // 5. 💱 G코인 환전 로직 (10,000 SP = 1 G코인)
        // ==========================================
        getCurrentSpBalance() {
            // index.html의 chip-val 또는 전역 스코프 참조
            const chipEl = document.getElementById('chip-val');
            if (chipEl) {
                const text = chipEl.textContent.replace(/[^0-9]/g, '');
                return parseInt(text, 10) || 0;
            }
            return 0;
        }

        switchExchangeTab(tab) {
            if (!this.tabBtnDeposit || !this.tabBtnWithdraw || !this.paneGexDeposit || !this.paneGexWithdraw) return;

            if (tab === 'deposit') {
                this.tabBtnDeposit.classList.add('active');
                this.tabBtnWithdraw.classList.remove('active');
                this.paneGexDeposit.style.display = 'flex';
                this.paneGexWithdraw.style.display = 'none';
            } else {
                this.tabBtnDeposit.classList.remove('active');
                this.tabBtnWithdraw.classList.add('active');
                this.paneGexDeposit.style.display = 'none';
                this.paneGexWithdraw.style.display = 'flex';
                this.updateWithdrawPreview();
            }
        }

        showDialog(opts) {
            if (typeof window !== 'undefined' && typeof window.showOceanDialog === 'function') {
                return window.showOceanDialog(opts);
            }
            alert(`${opts.title || '알림'}\n${opts.message || ''}`);
            return Promise.resolve(true);
        }

        executeGcoinExchange(ratio) {
            const currentSp = this.getCurrentSpBalance();
            if (currentSp < 10000) {
                this.showDialog({
                    type: 'warning',
                    icon: '⚠️',
                    title: '예치 기준 미달',
                    message: '최소 10,000 SP 이상 보유 시에만 1 G-Coin으로 예치할 수 있습니다.',
                    infoRows: [
                        { label: '🪙 현재 보유 당첨금', value: `${currentSp.toLocaleString()} SP`, highlight: 'sp' },
                        { label: '⚡ 최소 예치 단위', value: '10,000 SP = 1 G', highlight: 'gold' }
                    ],
                    confirmText: '확인'
                });
                return;
            }

            const targetSp = Math.floor((currentSp * ratio) / 10000) * 10000;
            if (targetSp <= 0) {
                this.showDialog({
                    type: 'warning',
                    icon: '⚠️',
                    title: '예치 수량 부족',
                    message: '예치 가능한 최소 수량(10,000 SP)에 미달합니다.',
                    confirmText: '확인'
                });
                return;
            }

            const earnedGcoin = Math.floor(targetSp / 10000);

            // 1. 코어 엔진과 SP 잔액 안전 동기화
            window.dispatchEvent(new CustomEvent('magic-oceans:sync-chip', {
                detail: { delta: -targetSp }
            }));

            // 2. G코인 증가 및 영구 저장
            this.profile.state.gcoin += earnedGcoin;
            this.profile.saveState();

            // 3. UI 갱신
            this.renderMyDashboard();
            this.updateStoreWallet();

            this.showDialog({
                type: 'success',
                icon: '🎉',
                title: '자산 예치 완료',
                message: '보유 당첨금이 안전한 G-Coin 자산으로 예치되었습니다!',
                infoRows: [
                    { label: '💰 예치된 당첨금', value: `${targetSp.toLocaleString()} SP`, highlight: 'sp' },
                    { label: '🪙 획득한 G-Coin', value: `+${earnedGcoin.toLocaleString()} G`, highlight: 'gold' }
                ],
                subTip: '🛍️ 보유 G-Coin으로 럭셔리 부티크 상점에서 쇼핑을 즐겨보세요!',
                confirmText: '확인'
            });
        }

        executeDepositAmount() {
            if (!this.inputGexDepositSp) return;
            const inputVal = parseInt(this.inputGexDepositSp.value, 10);
            if (isNaN(inputVal) || inputVal < 10000) {
                this.showDialog({
                    type: 'warning',
                    icon: '⚠️',
                    title: '예치 수량 오류',
                    message: '최소 10,000 SP 이상의 수량을 입력해주세요. (10,000 단위)',
                    confirmText: '확인'
                });
                return;
            }

            const currentSp = this.getCurrentSpBalance();
            if (inputVal > currentSp) {
                this.showDialog({
                    type: 'warning',
                    icon: '⚠️',
                    title: '보유 잔액 초과',
                    message: `보유 중인 당첨금(${currentSp.toLocaleString()} SP)을 초과할 수 없습니다.`,
                    confirmText: '확인'
                });
                return;
            }

            const targetSp = Math.floor(inputVal / 10000) * 10000;
            const earnedGcoin = Math.floor(targetSp / 10000);

            window.dispatchEvent(new CustomEvent('magic-oceans:sync-chip', {
                detail: { delta: -targetSp }
            }));

            this.profile.state.gcoin += earnedGcoin;
            this.profile.saveState();
            this.inputGexDepositSp.value = '';

            this.renderMyDashboard();
            this.updateStoreWallet();

            this.showDialog({
                type: 'success',
                icon: '🎉',
                title: '자산 예치 완료',
                message: '보유 당첨금이 G-Coin 자산으로 예치되었습니다!',
                infoRows: [
                    { label: '💰 예치된 당첨금', value: `${targetSp.toLocaleString()} SP`, highlight: 'sp' },
                    { label: '🪙 획득한 G-Coin', value: `+${earnedGcoin.toLocaleString()} G`, highlight: 'gold' }
                ],
                confirmText: '확인'
            });
        }

        // ==========================================
        // 5-1. 🚨 G코인 ➔ SP 비상금 환전 로직 (1 G = 10,000 SP = 슬롯 10회)
        // [대표님 확정 공식] 10 G = 10만 SP = 100회 스핀 / 50 G = 50만 SP = 500회 스핀
        // ==========================================
        async executeSpWithdrawal(gcoinCount) {
            gcoinCount = Math.floor(gcoinCount);
            if (isNaN(gcoinCount) || gcoinCount <= 0) {
                this.showDialog({
                    type: 'warning',
                    icon: '⚠️',
                    title: '환전 수량 오류',
                    message: '최소 1 G-Coin 이상 환전할 수 있습니다.',
                    confirmText: '확인'
                });
                return;
            }

            const curGcoin = this.profile.state.gcoin;
            if (curGcoin < gcoinCount) {
                this.showDialog({
                    type: 'warning',
                    icon: '⚠️',
                    title: 'G-Coin 잔액 부족',
                    message: `보유 중인 G-Coin(${curGcoin.toLocaleString()} G)이 부족합니다.`,
                    confirmText: '확인'
                });
                return;
            }

            const earnedSp = gcoinCount * 10000;
            const spinCount = Math.floor(earnedSp / 1000); // 1회 기본 베팅 1,000 기준

            // 1. G-Coin 차감 및 영구 저장
            this.profile.state.gcoin -= gcoinCount;
            this.profile.saveState();

            // 2. 코어 엔진과 SP 잔액 안전 가산 동기화
            window.dispatchEvent(new CustomEvent('magic-oceans:sync-chip', {
                detail: { delta: earnedSp }
            }));

            // 3. UI 갱신
            this.renderMyDashboard();
            this.updateStoreWallet();

            // 4. 즉시 슬롯 연료(Credit Point) 전환 연동 다이얼로그 (프리미엄 2버튼)
            const toCredit = await this.showDialog({
                type: 'success',
                icon: '⚡',
                title: '비상금 환전 성공!',
                message: 'G-Coin이 잭팟 당첨금(SP)으로 안전하게 환전되었습니다!',
                infoRows: [
                    { label: '🪙 환전된 자산', value: `${gcoinCount.toLocaleString()} G-Coin`, highlight: 'gold' },
                    { label: '💰 획득 당첨금', value: `+${earnedSp.toLocaleString()} SP`, highlight: 'sp' },
                    { label: '⚡ 확보된 스핀', value: `${spinCount.toLocaleString()}회 분량`, highlight: 'gold' }
                ],
                subTip: '🎰 지금 즉시 이 SP를 슬롯 크레딧(Point)으로 전환하여 바로 릴을 돌리시겠습니까?',
                confirmText: '크레딧 전환 후 릴 회전',
                cancelText: 'SP 지갑에 보관'
            });

            if (toCredit) {
                window.dispatchEvent(new CustomEvent('magic-oceans:sp-to-credit', {
                    detail: { amount: earnedSp }
                }));
                this.closeModal(this.modalMyAvatar);
            }
        }

        executeCustomWithdrawal() {
            if (!this.inputWithdrawGcoin) return;
            const count = parseInt(this.inputWithdrawGcoin.value, 10);
            if (isNaN(count) || count <= 0) {
                this.showDialog({
                    type: 'warning',
                    icon: '⚠️',
                    title: '수량 입력 오류',
                    message: '환전할 G-Coin 수량을 정확히 입력해주세요.',
                    confirmText: '확인'
                });
                return;
            }
            this.executeSpWithdrawal(count);
            this.inputWithdrawGcoin.value = '';
        }

        updateWithdrawPreview() {
            if (!this.previewCalcText) return;
            let val = this.inputWithdrawGcoin ? parseInt(this.inputWithdrawGcoin.value, 10) : 1;
            if (isNaN(val) || val <= 0) val = 1;

            const estSp = val * 10000;
            const estSpins = val * 10; // 1 G = 10,000 SP = 10회 스핀, 10 G = 100회, 50 G = 500회
            this.previewCalcText.textContent = `${val.toLocaleString()} G-Coin 환전 시 ${estSp.toLocaleString()} SP (슬롯 ${estSpins.toLocaleString()}회 스핀)를 확보합니다. ⚡`;
        }

        // ==========================================
        // 6. 🏆 랭킹보드 렌더링 & 쇼케이스 팝업
        // ==========================================
        renderMiniRanking() {
            if (!this.rankingMiniList) return;
            this.rankingMiniList.innerHTML = '';

            const top5 = LEADERBOARD_USERS.slice(0, 5);
            top5.forEach(u => {
                const li = document.createElement('li');
                li.className = `ranking-item rank-${u.rank}`;
                li.innerHTML = `<span class="rank-num">${u.rank}</span> <span class="rank-name">${u.username}</span>`;
                li.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.showUserProfile(u);
                });
                this.rankingMiniList.appendChild(li);
            });
        }

        renderFullRanking() {
            if (!this.rankingFullList) return;
            this.rankingFullList.innerHTML = '';

            LEADERBOARD_USERS.forEach(u => {
                const card = document.createElement('div');
                card.className = 'rank-row-card';
                const badgeClass = u.rank <= 3 ? `rank-badge-${u.rank}` : 'rank-badge-other';
                card.innerHTML = `
                    <div class="rank-row-left">
                        <div class="rank-badge-circle ${badgeClass}">${u.rank}</div>
                        <div class="rank-user-info">
                            <span class="rank-u-name">${u.username}</span>
                            <span class="rank-u-title">${u.title}</span>
                        </div>
                    </div>
                    <div class="rank-row-right">
                        <div class="rank-u-networth">${u.networth}</div>
                        <div class="rank-u-vehicle">${u.vehicleIcon} ${u.vehicle}</div>
                    </div>
                `;
                card.addEventListener('click', () => {
                    this.closeModal(this.modalRanking);
                    this.showUserProfile(u);
                });
                this.rankingFullList.appendChild(card);
            });
        }

        showUserProfile(user) {
            document.getElementById('profile-username').textContent = user.username;
            document.getElementById('profile-vip-badge').textContent = user.title;
            document.getElementById('profile-networth').textContent = user.networth;
            document.getElementById('profile-max-jp').textContent = user.maxJp;
            document.getElementById('profile-estate').textContent = user.estate;
            document.getElementById('profile-vehicle').textContent = user.vehicle;

            // 스테이지 그래픽 갱신
            document.getElementById('profile-bg-preview').textContent = user.estateIcon;
            document.getElementById('profile-vehicle-preview').textContent = user.vehicleIcon;
            document.getElementById('profile-avatar-preview').textContent = user.avatarIcon;

            this.openModal(this.modalProfile);
        }

        // ==========================================
        // 7. 👔 내 아바타 대시보드 렌더링
        // ==========================================
        renderMyDashboard() {
            const st = this.profile.state;
            const currentSp = this.getCurrentSpBalance();

            // 탭 1 (예치) 정보 갱신
            if (this.gexCurrentSp) this.gexCurrentSp.textContent = currentSp.toLocaleString() + ' SP';
            if (this.gexMaxGcoin) this.gexMaxGcoin.textContent = Math.floor(currentSp / 10000).toLocaleString() + ' G';

            // 탭 2 (비상금 환전) 정보 갱신
            if (this.gexWithdrawCurGcoin) this.gexWithdrawCurGcoin.textContent = st.gcoin.toLocaleString() + ' G';
            if (this.gexWithdrawEstSp) this.gexWithdrawEstSp.textContent = (st.gcoin * 10000).toLocaleString() + ' SP';
            if (this.labelWithdrawAllDesc) {
                const totalSp = st.gcoin * 10000;
                const totalSpins = st.gcoin * 10; // 1 G = 10,000 SP = 10회 스핀
                this.labelWithdrawAllDesc.textContent = `${totalSp.toLocaleString()} SP (${totalSpins.toLocaleString()}회)`;
            }
            this.updateWithdrawPreview();

            // 잔액 & 지수 갱신
            if (this.myGcoinVal) this.myGcoinVal.textContent = st.gcoin.toLocaleString() + ' G';
            if (this.myNetWorth) this.myNetWorth.textContent = this.profile.calculateNetWorth().toLocaleString();
            if (this.myMaxJackpot) this.myMaxJackpot.textContent = (st.maxJackpot || 0).toLocaleString() + ' SP';
            if (this.mySpinCount) this.mySpinCount.textContent = (st.spinCount || 0).toLocaleString() + '회';

            // 장착 아이템 룩 갱신
            const curBadge = AVATAR_DB.badge.find(b => b.id === st.equipped.badge) || AVATAR_DB.badge[0];
            const curEstate = AVATAR_DB.estate.find(e => e.id === st.equipped.estate) || AVATAR_DB.estate[0];
            const curVehicle = AVATAR_DB.vehicle.find(v => v.id === st.equipped.vehicle) || AVATAR_DB.vehicle[0];
            const curOutfit = AVATAR_DB.outfit.find(o => o.id === st.equipped.outfit) || AVATAR_DB.outfit[0];

            if (this.myTitleBadge) this.myTitleBadge.textContent = curBadge.name;
            if (this.myBgPreview) this.myBgPreview.textContent = curEstate.icon;
            if (this.myVehiclePreview) this.myVehiclePreview.textContent = curVehicle.icon;
            if (this.myAvatarPreview) this.myAvatarPreview.textContent = curOutfit.icon;
        }

        // ==========================================
        // 8. 🛍️ 상점 그리드 렌더링 및 구매/장착 로직
        // ==========================================
        updateStoreWallet() {
            if (this.storeGcoinVal) {
                this.storeGcoinVal.textContent = this.profile.state.gcoin.toLocaleString() + ' G';
            }
        }

        renderStoreGrid() {
            if (!this.storeItemsGrid) return;
            this.storeItemsGrid.innerHTML = '';

            const items = AVATAR_DB[this.activeStoreCat] || [];
            const st = this.profile.state;

            items.forEach(item => {
                const isOwned = st.inventory.includes(item.id);
                const isEquipped = st.equipped[this.activeStoreCat] === item.id;

                const card = document.createElement('div');
                card.className = `store-item-card tier-${item.tier}`;
                card.innerHTML = `
                    <span class="item-tier-badge">${item.tier}</span>
                    <div class="item-icon-wrap">${item.icon}</div>
                    <div class="item-name">${item.name}</div>
                    <div class="item-price">🪙 ${item.price.toLocaleString()} G</div>
                `;

                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'btn-item-action';

                if (isEquipped) {
                    btn.classList.add('btn-equipped');
                    btn.textContent = '✓ 장착중';
                } else if (isOwned) {
                    btn.classList.add('btn-equip');
                    btn.textContent = '장착하기';
                    btn.addEventListener('click', () => {
                        st.equipped[this.activeStoreCat] = item.id;
                        this.profile.saveState();
                        this.renderStoreGrid();
                        this.renderMyDashboard();
                    });
                } else {
                    btn.classList.add('btn-buy');
                    btn.textContent = '구매';
                    btn.addEventListener('click', () => {
                        if (st.gcoin < item.price) {
                            alert('⚠️ 보유 G코인이 부족합니다!\n슬롯 당첨금(SP)을 G코인으로 교환하세요.');
                            return;
                        }
                        st.gcoin -= item.price;
                        st.inventory.push(item.id);
                        st.equipped[this.activeStoreCat] = item.id; // 구매 즉시 착용
                        this.profile.saveState();
                        this.updateStoreWallet();
                        this.renderStoreGrid();
                        this.renderMyDashboard();
                        alert(`🎉 [${item.name}] 구매 및 장착 완료!`);
                    });
                }

                card.appendChild(btn);
                this.storeItemsGrid.appendChild(card);
            });
        }

        // ==========================================
        // 9. 💬 커뮤니티 & 마켓 렌더링
        // ==========================================
        addChatMessage(user, text, isMe = false) {
            if (!this.chatFeed) return;
            const row = document.createElement('div');
            row.className = 'chat-msg-row';
            const userClass = isMe ? 'chat-user-vip' : 'chat-user-normal';
            row.innerHTML = `<span class="${userClass}">[${user}]:</span><span class="chat-text">${text}</span>`;
            this.chatFeed.appendChild(row);
            this.chatFeed.scrollTop = this.chatFeed.scrollHeight;
        }

        renderCommunityMarket() {
            if (!this.marketList) return;
            this.marketList.innerHTML = '';

            const marketDeals = [
                { seller: 'robinhood', item: '황제 크루즈 다이아 제복 (Legendary)', price: '14,000 G', icon: '👑' },
                { seller: 'martin125', item: '두바이 7성급 스카이라운지 (Epic)', price: '2,800 G', icon: '🏰' },
                { seller: 'anfisanna', item: '이탈리안 V12 슈퍼카 (Rare)', price: '450 G', icon: '🏎️' }
            ];

            marketDeals.forEach(deal => {
                const row = document.createElement('div');
                row.className = 'market-item-row';
                row.innerHTML = `
                    <div style="display:flex; align-items:center; gap:8px;">
                        <span style="font-size:20px;">${deal.icon}</span>
                        <div>
                            <div style="font-size:11px; font-weight:bold; color:#fff;">${deal.item}</div>
                            <div style="font-size:9.5px; color:#94a3b8;">판매자: ${deal.seller}</div>
                        </div>
                    </div>
                    <div style="text-align:right;">
                        <div style="font-size:11px; font-weight:900; color:#ffd700;">🪙 ${deal.price}</div>
                        <span style="font-size:9px; color:#38bdf8; cursor:pointer;">[입찰/구매]</span>
                    </div>
                `;
                this.marketList.appendChild(row);
            });
        }

        // ==========================================
        // 10. 🎰 실시간 슈퍼/메가 잭팟 전광판 티커
        // ==========================================
        triggerJackpotTicker(username, amount, type = 'MEGA JACKPOT') {
            if (!this.jackpotTickerWrap || !this.jackpotTickerContent) return;

            const formatted = typeof amount === 'number' ? amount.toLocaleString() + ' SP' : amount;
            this.jackpotTickerContent.innerHTML = `
                <div><span class="ticker-user">${username}</span> <span class="ticker-amount">"${formatted}"</span></div>
                <div><span class="ticker-type">${type} WIN!</span></div>
            `;

            this.jackpotTickerWrap.style.display = 'block';

            if (this.tickerTimer) clearTimeout(this.tickerTimer);
            this.tickerTimer = setTimeout(() => {
                this.jackpotTickerWrap.style.display = 'none';
            }, 5000); // 5초 동안 반복 펄스 연출 후 숨김
        }

        startLiveTickerSimulator() {
            // 초기 글로벌 챗 피드
            this.addChatMessage('robinhood', 'x10 Multiplier hit! Massive win today! 🏆', false);
            this.addChatMessage('martin125', 'Heading to Luxury Store for that hypercar! 🏎️', false);

            // 35초마다 서버 공지 전광판 실시간 시뮬레이션
            setInterval(() => {
                const randomUser = LEADERBOARD_USERS[Math.floor(Math.random() * LEADERBOARD_USERS.length)];
                const randomAmount = (Math.floor(Math.random() * 20) + 5) * 1000000; // 500만 ~ 2500만 SP
                this.triggerJackpotTicker(randomUser.username, randomAmount, 'MEGA JACKPOT');
            }, 35000);
        }
    }

    // 전역 안전 인스턴스화
    document.addEventListener('DOMContentLoaded', () => {
        window.avatarSystem = new AvatarSystem();
        window.avatarSystem.init();
    });
})();
