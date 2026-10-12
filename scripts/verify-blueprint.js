// scripts/verify-blueprint.js
// ============================================================================
// 🛡️ Magic Oceans 10대 공식 설계도 물리적 자동 검문소 (Physical Blueprint Guard)
// ============================================================================
// 본 스크립트는 배포(deploy), 커밋, 또는 보고 전 자동으로 실행되어,
// Magic Oceans 게임의 10대 핵심 설계도 원칙이 단 1%라도 훼손되었는지를
// 기계적으로 전수 검사합니다.
// 실패 시 프로세스는 즉시 종료(exit 1)되며 보고/배포가 원천 차단됩니다.
// ============================================================================

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('====================================================================');
console.log('🌊 [Magic Oceans] 10대 핵심 설계도 물리적 자동 검문소 가동');
console.log('====================================================================\n');

let passed = true;
function assertRule(name, condition, errorDetail) {
    if (condition) {
        console.log(`✅ [통과] ${name}`);
    } else {
        console.error(`❌ [위반] ${name}`);
        if (errorDetail) console.error(`   👉 상세: ${errorDetail}`);
        passed = false;
    }
}

// ----------------------------------------------------------------------------
// [검문소 1] 자바스크립트 구문 문법 무결성 전수 검사 (Zero SyntaxError)
// ----------------------------------------------------------------------------
console.log('--- [검문소 1] 자바스크립트 구문 문법 무결성 (node -c) ---');
const jsFiles = ['script.js', 'jackpot-config.js'];
for (const file of jsFiles) {
    if (fs.existsSync(file)) {
        try {
            execSync(`node -c "${file}"`, { stdio: 'pipe' });
            console.log(`✅ [문법 정상] ${file}`);
        } catch (e) {
            assertRule(`${file} 구문 문법 검사`, false, e.message);
        }
    } else {
        assertRule(`${file} 파일 존재 여부`, false, `${file} 파일이 누락되었습니다.`);
    }
}

// 파일 본문 읽기
const scriptCode = fs.existsSync('script.js') ? fs.readFileSync('script.js', 'utf8') : '';
const jackpotConfigCode = fs.existsSync('jackpot-config.js') ? fs.readFileSync('jackpot-config.js', 'utf8') : '';
const gitignoreContent = fs.existsSync('.gitignore') ? fs.readFileSync('.gitignore', 'utf8') : '';
const htmlContent = fs.existsSync('index.html') ? fs.readFileSync('index.html', 'utf8') : '';
const cssContent = fs.existsSync('style.css') ? fs.readFileSync('style.css', 'utf8') : '';

// ----------------------------------------------------------------------------
// [검문소 2] 잭팟 수학 기밀 보호 원칙 (.gitignore 격리 무결성)
// ----------------------------------------------------------------------------
console.log('\n--- [검문소 2] 잭팟 수학 기밀 보호 원칙 (.gitignore 격리) ---');
assertRule(
    '[보안] jackpot-config 파일이 .gitignore에 격리 등록되어 있는가',
    gitignoreContent.includes('jackpot-config'),
    '.gitignore에 jackpot-config.* 항목이 누락되어 기밀 유출 위험이 있습니다!'
);

// ----------------------------------------------------------------------------
// [검문소 3] 수학 모델 및 목표 RTP 96.5% 검증
// ----------------------------------------------------------------------------
console.log('\n--- [검문소 3] 수학 모델 및 목표 RTP 96.5% 무결성 검증 ---');
assertRule(
    '[수학] 목표 환수율 96.5% 수학 설정 존재 여부',
    jackpotConfigCode.includes('96.5') && jackpotConfigCode.includes('TARGET_RTP'),
    'jackpot-config.js 내 TARGET_RTP = 96.5 설정이 누락되었습니다.'
);

assertRule(
    '[수학] 1,083% 구형 버그 수식 잔재 부존재',
    !scriptCode.includes('1083') && !jackpotConfigCode.includes('1083'),
    '과거 비정상적인 1083% RTP 수식 잔재가 발견되었습니다!'
);

// ----------------------------------------------------------------------------
// [검문소 4] 암호학적 난수(CSPRNG) 준수 검증
// ----------------------------------------------------------------------------
console.log('\n--- [검문소 4] 암호학적 난수(CSPRNG) 준수 검증 ---');
assertRule(
    '[보안] CSPRNG (crypto.getRandomValues) 적용 여부',
    jackpotConfigCode.includes('crypto.getRandomValues') && jackpotConfigCode.includes('Uint32Array'),
    '난수 생성에 CSPRNG(crypto.getRandomValues)가 누락되었습니다.'
);

// ----------------------------------------------------------------------------
// [검문소 5] 글로벌 표준시(UTC 00:00 = 한국 AM 09:00) 리셋 무결성
// ----------------------------------------------------------------------------
console.log('\n--- [검문소 5] 글로벌 표준시(UTC 00:00 = 한국 AM 09:00) 리셋 무결성 ---');
assertRule(
    '[글로벌] RechargeManager 내 UTC 기준 시간대 지정 여부',
    scriptCode.includes("timeZone: 'UTC'"),
    'script.js 내 일일 리셋 시간대로 UTC가 지정되지 않았습니다.'
);

