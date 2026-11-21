const speech = () => window.speechSynthesis;
const hasSpeech = () => Boolean(speech() && typeof window.SpeechSynthesisUtterance === 'function');
let pauseCurrent;

export function pauseBookListening() {
  pauseCurrent?.();
}

function mandarinVoice(localOnly) {
  const chinese = speech().getVoices().filter(({ lang, name }) => /^(zh|cmn)(?:[-_]|$)/i.test(lang) &&
    !/[-_](?:HK|yue)(?:[-_]|$)/i.test(lang) && !/Cantonese|粤语|廣東話/i.test(name));
  const local = chinese.filter(voice => voice.localService);
  const mainland = voice => /(?:^|[-_])(?:CN|Hans)(?:[-_]|$)/i.test(voice.lang);
  return local.find(mainland) || local[0] ||
    (!localOnly && (chinese.find(mainland) || chinese[0]));
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
  const href = new URL('book-listening.css?v=20261121-1', import.meta.url).href;
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
    <div class="book-listening-options">
      <label>朗读语速
        <select aria-label="朗读语速">
          <option value="0.8">0.8 倍</option>
          <option value="1" selected>1 倍</option>
          <option value="1.2">1.2 倍</option>
          <option value="1.5">1.5 倍</option>
        </select>
      </label>
      <span>系统普通话朗读 · 自动接续</span>
    </div>
    <p class="book-listening-status" role="status"></p>`;
  document.body.append(dialog);

  const chapter = dialog.querySelector('.book-listening-chapter');
  const play = dialog.querySelector('[data-play]');
  const previous = dialog.querySelector('[data-previous]');
  const next = dialog.querySelector('[data-next]');
  const progress = dialog.querySelector('progress');
  const rate = dialog.querySelector('select');
  const status = dialog.querySelector('[role="status"]');
  let chapterIndex = 0, chunkIndex = 0, chunks = [], utterance, startTimer, request;
  let phase = 'idle';
  const voiceUnavailable = '暂无可用的普通话语音。请在设备设置中启用中文朗读语音，或换一个浏览器试试。';

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
    if (pauseCurrent === pause) pauseCurrent = null;
    if (current) {
      current.onstart = current.onend = current.onerror = null;
      if (cancel) speech()?.cancel();
    }
  }

  function pause() {
    if (phase === 'loading') request?.abort();
    endSpeech(true);
    phase = 'paused';
    render('已暂停');
  }

  async function load(index, continuePlaying = false) {
    if (!chapters[index]) return;
    endSpeech(true);
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

  function speak() {
    const synth = speech();
    const voice = mandarinVoice(localOnly);
    if (!voice && (localOnly || synth.getVoices().length)) {
      phase = 'failed';
      render(localOnly ? '请先在设备上下载普通话系统语音，再重试朗读。' : voiceUnavailable);
      return;
    }

    pauseBookListening();
    beforeSpeak?.();
    const current = new SpeechSynthesisUtterance(chunks[chunkIndex]);
    current.lang = voice?.lang || 'zh-CN';
    if (voice) current.voice = voice;
    current.rate = Number(rate.value);
    utterance = current;
    pauseCurrent = pause;
    if (phase !== 'playing') {
      phase = 'starting';
      render('正在启动朗读…');
    }

    function fail(message) {
      if (utterance !== current) return;
      endSpeech(true);
      phase = 'failed';
      render(message);
    }

    current.onstart = () => {
      if (utterance !== current) return;
      clearTimeout(startTimer);
      if (phase === 'playing') return;
      phase = 'playing';
      render('正在朗读');
    };
    current.onend = () => {
      if (utterance !== current) return;
      endSpeech(false);
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
        : '朗读中断，请点击重试朗读。';
      fail(message);
    };
    startTimer = setTimeout(() => fail('语音暂未启动，请点击重试朗读。'), 10000);
    try { synth.speak(current); } catch { fail('朗读暂无法启动，请重试。'); }
  }

  function close() {
    request?.abort();
    endSpeech(true);
    dialog.close();
  }

  play.onclick = () => {
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
      if (hasSpeech()) speech().getVoices();
      dialog.showModal();
      void load(index);
    },
    destroy() {
      close();
      window.removeEventListener('pagehide', close);
      dialog.remove();
    },
  };
}
