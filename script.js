// ==========================================
// 🔊 오디오 지연(Latency) 제로 세팅
// ==========================================
const soundSpin = new Audio('assets/ReelStart.wav');
const soundStop = new Audio('assets/Reelstop.wav');

soundSpin.loop = true;
soundSpin.preload = 'auto';
soundStop.preload = 'auto';

window.isSoundOn = true;

function playSound(type) {
    if (window.isSoundOn === false) return;

    if (type === 'spin') {
        soundSpin.currentTime = 0;
        soundSpin.play().catch(() => {});
    } else if (type === 'stop') {
        try {
            const stopInstance = soundStop.cloneNode();
            stopInstance.currentTime = 0.04; // 무음 공백 건너뛰기
            stopInstance.volume = 1.0;
            stopInstance.play().catch(() => {});
        } catch (e) {
            soundStop.currentTime = 0.04;
            soundStop.play().catch(() => {});
        }
    }
}

function stopSpinSound() {
    soundSpin.pause();
    soundSpin.currentTime = 0;
}

function move(id, prop, delta) {
    const el = document.getElementById(id);
    if (!el) return;
    const currentVal = window.getComputedStyle(el)[prop];

    if (currentVal.includes('%')) {
        const num = parseFloat(currentVal);
        el.style[prop] = (num + (delta * 0.1)) + '%';
    } else {
        const num = parseInt(currentVal);
        el.style[prop] = (num + delta) + 'px';
    }
    updateCoords();
}

function updateCoords() {
    const targets = ['multiplier-window', 'reels-wrapper', 'btn-spin', 'btn-auto', 'bet-box'];
    let text = "";
    targets.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            text += `${id}: top:${el.style.top}, left:${el.style.left}\n`;
        }
    });
    const coordsDisplay = document.getElementById('coords-display');
    if (coordsDisplay) coordsDisplay.innerText = text;
}

let isSpinning = false;
let spinIntervals = [];

// ==========================================
// 🎰 릴 스핀 및 순차 정지 + 사운드 연동
// ==========================================
function spin(onComplete) {
    if (isSpinning) return;
    isSpinning = true;

    // 🔊 회전 사운드 재생
    playSound('spin');

    const strips = ['reel1-strip', 'reel2-strip', 'reel3-strip'];
    spinIntervals = [];

    // 1. 일반 심볼 릴 초고속 회전 (8~15바퀴 고속 질주)
    strips.forEach((id, index) => {
        const strip = document.getElementById(id);
        if (!strip) return;

        strip.innerHTML = '';
        for (let i = 0; i < 10; i++) {
            const img = document.createElement('img');
            const randNum = Math.floor(Math.random() * 12) + 1;
            img.src = `assets/sym_${String(randNum).padStart(2, '0')}.png`;
            img.onerror = function() { this.src = `assets/sym_01.png`; };
            strip.appendChild(img);
        }

        let currentPos = -500;
        // ⚡ 이동량을 50px로 늘리고 간격을 10ms로 줄여 초고속 회전 구현 (1바퀴당 0.1초)
        const interval = setInterval(() => {
            currentPos += 50; 
            if (currentPos >= 0) currentPos = -500;
            strip.style.top = currentPos + 'px';
        }, 10 + (index * 2));

        spinIntervals.push({ interval, id, strip });
    });

    // 2. 배당 릴 초고속 회전
    const multStrip = document.getElementById('multiplier-strip');
    let multIntervalObj = null;
    if (multStrip) {
        let multPos = -600;
        const multInterval = setInterval(() => {
            multPos += 45; // ⚡ 배당릴도 고속 회전 (기존 15 -> 45)
            if (multPos >= 0) multPos = -600;
            multStrip.style.top = multPos + 'px';
        }, 10);
        multIntervalObj = { interval: multInterval, strip: multStrip };
    }

    // 3. 순차 정지 시퀀스
    const reelStrips = spinIntervals;

    // [Step 1] 1번 릴 정지
    setTimeout(() => {
        stopSingleReel(reelStrips[0]);

        // [Step 2] 0.5초 후 2번 릴 정지
        setTimeout(() => {
            stopSingleReel(reelStrips[1]);

            // [Step 3] 0.5초 후 3번 릴 정지 (즉시 사운드 전환)
            setTimeout(() => {
                stopSpinSound();
                playSound('stop');
                stopSingleReel(reelStrips[2]);

                // [Step 4] 3번 릴 정지 후 1.0초 뒤 배당 릴 정지
                setTimeout(() => {
                    if (multIntervalObj) {
                        clearInterval(multIntervalObj.interval);

                        playSound('stop');

                        const finalMult = Math.floor(Math.random() * 6);
                        const imgHeight = multIntervalObj.strip.firstElementChild ? multIntervalObj.strip.firstElementChild.offsetHeight : 50;
                        
                        multIntervalObj.strip.style.transition = 'top 0.3s ease-out';
                        multIntervalObj.strip.style.top = `-${finalMult * imgHeight}px`;

                        setTimeout(() => {
                            multIntervalObj.strip.style.transition = 'none';
                            isSpinning = false;

                            if (typeof onComplete === 'function') {
                                onComplete();
                            }
                        }, 300);
                    } else {
                        isSpinning = false;
                        if (typeof onComplete === 'function') onComplete();
                    }
                }, 1000); // 3번 릴 정지 1초 후 배당릴 정지

            }, 500); // 2번 릴 정지 0.5초 후 3번 릴 정지

        }, 500); // 1번 릴 정지 0.5초 후 2번 릴 정지

    }, 1500); // 기본 회전 시간
}

function stopSingleReel(reelObj) {
    if (!reelObj) return;
    clearInterval(reelObj.interval);
    reelObj.strip.style.top = '0px';
    reelObj.strip.innerHTML = '';

    const finalImg = document.createElement('img');
    const randNum = Math.floor(Math.random() * 12) + 1;
    finalImg.src = `assets/sym_${String(randNum).padStart(2, '0')}.png`;
    finalImg.onerror = function() { this.src = `assets/sym_01.png`; };
    reelObj.strip.appendChild(finalImg);
}

// ==========================================
// 🔄 AUTO SPIN 제어
// ==========================================
window.isAutoSpinning = false;
window.autoSpinRemaining = 0;
let autoSpinTimer = null;

window.startAutoSpin = function(count) {
    if (window.isAutoSpinning) return;
    
    window.isAutoSpinning = true;
    window.autoSpinRemaining = count;

    const btnAuto = document.getElementById('btn-auto');
    if (btnAuto) btnAuto.classList.add('active');

    runNextAutoSpin();
};

function runNextAutoSpin() {
    if (!window.isAutoSpinning || window.autoSpinRemaining <= 0) {
        window.stopAutoSpin();
        return;
    }

    if (window.autoSpinRemaining !== Infinity) {
        window.autoSpinRemaining--;
    }

    spin(() => {
        if (window.isAutoSpinning) {
            autoSpinTimer = setTimeout(() => {
                if (window.isAutoSpinning) {
                    runNextAutoSpin();
                }
            }, 1000);
        }
    });
}

window.stopAutoSpin = function() {
    window.isAutoSpinning = false;
    window.autoSpinRemaining = 0;
    
    if (autoSpinTimer) {
        clearTimeout(autoSpinTimer);
        autoSpinTimer = null;
    }

    const btnAuto = document.getElementById('btn-auto');
    if (btnAuto) btnAuto.classList.remove('active');
};

// 일반 스핀 버튼 클릭 이벤트
document.addEventListener('click', (e) => {
    if (e.target.closest('#btn-spin')) {
        spin();
    }
});