'use strict';
const figureDialog = document.querySelector('.figure-dialog');
const dialogImage = figureDialog.querySelector('img');
const dialogCaption = document.getElementById('figure-dialog-caption');
const closeDialog = () => figureDialog.close();
document.querySelectorAll('[data-zoom]').forEach(button => {
  button.addEventListener('click', () => {
    dialogImage.src = button.dataset.zoom;
    dialogImage.alt = button.querySelector('img').alt;
    dialogCaption.textContent = button.dataset.caption;
    figureDialog.showModal();
    document.body.classList.add('dialog-open');
  });
});
figureDialog.querySelector('.dialog-close').addEventListener('click', closeDialog);
figureDialog.addEventListener('close', () => document.body.classList.remove('dialog-open'));
figureDialog.addEventListener('click', event => { if (event.target === figureDialog) closeDialog(); });

/* Values are read from the full manuscript table to keep chart and table in sync. */
const metrics = {
  qns: {description:'Quadruped Navigation Score · higher is better', max:1, mid:'0.5', end:'1.0'},
  ade: {description:'Average displacement error · lower is better', max:0.1, mid:'0.05', end:'0.10'},
  fde: {description:'Final displacement error · lower is better', max:0.18, mid:'0.09', end:'0.18'},
  fhe: {description:'Final heading error · lower is better', max:0.07, mid:'0.035', end:'0.070'}
};
const resultData = [...document.querySelectorAll('#full-results tbody tr')].map(row => ({
  model:row.dataset.model,
  values:Object.fromEntries([...row.querySelectorAll('[data-metric]')].map(cell => [cell.dataset.metric,Number(cell.textContent)]))
}));
const chart = document.querySelector('.bar-chart');
document.querySelectorAll('.metric-options button').forEach(button => {
  button.addEventListener('click', () => {
    const key = button.dataset.metric;
    const metric = metrics[key];
    document.querySelectorAll('.metric-options button').forEach(option => option.setAttribute('aria-pressed',String(option === button)));
    document.getElementById('metric-description').textContent = metric.description;
    document.getElementById('scale-mid').textContent = metric.mid;
    document.getElementById('scale-max').textContent = metric.end;
    const sorted = resultData.filter(item => item.model !== 'DR-VLA w/o web').sort((a,b) => key === 'qns' ? b.values[key]-a.values[key] : a.values[key]-b.values[key]);
    sorted.forEach(item => {
      const row = [...chart.children].find(child => child.dataset.model === item.model);
      row.querySelector('.bar-value').textContent = item.values[key].toFixed(3);
      row.querySelector('.bar-fill').style.setProperty('--bar', `${item.values[key]/metric.max*100}%`);
      chart.append(row);
    });
  });
});
let statusTimer;
const status = document.querySelector('.live-status');
const announce = message => {
  status.textContent = message;
  clearTimeout(statusTimer);
  statusTimer = setTimeout(() => status.textContent = '',3500);
};
document.getElementById('copy-citation').addEventListener('click', async () => {
  const text = document.getElementById('bibtex').textContent;
  try {
    if (navigator.clipboard && window.isSecureContext && location.protocol !== 'file:') await navigator.clipboard.writeText(text);
    else {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.append(textarea);
      textarea.select();
      const copied = document.execCommand('copy');
      textarea.remove();
      if (!copied) throw new Error('Clipboard unavailable');
    }
    announce('BibTeX copied');
  } catch {
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(document.getElementById('bibtex'));
    selection.removeAllRanges();
    selection.addRange(range);
    announce('Citation selected. Press Ctrl+C or ⌘C to copy.');
  }
});

/* Play visible clips only; retain a visitor's individual pause choice. */
const navigationVideos = [...document.querySelectorAll('.navigation-video')];
const motionToggle = document.querySelector('.motion-toggle');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const connection = navigator.connection;
const autoPlaybackAllowed = () => !reducedMotion.matches && !connection?.saveData;
const videoStates = new Map(navigationVideos.map(video => [video, {
  video, visible:false, userPaused:false, automaticPauses:0, automaticPlayPending:false
}]));
const updateMotionToggle = () => {
  const playing = navigationVideos.some(video => !video.paused && !video.ended);
  motionToggle.classList.toggle('is-playing',playing);
  motionToggle.querySelector('span').textContent = playing ? 'Pause videos' : 'Play videos';
  motionToggle.setAttribute('aria-label',playing ? 'Pause navigation videos' : 'Play visible navigation videos');
};
const pauseAutomatically = state => {
  if (!state.video.paused) {
    state.automaticPauses += 1;
    state.video.pause();
  }
};
const mayAutoPlay = state => state.visible && !document.hidden && !state.userPaused && autoPlaybackAllowed();
const manageVideo = state => {
  if (mayAutoPlay(state)) {
    if (state.video.paused && !state.automaticPlayPending) {
      state.automaticPlayPending = true;
      state.video.play().then(() => {
        if (!mayAutoPlay(state)) pauseAutomatically(state);
      }).catch(() => { /* The native play control remains available if autoplay is blocked. */ })
        .finally(() => {state.automaticPlayPending = false;});
    }
  } else pauseAutomatically(state);
};
navigationVideos.forEach(video => {
  const state = videoStates.get(video);
  video.muted = true;
  video.addEventListener('play',() => {
    if (!state.automaticPlayPending) state.userPaused = false;
    else if (!mayAutoPlay(state)) pauseAutomatically(state);
    updateMotionToggle();
  });
  video.addEventListener('pause',() => {
    if (state.automaticPauses > 0) state.automaticPauses -= 1;
    else state.userPaused = true;
    updateMotionToggle();
  });
  video.addEventListener('error',() => {
    video.closest('.video-card').querySelector('.video-error').hidden = false;
    updateMotionToggle();
  });
});
if ('IntersectionObserver' in window) {
  const videoObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      const state = videoStates.get(entry.target);
      state.visible = entry.isIntersecting && entry.intersectionRatio >= .25;
      manageVideo(state);
    });
  },{threshold:[0,.25]});
  navigationVideos.forEach(video => videoObserver.observe(video));
} else {
  /* Older browsers use native, user-initiated playback. */
  videoStates.forEach(state => {state.visible = true;});
}
document.addEventListener('visibilitychange',() => videoStates.forEach(manageVideo));
reducedMotion.addEventListener('change',() => videoStates.forEach(manageVideo));
connection?.addEventListener('change',() => videoStates.forEach(manageVideo));
motionToggle.addEventListener('click',() => {
  if (navigationVideos.some(video => !video.paused)) {
    videoStates.forEach(state => {state.userPaused = true; state.video.pause();});
  } else {
    videoStates.forEach(state => {
      state.userPaused = false;
      if (state.visible) state.video.play().catch(() => {});
    });
  }
  updateMotionToggle();
});
motionToggle.hidden = false;
updateMotionToggle();