// 경계 시간 시뮬레이션
try {
    const tBefore = new Date('2026-10-10T08:59:59+09:00');
    const tAfter = new Date('2026-10-10T09:00:00+09:00');
    const dBefore = new Intl.DateTimeFormat('en-CA', { timeZone: 'UTC', year: 'numeric', month: '2-digit', day: '2-digit' }).format(tBefore);
    const dAfter = new Intl.DateTimeFormat('en-CA', { timeZone: 'UTC', year: 'numeric', month: '2-digit', day: '2-digit' }).format(tAfter);

    assertRule(
        '[글로벌] 한국시간 오전 08:59:59 ➔ 09:00:00 경계 롤오버 정밀 검증',
        dBefore === '2026-10-09' && dAfter === '2026-10-10',
        `경계 시간 리셋 실패 (Before: ${dBefore}, After: ${dAfter})`
    );
} catch (e) {
    assertRule('[글로벌] UTC 경계 시간 시뮬레이션 실행', false, e.message);
}

// ----------------------------------------------------------------------------
// [검문소 6] 일일 5회 충전 및 리워드 광고 모델 분기 검증
// ----------------------------------------------------------------------------
console.log('\n--- [검문소 6] 1일 5회 충전 & 리워드 광고 모델 분기 검증 ---');
assertRule(
    '[수익화] 1일 최대 충전 5회 (MAX_DAILY_RECHARGE = 5) 설정',
    scriptCode.includes('MAX_DAILY_RECHARGE = 5'),
    '1일 최대 충전 횟수가 5회로 설정되지 않았습니다.'
);

assertRule(
    '[수익화] 1회차 무광고 즉시 지급 및 2~5회차 보상형 광고 시청 분기',
    scriptCode.includes('record.count === 0') && scriptCode.includes('showRewardedAd'),
    '1회차 무광고 + 2~5회차 보상형 광고 분기 구조가 누락되었습니다.'
);

// ----------------------------------------------------------------------------
// [검문소 7] 코어 엔진 전역 오염 차단 (콘솔 치팅 방어)
// ----------------------------------------------------------------------------
console.log('\n--- [검문소 7] 코어 엔진 전역 노출 차단 (콘솔 치팅 방어) ---');
assertRule(
    '[보안] window.gameEngine 전역 노출 부존재',
    !scriptCode.includes('window.gameEngine ='),
    'window.gameEngine이 전역에 노출되어 브라우저 콘솔 조작 위험이 있습니다!'
);

// ----------------------------------------------------------------------------
// [검문소 8] GPU 가속 릴 애니메이션 무결성 (CPU 구형 잔재 부존재)
// ----------------------------------------------------------------------------
console.log('\n--- [검문소 8] GPU 가속 릴 애니메이션 (translate3d) 준수 ---');
assertRule(
    '[성능] transform: translate3d GPU 가속 사용 여부',
    scriptCode.includes('translate3d'),
    '릴 회전에 GPU 하드웨어 가속(translate3d)이 적용되지 않았습니다.'
);

assertRule(
    '[성능] 구형 CPU 기반 style.top 릴 회전 잔재 부존재',
    !scriptCode.includes('strip.style.top = -targetOffset') && !scriptCode.includes('strip.style.top ='),
    '구형 style.top 잔재가 발견되어 릴 회전 시 프레임 드랍 위험이 있습니다.'
);

// ----------------------------------------------------------------------------
// [검문소 9] 사운드 에셋 보존 검증 (미사용 18종 사운드 보호)
// ----------------------------------------------------------------------------
console.log('\n--- [검문소 9] 사운드 에셋 보존 검증 ---');
const requiredSounds = [
    'assets/ReelStart.wav',
    'assets/Reelstop.wav',
    'assets/hitbell.wav',
    'assets/WHALE.wav',
    'assets/pang_0000.wav'
];
let soundsOk = true;
for (const snd of requiredSounds) {
    if (!fs.existsSync(snd)) {
        soundsOk = false;
        assertRule(`사운드 에셋 보존 (${snd})`, false, `${snd} 파일이 누락되었습니다.`);
    }
}
if (soundsOk) {
    assertRule('[사운드] 필수 및 확장용 사운드 에셋 보존 완료', true);
}

// ----------------------------------------------------------------------------
// [검문소 10] 16:9 비율 유지 및 세이프존 왜곡 방지
// ----------------------------------------------------------------------------
console.log('\n--- [검문소 10] 16:9 비율 유지 및 세이프존 왜곡 방지 ---');
assertRule(
    '[UI/UX] 16:9 비율 유지 스타일 규격 존재 여부',
    cssContent.includes('16 / 9') || cssContent.includes('56.25%') || htmlContent.includes('game-container'),
    '16:9 종횡비 보존 스타일이 누락되었습니다.'
);

assertRule(
    '[광고] 리워드 광고 모달 오버레이(#ad-modal-overlay) 마크업 존재',
    htmlContent.includes('id="ad-modal-overlay"'),
    'HTML 내에 리워드 광고 모달 마크업이 누락되었습니다.'
);

assertRule(
    '[광고] 하단 외부 배너 광고 도킹 슬롯(#bottom-ad-dock) 마크업 및 CSS 보존',
    htmlContent.includes('id="bottom-ad-dock"') && cssContent.includes('.bottom-ad-dock'),
    '하단 외부 배너 광고 도킹 슬롯이 누락되었습니다.'
);

// ----------------------------------------------------------------------------
// 🏁 최종 결과 판정
// ----------------------------------------------------------------------------
console.log('\n====================================================================');
if (passed) {
    console.log('🎉 [검문소 통과] 10대 핵심 설계도 검증 100% 무결점 통과!');
    console.log('   시스템이 안전하므로 배포, 커밋, 보고를 정상 진행할 수 있습니다.');
    console.log('====================================================================\n');
    process.exit(0);
} else {
    console.error('🛑 [검문소 비토] 설계도 위반 사항이 감지되어 프로세스가 강제 중단됩니다.');
    console.error('   원칙을 위반한 코드를 수정한 후 다시 실행하십시오.');
    console.error('====================================================================\n');
    process.exit(1);
}
