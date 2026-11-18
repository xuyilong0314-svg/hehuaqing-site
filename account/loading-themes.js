const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// Copy is chosen once per wait. These are wishes, never promises about health or outcomes.
export const LOADING_THEMES={
 health:{label:'我就是上医',wishes:['愿你照顾好自己，也温暖身边的人。','愿每一份关照，都落在具体的日常里。','愿我们带着耐心，认真对待每一份感受。']},
 numbers:{label:'认识自己',wishes:['愿每一次认识自己，都多一份理解与从容。','愿你看见自己的特点，也留有成长的空间。','愿你带着好奇认识自己，带着宽容理解彼此。']},
 records:{label:'用心记录',wishes:['愿每一份用心，都留下被看见的痕迹。','愿这些真实的记录，陪你更好地理解自己。','愿每一次回看，都能发现曾经的用心。']},
 self:{label:'听见自己',wishes:['愿你听见身体的感受，按自己的节奏慢慢来。','愿你给今天的自己，多一点耐心与关照。','愿每一次如实记录，都让你更了解自己。']},
 save:{label:'留下这一刻',wishes:['愿今天的小小行动，成为明天的好习惯。','愿你认真走过的每一步，都有迹可循。','愿日常的点滴用心，慢慢积累成自己的力量。']},
 journey:{label:'一路有回应',wishes:['愿一路的变化被看见，一路的努力有回应。','愿回望这些日子时，你能看见自己的坚持。','愿这份记录，让关心你的人更懂你一点。']},
 account:{label:'为你留一盏灯',wishes:['欢迎来到这里，愿你有所收获。','愿这里有一份安静，容得下你的日常。','愿每一次相逢，都带来一点新的收获。']},
 reading:{label:'翻开新的看见',wishes:['愿这一页，为你打开一种新的看见。','愿文字陪你片刻，也留下一点回响。','愿你在别人的故事里，读到自己的答案。']},
 music:{label:'让心安静片刻',wishes:['愿这一段旋律，陪你安放心情。','愿此刻的声音，为你的日常留一点余韵。','愿你在旋律里，遇见一份自在。']},
 welcome:{label:'慢慢相逢',wishes:['愿你在这里，遇见值得停留的片刻。','愿今天的相逢，带来一点新的看见。','愿生活的细微之处，也有光亮。']}
};
export function resolveLoadingTheme({theme,title='',pathname='',hash=''}={}){
 if(LOADING_THEMES[theme])return theme;
 if(/保存|提交.*(记录|自评|感受)|上传|生成方案/.test(title))return 'save';
 if(/登录|注册|账号|邮箱|验证|密码|权限/.test(title))return 'account';
 if(/分享|历程/.test(title))return 'journey';
 const route=pathname+hash;
 if(/\/numbers(?:\/|$)/.test(pathname))return 'numbers';
 if(/\/self(?:\/|$)/.test(pathname))return 'self';
 if(/\/journey(?:\/|$)/.test(pathname))return 'journey';
 if(/\/account(?:\/|$)|#\/(?:auth|login|account|registration)/.test(route))return 'account';
 if(/\/aform(?:\/|$)/.test(pathname))return !hash||hash==='#/'?'health':'records';
 if(/\/zhongyi(?:\/|$)|#(?:zhongyi|health)/.test(route))return 'health';
 if(/\/music(?:\/|$)|#music/.test(route))return 'music';
 if(/\/(?:books|articles|poetry|reading)(?:\/|\.)|#(?:books|articles|article|poetry|reading|read)/.test(route))return 'reading';
 return 'welcome';
}
export function loadingBlessing(theme,random=Math.random){const wishes=(LOADING_THEMES[theme]||LOADING_THEMES.welcome).wishes;return wishes[Math.min(wishes.length-1,Math.max(0,Math.floor(random()*wishes.length)))];}
const paths={
 health:'<circle class="hhq-glow" cx="70" cy="60" r="39"/><path class="hhq-line" d="M70 12C96 25 113 44 113 65S95 108 70 108 27 87 27 65 44 25 70 12Z"/><text class="hhq-motto-small" x="70" y="52">我就是</text><text class="hhq-motto" x="70" y="81">上医</text>',
 numbers:'<path class="hhq-track" d="M70 15 121 103H19Z"/><path class="hhq-line hhq-triangle" d="M70 15 121 103H19Z"/><g class="hhq-number n1"><circle cx="70" cy="20" r="15"/><text x="70" y="26">1</text></g><g class="hhq-number n2"><circle cx="24" cy="99" r="15"/><text x="24" y="105">3</text></g><g class="hhq-number n3"><circle cx="116" cy="99" r="15"/><text x="116" y="105">9</text></g><path class="hhq-track" d="M70 52V88M52 70H88"/>',
 records:'<path class="hhq-paper" d="M32 18H94L110 34V105H32Z"/><path class="hhq-line" d="M94 18V35H110M46 45H89M46 61H96M46 77H90M46 93H75"/><path class="hhq-track" d="M23 28V113H101"/>',
 self:'<path class="hhq-line" d="M69 108V60M69 83C42 85 29 68 29 46 54 45 70 58 69 83M70 68C96 69 112 46 108 25 84 27 68 41 70 68"/><path class="hhq-leaf" d="M75 60C88 51 96 40 101 34M63 76C51 65 42 57 36 53"/><circle class="hhq-drop" cx="47" cy="22" r="4"/>',
 save:'<path class="hhq-paper" d="M28 43Q50 39 70 51 90 39 112 43V107Q90 101 70 112 50 101 28 107Z"/><path class="hhq-track" d="M70 52V111M39 62H57M39 77H57M83 62H101M83 77H101"/><g class="hhq-falling"><path d="M61 12H80M58 23H83M64 34H77"/></g>',
 journey:'<path class="hhq-track" d="M30 101C103 98 30 34 109 20"/><path class="hhq-line" d="M30 101C103 98 30 34 109 20"/><circle class="hhq-stop s1" cx="30" cy="101" r="7"/><circle class="hhq-stop s2" cx="66" cy="70" r="7"/><circle class="hhq-stop s3" cx="67" cy="42" r="7"/><circle class="hhq-stop s4" cx="109" cy="20" r="7"/>',
 account:'<circle class="hhq-glow" cx="70" cy="58" r="40"/><path class="hhq-line" d="M70 12V26M42 40H98L111 81H29ZM70 82V107M47 109H93"/><path class="hhq-track" d="M62 40 55 80M78 40 85 80"/>',
 reading:'<path class="hhq-paper" d="M23 31Q48 25 70 40 92 25 117 31V101Q91 95 70 111 49 95 23 101Z"/><path class="hhq-track" d="M70 40V111M34 47 57 54M34 63 57 70M34 79 57 86M83 54 106 47M83 70 106 63M83 86 106 79"/><path class="hhq-turn" d="M70 40Q80 17 98 15V84Q79 86 70 110Z"/>',
 music:'<path class="hhq-track" d="M18 97H122"/><path class="hhq-note" d="M59 78V28L102 18V68M59 40 102 30"/><ellipse class="hhq-note" cx="48" cy="81" rx="11" ry="7"/><ellipse class="hhq-note" cx="91" cy="71" rx="11" ry="7"/><path class="hhq-wave w1" d="M22 56V76"/><path class="hhq-wave w2" d="M31 46V86"/><path class="hhq-wave w3" d="M119 47V83"/>',
 welcome:'<circle class="hhq-glow" cx="70" cy="60" r="35"/><path class="hhq-line" d="M27 87Q70 104 113 87M38 78Q70 91 102 78M70 32V71M50 51H90"/><circle class="hhq-stop" cx="70" cy="18" r="4"/>'
};
export function loadingArt(theme){const key=paths[theme]?theme:'welcome';return `<div class="hhq-loading-art" data-loading-art="${key}" aria-hidden="true"><svg viewBox="0 0 140 130" focusable="false">${paths[key]}</svg><span class="hhq-art-label">${esc(LOADING_THEMES[key].label)}</span></div>`;}
