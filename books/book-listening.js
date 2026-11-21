const speech = () => window.speechSynthesis;
const hasSpeech = () => Boolean(speech() && typeof window.SpeechSynthesisUtterance === 'function');
const settingsKey = 'hhq-book-listening-voice-v1';
const auditionText = '欢迎来到何华清的书房。翻开一页书，让我们从这里读起。';
const tones = { natural: 1, soft: 0.94, deep: 0.85 };
let pauseCurrent;

export function pauseBookListening() {
  pauseCurrent?.();
}

function voiceId(voice) {
  return JSON.stringify([voice.voiceURI, voice.name, voice.lang, voice.localService]);
}

function voiceQuality(voice) {
  const descriptor = voice.name + ' ' + voice.voiceURI;
  if (/natural|neural|自然|神经/i.test(descriptor)) return '自然语音';
  if (/premium|enhanced|优化音质|增强|进阶|高品质/i.test(descriptor)) return '优化音质';
  return '';
}

function voiceLabel(voice, short = false) {
  const name = voice.name
    .replace(/^Microsoft\s+/i, '')
    .replace(/\s+-\s+Chinese.*$/i, '')
    .replace(/\s*\((?:中文|Chinese|Mandarin).*$/i, '')
    .replace(/\s+Online(?=\s|$)/i, '')
    .replace(/\s*\((?:Natural|Enhanced|Premium)\)$/i, '')
    .trim();
  const chineseName = { xiaoxiao: '晓晓', xiaoyi: '晓伊', yunxi: '云希', yunyang: '云扬', tingting: '婷婷', meijia: '美佳' }[name.toLowerCase()];
  const displayName = typeof chineseName === 'string' ? chineseName : (name || voice.name);
  if (short) return displayName;
  const language = /[-_]TW(?:[-_]|$)/i.test(voice.lang) ? '台湾普通话' : '';
  return [displayName, voiceQuality(voice), language].filter(Boolean).join(' · ');
}

function mandarinVoices(voices, localOnly) {
  const eligible = new Map();
  for (const voice of voices) {
    if (localOnly && voice.localService !== true) continue;
    if (!/^(zh|cmn)(?:[-_]|$)/i.test(voice.lang) || /[-_](?:HK|yue)(?:[-_]|$)/i.test(voice.lang) ||
      /Cantonese|粤语|粵語|广东话|廣東話/i.test(voice.name)) continue;
    eligible.set(voiceId(voice), voice);
  }
  const score = voice => (voice.localService === true ? 0 : 16) +
    (/(?:^|[-_])(?:CN|Hans)(?:[-_]|$)/i.test(voice.lang) ? 0 : 8) +
    (voiceQuality(voice) ? 0 : 4) + (voice.default ? 0 : 2);
  return [...eligible.values()].sort((a, b) => score(a) - score(b));
}

function readVoiceSettings() {
  try {
    const settings = JSON.parse(localStorage.getItem(settingsKey));
    return {
      voice: typeof settings?.voice === 'string' ? settings.voice : '',
      tone: Object.keys(tones).includes(settings?.tone) ? settings.tone : 'natural',
    };
  } catch {
    return { voice: '', tone: 'natural' };
  }
}

function speechChunks(body, title) {
  const template = document.createElement('template');
  if (typeof body === 'string') template.innerHTML = body;
  const copy = typeof body === 'string' ? template.content : body.cloneNode(true);
  copy.querySelectorAll('script,style,button,nav,figure,[hidden],[aria-hidden="true"],.poem-original-page').forEach(node => node.remove());
  copy.querySelectorAll('br').forEach(node => node.replaceWith('\n'));
  copy.querySelectorAll('h1,h2,h3,h4,p,li,dt,dd,tr,pre,.poem-line').forEach(node => node.append('\n'));
  copy.querySelectorAll('td,th').forEach(node => node.append('，'));
  const lines = copy.textContent.split(/\n+/).map(line => line.replace(/\s+/gu, ' ').trim()).filter(Boolean);
  if (lines.length === 0) return [];
  if (title && !lines[0].includes(title)) lines.unshift(title);

  const chunks = [];
  for (const line of lines) {
    const characters = Array.from(line);
    let offset = 0;
    while (offset < characters.length) {
      let end = Math.min(offset + 80, characters.length);
      if (end < characters.length) {
        for (let split = end; split > offset + 35; split--) {
          if (/[。！？；，、!?;,\s]/u.test(characters[split - 1])) { end = split; break; }
        }
      }
      chunks.push(characters.slice(offset, end).join('').trim());
      offset = end;
    }
  }
  return chunks.filter(Boolean);
}

function appendStyle() {
  const href = new URL('book-listening.css?v=20261121-voices', import.meta.url).href;
  if ([...document.querySelectorAll('link[rel="stylesheet"]')].some(link => link.href === href)) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  document.head.append(link);
}

export function createBookListening({ chapters, getBody, beforeSpeak, localOnly = false }) {
  appendStyle();
  const dialog = document.createElement('dialog');
  dialog.className = 'book-listening-dialog';
  dialog.setAttribute('aria-label', '听书');
  dialog.innerHTML = `
    <div class="book-listening-head">
      <h2>听书</h2>
      <button type="button" data-close>关闭</button>
    </div>
    <p class="book-listening-chapter"></p>
    <progress max="1" value="0" aria-label="本章朗读进度"></progress>
    <div class="book-listening-transport">
      <button type="button" data-previous>上一章</button>
      <button type="button" data-play>开始朗读</button>
      <button type="button" data-next>下一章</button>
    </div>
    <div class="book-listening-voice-settings">
      <div class="book-listening-voice">
        <label>普通话音色
          <select data-voice aria-label="普通话音色"></select>
        </label>
        <button type="button" data-audition>试听</button>
      </div>
      <div class="book-listening-options">
        <label>语速
          <select data-rate aria-label="朗读语速">
            <option value="0.8">0.8 倍</option>
            <option value="1" selected>1 倍</option>
            <option value="1.2">1.2 倍</option>
            <option value="1.5">1.5 倍</option>
          </select>
        </label>
        <label>语调
          <select data-tone aria-label="朗读语调">
            <option value="natural">自然</option>
            <option value="soft">柔和</option>
            <option value="deep">沉稳</option>
          </select>
        </label>
      </div>
      <p class="book-listening-voice-status" role="status"></p>
    </div>
    <p class="book-listening-status" role="status"></p>`;
  document.body.append(dialog);

  const chapter = dialog.querySelector('.book-listening-chapter');
  const play = dialog.querySelector('[data-play]');
  const previous = dialog.querySelector('[data-previous]');
  const next = dialog.querySelector('[data-next]');
  const progress = dialog.querySelector('progress');
  const synth = speech();
  const settingsPanel = dialog.querySelector('.book-listening-voice-settings');
  const voicePicker = dialog.querySelector('[data-voice]');
  const audition = dialog.querySelector('[data-audition]');
  const rate = dialog.querySelector('[data-rate]');
  const tone = dialog.querySelector('[data-tone]');
  const voiceStatus = dialog.querySelector('.book-listening-voice-status');
  const status = dialog.querySelector('.book-listening-status');
  let chapterIndex = 0, chunkIndex = 0, chunks = [], utterance, startTimer, request;
  let phase = 'idle';
  let settings, voiceHint = '', voiceMessage = '', auditioning = false;
  const voiceUnavailable = '暂无可用的普通话语音。请在设备设置中启用中文朗读语音，或换一个浏览器试试。';

  function showVoiceMessage(message = voiceMessage) {
    voiceMessage = message;
    voiceStatus.textContent = message || voiceHint;
  }

  function refreshVoices() {
    if (!dialog.open || !hasSpeech()) return;
    const available = synth.getVoices();
    const voices = mandarinVoices(available, localOnly);
    const recommended = voices[0];
    voiceHint = '';
    if (voices.length === 1) voiceHint = '当前只有一种普通话音色，可试试不同语调。';
    if (!recommended) {
      voiceHint = localOnly || available.length ? '可在设备设置中启用普通话语音。' : '暂无可选音色，可先试听系统语音。';
    }
    voicePicker.replaceChildren(new Option(recommended ? '推荐 · ' + voiceLabel(recommended, true) : '系统普通话', ''));
    for (const [isLocal, groupName] of [[true, '本机音色'], [false, '联网音色']]) {
      const group = document.createElement('optgroup');
      group.label = groupName;
      for (const voice of voices.filter(item => (item.localService === true) === isLocal)) {
        group.append(new Option(voiceLabel(voice), voiceId(voice)));
      }
      if (group.children.length) voicePicker.append(group);
    }
    voicePicker.value = voices.some(voice => voiceId(voice) === settings.voice) ? settings.voice : '';
    voicePicker.disabled = !recommended;
    showVoiceMessage();
  }

  function changeSettings(update) {
    if (auditioning) endSpeech(true);
    settings = { ...settings, ...update };
    try { localStorage.setItem(settingsKey, JSON.stringify(settings)); } catch { /* The current panel remains usable. */ }
    showVoiceMessage();
  }

  function render(message = '') {
    const item = chapters[chapterIndex];
    chapter.textContent = item.title;
    previous.disabled = chapterIndex === 0;
    next.disabled = chapterIndex >= chapters.length - 1;
    progress.value = chunks.length ? chunkIndex / chunks.length : 0;
    play.disabled = phase === 'loading' || phase === 'unavailable';
    play.textContent = {
      starting: '暂停', playing: '暂停', paused: '继续朗读', complete: '重听本章', failed: '重试朗读',
    }[phase] || '开始朗读';
    status.textContent = message;
  }

  function endSpeech(cancel) {
    const current = utterance;
    utterance = null;
    clearTimeout(startTimer);
    if (auditioning) {
      auditioning = false;
      audition.textContent = '试听';
    }
    if (pauseCurrent === pause) pauseCurrent = null;
    if (current) {
      current.onstart = current.onend = current.onerror = null;
      if (cancel) speech()?.cancel();
    }
  }

  function pause() {
    if (auditioning) {
      endSpeech(true);
      showVoiceMessage('试听已停止');
      return;
    }
    if (phase === 'loading') request?.abort();
    endSpeech(true);
    phase = 'paused';
    render('已暂停');
  }

  async function load(index, continuePlaying = false) {
    if (!chapters[index]) return;
    endSpeech(true);
    showVoiceMessage('');
    request?.abort();
    const controller = new AbortController();
    request = controller;
    chapterIndex = index;
    chunkIndex = 0;
    chunks = [];
    if (!hasSpeech()) {
      phase = 'unavailable';
      render('此浏览器暂不支持听书。');
      return;
    }
    phase = 'loading';
    if (continuePlaying) pauseCurrent = pause;
    render('正在准备本章…');
    try {
      const body = await getBody(chapters[index].id, controller.signal);
      if (controller.signal.aborted) return;
      if (pauseCurrent === pause) pauseCurrent = null;
      chunks = speechChunks(body, chapters[index].title);
      if (!chunks.length) {
        phase = 'unavailable';
        render('本章没有可朗读的正文。');
        return;
      }
      phase = 'idle';
      render();
      if (continuePlaying) speak();
    } catch {
      if (controller.signal.aborted) return;
      if (pauseCurrent === pause) pauseCurrent = null;
      phase = 'failed';
      render('本章暂时未能载入，请重试。');
    }
  }

  function speak(sample = false) {
    const allVoices = synth.getVoices();
    const voices = mandarinVoices(allVoices, localOnly);
    const voice = voices.find(item => voiceId(item) === settings.voice) || voices[0];

    function reportFailure(message) {
      if (sample) showVoiceMessage(message);
      else { phase = 'failed'; render(message); }
    }

    if (!voice && (localOnly || allVoices.length)) {
      reportFailure(localOnly ? '请先在设备上下载普通话系统语音，再重试朗读。' : voiceUnavailable);
      return;
    }

    pauseBookListening();
    beforeSpeak?.();
    const current = new SpeechSynthesisUtterance(sample ? auditionText : chunks[chunkIndex]);
    current.lang = voice?.lang || 'zh-CN';
    if (voice) current.voice = voice;
    current.pitch = tones[settings.tone];
    current.rate = Number(rate.value);
    utterance = current;
    pauseCurrent = pause;

    if (sample) {
      auditioning = true;
      audition.textContent = '停止试听';
      showVoiceMessage('正在准备试听…');
    } else if (phase !== 'playing') {
      showVoiceMessage('');
      phase = 'starting';
      render('正在启动朗读…');
    }

    function fail(message) {
      if (utterance !== current) return;
      endSpeech(true);
      reportFailure(message);
    }

    current.onstart = () => {
      if (utterance !== current) return;
      clearTimeout(startTimer);
      if (sample) showVoiceMessage('正在试听');
      else if (phase !== 'playing') {
        phase = 'playing';
        render('正在朗读');
      }
    };
    current.onend = () => {
      if (utterance !== current) return;
      endSpeech(false);
      if (sample) {
        showVoiceMessage('试听结束');
        return;
      }
      chunkIndex += 1;
      progress.value = chunkIndex / chunks.length;
      if (chunkIndex < chunks.length) speak();
      else if (chapterIndex + 1 < chapters.length) void load(chapterIndex + 1, true);
      else {
        phase = 'complete';
        render('全书已听完。');
      }
    };
    current.onerror = event => {
      const message = ['language-unavailable', 'voice-unavailable', 'synthesis-unavailable'].includes(event.error)
        ? voiceUnavailable
        : sample ? '试听中断，请重试。' : '朗读中断，请点击重试朗读。';
      fail(message);
    };
    startTimer = setTimeout(() => fail('语音暂未启动，请重试。'), 10000);
    try { synth.speak(current); } catch { fail('语音暂无法启动，请重试。'); }
  }

  function close() {
    request?.abort();
    endSpeech(true);
    dialog.close();
  }

  voicePicker.onchange = () => changeSettings({ voice: voicePicker.value });
  tone.onchange = () => changeSettings({ tone: tone.value });
  audition.onclick = () => {
    if (auditioning) pause();
    else {
      refreshVoices();
      speak(true);
    }
  };
  synth?.addEventListener?.('voiceschanged', refreshVoices);

  play.onclick = () => {
    refreshVoices();
    if (phase === 'playing' || phase === 'starting') pause();
    else if (!chunks.length) void load(chapterIndex);
    else {
      if (phase === 'complete') chunkIndex = 0;
      speak();
    }
  };
  previous.onclick = () => void load(chapterIndex - 1);
  next.onclick = () => void load(chapterIndex + 1);
  dialog.querySelector('[data-close]').onclick = close;
  dialog.addEventListener('cancel', event => { event.preventDefault(); close(); });
  window.addEventListener('pagehide', close);

  return {
    open(id) {
      if (dialog.open) return;
      const index = Math.max(0, chapters.findIndex(item => item.id === id));
      settings = readVoiceSettings();
      settingsPanel.hidden = !hasSpeech();
      tone.value = settings.tone;
      dialog.showModal();
      refreshVoices();
      void load(index);
    },
    destroy() {
      close();
      window.removeEventListener('pagehide', close);
      synth?.removeEventListener?.('voiceschanged', refreshVoices);
      dialog.remove();
    },
  };
}
