/* ...existing code... */
import { set as idbSet, get as idbGet } from "idb-keyval";

const els = {
  pick: document.getElementById("btn-pick-tab"),
  start: document.getElementById("btn-start"),
  stop: document.getElementById("btn-stop"),
  split: document.getElementById("btn-split"),
  grid: document.getElementById("clips-grid"),
  navUrl: document.getElementById("nav-url"),
  navGo: document.getElementById("nav-go"),
  autoSplit: document.getElementById("auto-split-on-nav"),
  navigator: document.getElementById("navigator"),
  composeBtn: document.getElementById("btn-compose"),
  composeStatus: document.getElementById("compose-status"),
  autoSplitCaptured: document.getElementById("auto-split-captured"),
  modalBackdrop: document.getElementById('modal-backdrop'),
  modalVideo: document.getElementById('modal-video'),
  modalClose: document.getElementById('modal-close'),
  outroGrid: document.getElementById('outro-audio-grid'),
};

let captureStream = null;
let recorder = null;
let chunks = [];
let clips = [];
let recording = false;
let currentClipStart = null;
let monitoredUrl = null;
let capMon = { interval: null, videoEl: null, canvas: null, ctx: null };
let selectedOutro = { 
  file: "/hey_hype_radio (2).mp3",
  id: "hype_radio_2",
  region: null
};

const OUTRO_CLIPS = [
  { id: "clean_bright_f", label: "Clean Bright F", file: "/hey_clean_bright_f.mp3" },
  { id: "clean_bright_m", label: "Clean Bright M", file: "/hey_clean_bright_m.mp3" },
  { id: "hype_radio_2", label: "Hype Radio", file: "/hey_hype_radio (2).mp3" },
  { id: "whisper", label: "Whisper", file: "/hey_whisper.mp3" },
  { id: "robotic", label: "Robotic", file: "/hey_robotic.mp3" },
  { id: "retro_8bit", label: "Retro 8-Bit", file: "/hey_retro_8bit.mp3" },
  { id: "cinematic", label: "Cinematic", file: "/hey_cinematic.mp3" },
  { id: "telephone", label: "Telephone", file: "/hey_telephone.mp3" },
  { id: "short_snap", label: "Short Snap", file: "/hey_short_snap.mp3" },
  { id: "long_tag", label: "Long Tag", file: "/hey_long_tag.mp3" },
  { id: "chorus", label: "Chorus", file: "/hey_chorus.mp3" },
  { id: "dark_trailer", label: "Dark Trailer", file: "/hey_dark_trailer.mp3" },
  { id: "navi", label: "Navi Fairy", file: "/hey_navi.mp3" },
  { id: "autotune_pop", label: "Auto-Tune Pop", file: "/hey_autotune_pop.mp3" },
  { id: "vaporwave", label: "Vaporwave", file: "/hey_vaporwave.mp3" },
  { id: "tts_flat", label: "TTS Flat", file: "/hey_tts_flat.mp3" },
  { id: "metal_scream", label: "Metal Scream", file: "/hey_metal_scream.mp3" },
  { id: "country_drawl", label: "Country Drawl", file: "/hey_country_drawl.mp3" },
  { id: "synthwave_lead", label: "Synthwave Lead", file: "/hey_synthwave_lead.mp3" },
  { id: "airport_pa", label: "Airport PA", file: "/hey_airport_pa.mp3" },
  { id: "cartoon_bounce", label: "Cartoon Bounce", file: "/hey_cartoon_bounce.mp3" },
  { id: "barbershop_quartet", label: "Barbershop Quartet", file: "/hey_barbershop_quartet.mp3" },
  { id: "crowd_chant", label: "Crowd Chant", file: "/hey_crowd_chant.mp3" },
  { id: "binaural_asmr", label: "Binaural ASMR", file: "/hey_binaural_asmr.mp3" },
  { id: "space_astronaut", label: "Space Astronaut", file: "/hey_space_astronaut.mp3" },
  { id: "opera_vibrato", label: "Opera Vibrato", file: "/hey_opera_vibrato.mp3" },
  { id: "brit_announce", label: "British Announcer", file: "/hey_brit_announce.mp3" },
  { id: "sports_announce", label: "Sports Announcer", file: "/hey_sports_announce.mp3" },
  { id: "choir_epic", label: "Epic Choir", file: "/hey_choir_epic.mp3" },
  { id: "gameshow_hype", label: "Game Show Hype", file: "/hey_gameshow_hype.mp3" },
  { id: "soft_piano_bed", label: "Soft Piano Bed", file: "/hey_soft_piano_bed.mp3" },
  { id: "lofi_tape", label: "Lo-Fi Tape", file: "/hey_lofi_tape.mp3" },
  { id: "monster_low", label: "Monster Low", file: "/hey_monster_low.mp3" },
  { id: "child_joy", label: "Child Joy", file: "/hey_child_joy.mp3" },
  { id: "glitch_fx", label: "Glitch FX", file: "/hey_glitch_fx.mp3" },
  { id: "jazz_scat", label: "Jazz Scat", file: "/hey_jazz_scat.mp3" },
  { id: "surfer_dude", label: "Surfer Dude", file: "/hey_surfer_dude.mp3" },
  { id: "goth_whisper", label: "Goth Whisper", file: "/hey_goth_whisper.mp3" },
  { id: "french_rp", label: "French Accent", file: "/hey_french_rp.mp3" },
  { id: "spanish_tv", label: "Spanish TV", file: "/hey_spanish_tv.mp3" },
  { id: "anime_hype", label: "Anime Hype", file: "/hey_anime_hype.mp3" },
  { id: "newscaster", label: "News Anchor", file: "/hey_newscaster.mp3" },
  { id: "drill_sergeant", label: "Drill Sergeant", file: "/hey_drill_sergeant.mp3" },
  { id: "pirate", label: "Pirate", file: "/hey_pirate.mp3" },
  { id: "beatbox_tag", label: "Beatbox", file: "/hey_beatbox_tag.mp3" },
  { id: "cowboy_quick", label: "Cowboy", file: "/hey_cowboy_quick.mp3" },
  { id: "medieval_towncrier", label: "Town Crier", file: "/hey_medieval_towncrier.mp3" },
];

const DEFAULT_OUTRO_REGIONS = new Map([
  ["clean_bright_f",[0.32,1.43]],["clean_bright_m",[0.34,1.46]],
  ["retro_8bit",[0.11,1.20]],["robotic",[0.33,1.43]],
  ["cinematic",[0.04,1.80]],["country_drawl",[2.04,3.95]],
  ["tts_flat",[2.25,3.90]],["binaural_asmr",[2.40,3.75]],
  ["lofi_tape",[2.23,3.80]],["child_joy",[1.10,2.90]],["sports_announce",[1.39,3.80]],
]);

function createAudioPlayer() {
  let audioContext;
  const audioBuffers = new Map();
  let source = null, currentId = null, startTime = 0, currentDur = 0, currentRegionNorm = null;

  const initContext = () => {
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
  };

  document.addEventListener('click', initContext, { once: true });
  document.addEventListener('keydown', initContext, { once: true });

  const ensureBuffer = async (id, file) => {
    if (!audioContext) initContext(); let buf = audioBuffers.get(id);
    if (buf) return buf;
    const res = await fetch(file); const ab = await res.arrayBuffer();
    buf = await audioContext.decodeAudioData(ab); audioBuffers.set(id, buf); return buf;
  };

  const play = async (id, file, { gain = 1.0, onEnded = () => {}, regionSec = null } = {}) => {
    if (!audioContext) initContext(); if (!audioContext) return; stop();
    const gainNode = audioContext.createGain(); gainNode.gain.setValueAtTime(gain, audioContext.currentTime);
    gainNode.connect(audioContext.destination);
    try { const buf = await ensureBuffer(id, file); source = audioContext.createBufferSource();
      currentId = id; const offset = regionSec ? Math.max(0, regionSec.start) : 0;
      const dur = regionSec ? Math.max(0.001, regionSec.end - regionSec.start) : undefined;
      startTime = audioContext.currentTime; currentDur = dur ?? buf.duration; currentRegionNorm = regionSec ? {start: offset/buf.duration, end: regionSec.end/buf.duration} : null;
      source.buffer = buf; source.connect(gainNode); source.onended = () => { currentId=null; currentRegionNorm=null; onEnded(); }; source.start(0, offset, dur);
    } catch(e){ console.error(`Error decoding ${id}`, e); }
  };

  const stop = () => {
    if (source) { source.onended = null; source.stop(); source = null; }
    currentId = null;
  };

  return { play, stop, ensureBuffer, 
           getProgressX:(id)=>{ const p=(id===currentId && currentDur>0)? Math.min(1,(audioContext.currentTime-startTime)/currentDur) : null; if(p==null) return null; if(currentRegionNorm) return currentRegionNorm.start + p*(currentRegionNorm.end-currentRegionNorm.start); return p; } };
}
const outroAudioPlayer = createAudioPlayer();
const outroSelections = new Map();

function drawWaveform(cv, buffer, sel, progress){const c=cv.getContext('2d');const w=cv.width=cv.clientWidth*window.devicePixelRatio;const h=cv.height=cv.clientHeight*window.devicePixelRatio;cv.style.width=`${cv.clientWidth}px`;cv.style.height=`${cv.clientHeight}px`;c.clearRect(0,0,w,h);c.fillStyle='#eee';c.fillRect(0,0,w,h);if(!buffer)return;const data=buffer.getChannelData(0);const step=Math.ceil(data.length/w);c.strokeStyle='#111';c.beginPath();for(let x=0;x<w;x++){let min=1,max=-1;for(let i=0;i<step;i++){const y=data[x*step+i]||0;min=Math.min(min,y);max=Math.max(max,y);}c.moveTo(x,(1+min)*.5*h);c.lineTo(x,(1+max)*.5*h);}c.stroke();if(sel){const sx=sel.start*w, ex=sel.end*w;c.fillStyle='rgba(0,0,0,0.12)';c.fillRect(Math.min(sx,ex),0,Math.abs(ex-sx),h);}if(progress!=null){const px=Math.max(0,Math.min(1,progress))*w;c.fillStyle='rgba(0,0,0,0.55)';c.fillRect(px|0,0,2,h);}}

function renderOutroAudioSelector() {
    els.outroGrid.innerHTML = '';
    OUTRO_CLIPS.forEach(clip => {
        const card = document.createElement('div');
        card.className = 'clip audio-clip';
        if (clip.id === selectedOutro.id) {
            card.classList.add('selected');
        }

        card.innerHTML = `
            <div class="clip-info">
                <span class="audio-label">${clip.label}</span>
                <button class="play-btn">▶︎</button>
            </div>
            <div class="audio-waveform"><canvas></canvas></div>
            <div class="audio-times">--:--</div>
        `;

        const playBtn = card.querySelector('.play-btn');
        const waveDiv = card.querySelector('.audio-waveform');
        const canvas = card.querySelector('canvas');
        const timesEl = card.querySelector('.audio-times');

        card.addEventListener('click', (e) => {
            if (e.target === playBtn) return;
            selectedOutro.id = clip.id;
            selectedOutro.file = clip.file;
            selectedOutro.region = outroSelections.get(clip.id) || null;
            renderOutroAudioSelector();
        });

        playBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            outroAudioPlayer.play(clip.id, clip.file, { regionSec: outroSelections.get(clip.id) });
        });
        
        // Waveform interaction logic
        let sel = null, dragging=false, dur=0, bufRef=null, raf=0;
        const toTime = x => Math.max(0, Math.min(1, x / waveDiv.clientWidth));

        const tick = ()=>{ 
          const p = outroAudioPlayer.getProgressX(clip.id); 
          if(bufRef){ drawWaveform(canvas, bufRef, sel, p); } 
          raf = requestAnimationFrame(tick); 
        };

        outroAudioPlayer.ensureBuffer(clip.id, clip.file).then(buf => {
            bufRef = buf;
            dur = buf.duration;
            const defSec = DEFAULT_OUTRO_REGIONS.get(clip.id);
            if (defSec) {
                sel = {start: defSec[0]/dur, end: defSec[1]/dur};
                outroSelections.set(clip.id, { start: defSec[0], end: defSec[1]});
                timesEl.textContent = `${defSec[0].toFixed(2)}s – ${defSec[1].toFixed(2)}s`;
                if (clip.id === selectedOutro.id && !selectedOutro.region) {
                    selectedOutro.region = { start: defSec[0], end: defSec[1]};
                }
            } else {
                timesEl.textContent = `Full clip: ${dur.toFixed(2)}s`;
            }
            drawWaveform(canvas, bufRef, sel, null);
            tick();
        }).catch(e => console.error(`Failed to load audio buffer for ${clip.id}`, e));

        waveDiv.addEventListener('pointerdown', e => {
            e.preventDefault();
            dragging = true;
            sel = { start: toTime(e.offsetX), end: toTime(e.offsetX) };
        });
        waveDiv.addEventListener('pointermove', e => {
            if (!dragging) return;
            sel.end = toTime(e.offsetX);
            if (bufRef) {
                const a = Math.min(sel.start, sel.end) * dur, b = Math.max(sel.start, sel.end) * dur;
                timesEl.textContent = `${a.toFixed(2)}s – ${b.toFixed(2)}s`;
            }
        });
        const onPointerUp = () => {
            if (!dragging) return;
            dragging = false;
            if (Math.abs(sel.end - sel.start) < 0.005) {
                sel = null;
                outroSelections.delete(clip.id);
                timesEl.textContent = `Full clip: ${dur.toFixed(2)}s`;
            } else {
                const a = Math.min(sel.start, sel.end) * dur, b = Math.max(sel.start, sel.end) * dur;
                outroSelections.set(clip.id, { start: a, end: b });
            }
            if (clip.id === selectedOutro.id) {
                selectedOutro.region = outroSelections.get(clip.id) || null;
            }
        };
        window.addEventListener('pointerup', onPointerUp);
        
        els.outroGrid.appendChild(card);
    });
}

function getVideoDuration(blob) {
    return new Promise((resolve) => {
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.onloadedmetadata = function() {
            window.URL.revokeObjectURL(video.src);
            resolve(video.duration * 1000);
        }
        video.onerror = function() {
            resolve(0); // or reject
        }
        video.src = URL.createObjectURL(blob);
    });
}

function fmtTime(ms){ 
  const s = Math.round(ms/1000);
  return `${Math.floor(s/60)}:${String(s%60).padStart(2,"0")}`;
}

async function makeThumb(blob){ 
  return new Promise((res)=>{ 
    const v=document.createElement("video");
    v.src=URL.createObjectURL(blob);
    v.muted=true;
    v.addEventListener("loadeddata", ()=>{ 
      v.currentTime = Math.min(0.25, (v.duration||1)*0.1);
    }, {once:true});
    v.addEventListener("seeked", ()=>{ 
      const c=document.createElement("canvas");
      c.width=320; c.height=180;
      const ctx=c.getContext("2d");
      ctx.drawImage(v,0,0,c.width,c.height);
      c.toBlob(b=>res(URL.createObjectURL(b)), "image/jpeg",0.7);
      URL.revokeObjectURL(v.src);
    }, {once:true});
  }); 
}

function renderClips(){
  els.grid.innerHTML = "";
  clips.forEach((c, idx)=>{ 
    const card = document.createElement("div");
    card.className="clip";
    const img = document.createElement("img");
    img.className="thumb";
    img.src = c.thumb || "";
    img.addEventListener('click', () => {
      if (c.blob) {
        els.modalVideo.src = URL.createObjectURL(c.blob);
        els.modalBackdrop.style.display = 'flex';
        els.modalVideo.play().catch(e => console.error("Preview play failed:", e));
      }
    });

    const info = document.createElement("div");
    info.className="clip-info";
    const meta = document.createElement("div");
    meta.className="meta";
    meta.textContent = `Clip ${idx+1} • ${c.duration ? fmtTime(c.duration) : '--:--'} • ${new Date(c.createdAt).toLocaleTimeString()}`;
    const sel = document.createElement("label");
    sel.className="sel";
    const cb = document.createElement("input");
    cb.type="checkbox";
    cb.checked = c.selected ?? true;
    cb.addEventListener("change", ()=>{ c.selected = cb.checked; persistClips(); toggleComposeBtn(); });
    const dl = document.createElement("a");
    dl.textContent="Download";
    dl.href = c.blob ? URL.createObjectURL(c.blob) : '#';
    if (!c.blob) {
        dl.style.pointerEvents = 'none';
        dl.style.opacity = '0.5';
    }
    dl.download = `clip-${idx+1}-composed.webm`;
    sel.appendChild(cb);
    sel.appendChild(document.createTextNode("Select"));
    info.appendChild(meta);
    info.appendChild(sel);
    card.appendChild(img);
    card.appendChild(info);

    const actions = document.createElement("div");
    actions.style.padding = "0 10px 8px";
    actions.appendChild(dl);
    card.appendChild(actions);

    if (c.composing) {
        const overlay = document.createElement('div');
        overlay.className = 'composing-overlay';
        overlay.textContent = 'Composing...';
        card.appendChild(overlay);
    }

    els.grid.appendChild(card);
  }); 
  toggleComposeBtn();
}

function toggleComposeBtn(){
  els.composeBtn.disabled = !(clips.some(c=>c.selected));
}

async function persistClips(){
  try { await idbSet("auto-clip-clips", clips.map(c=>({ ...c, blob: undefined, rawBlob: undefined, blobUrl: c.blob ? URL.createObjectURL(c.blob) : null }))); } catch {}
}

async function restoreClips(){
  try {
    const saved = await idbGet("auto-clip-clips");
    if (Array.isArray(saved)) {
      clips = await Promise.all(saved.map(async s=>{
        if (s.composing) { // Don't try to restore composing clips, let them re-compose
            return {...s, blob: null, composing: false}; // Or re-trigger composition
        }
        if (s.blobUrl) {
          try {
            const blob = await fetch(s.blobUrl).then(r=>r.blob());
            return { ...s, blob, composing: false };
          } catch(e) {
            console.warn(`Could not restore clip from ${s.blobUrl}`);
            return {...s, blob:null, composing: false};
          }
        }
        return {...s, composing: false};
      }));
      renderClips();
    }
  } catch {}
  renderOutroAudioSelector();
}

function setupRecorder(){
  recorder = new MediaRecorder(captureStream, { mimeType: "video/webm;codecs=vp9,opus" });
  chunks = [];
  recorder.ondataavailable = e => { if (e.data && e.data.size>0) chunks.push(e.data); };
  recorder.onstop = async () => {
    if (!chunks.length) {
      if (recording) {
        currentClipStart = Date.now();
        recorder.start(1000);
      }
      return;
    }
    const rawBlob = new Blob(chunks, { type: "video/webm" });
    const duration = Date.now() - currentClipStart;
    const thumb = await makeThumb(rawBlob);

    const clip = { 
      id: Date.now() + Math.random(),
      rawBlob, 
      blob: null, 
      createdAt: Date.now(), 
      duration: duration, 
      thumb, 
      selected: true,
      composing: true,
    };
    clips.push(clip);
    renderClips(); 
    persistClips();
    chunks = [];

    (async () => {
        try {
            const { composeClips } = await import("./composer.js");
            const composedBlob = await composeClips([rawBlob], {
                outroSeconds: 3,
                logoUrl: "/logowhite.png",
                outroAudio: selectedOutro.file,
                outroAudioRegion: selectedOutro.region,
                width: 1280,
                height: 720,
                fps: 30
            });
            const clipToUpdate = clips.find(c => c.id === clip.id);
            if (clipToUpdate) {
                clipToUpdate.blob = composedBlob;
                clipToUpdate.composing = false;
                clipToUpdate.duration = await getVideoDuration(composedBlob);
                renderClips();
                persistClips();
            }
        } catch (e) {
            console.error("Auto-composition failed for clip", clip.id, e);
            const clipToUpdate = clips.find(c => c.id === clip.id);
            if (clipToUpdate) {
                clipToUpdate.composing = false; 
                clipToUpdate.blob = rawBlob; // fallback to raw
                renderClips();
                persistClips();
            }
        }
    })();

    if (recording) {
      currentClipStart = Date.now();
      recorder.start(1000);
    }
  };
}

async function pickTab(){
  try{
    captureStream = await navigator.mediaDevices.getDisplayMedia({
      video: { displaySurface: "browser", frameRate: 30, cursor: "motion" },
      audio: true
    });
    els.start.disabled = false;
    els.split.disabled = true;
    els.stop.disabled = true;
    captureStream.getVideoTracks()[0].addEventListener("ended", ()=>stopAll());
  }catch(e){
    console.error(e);
    alert("Tab picking was canceled or not permitted.");
  }
}

function startRecording(){
  if (!captureStream) { alert("Pick a tab first."); return; }
  if (recording) return;
  setupRecorder();
  recording = true;
  currentClipStart = Date.now();
  recorder.start(1000);
  els.start.disabled = true;
  els.stop.disabled = false;
  els.split.disabled = false;
  if (els.autoSplitCaptured.checked) startCaptureHeuristics();
}

function splitClip(){
  if (recorder && recording) {
    recorder.stop();
  }
}

function stopAll(){
  if (recorder && recording) {
    recording = false;
    recorder.stop();
  }
  if (captureStream) {
    captureStream.getTracks().forEach(t=>t.stop());
    captureStream = null;
  }
  els.start.disabled = !captureStream;
  els.stop.disabled = true;
  els.split.disabled = true;
  stopCaptureHeuristics();
}

function startCaptureHeuristics(){
  if (!captureStream) return;
  const v = document.createElement("video");
  v.srcObject = captureStream; v.muted = true; v.play().catch(()=>{});
  const c = document.createElement("canvas"); c.width = 64; c.height = 36;
  const x = c.getContext("2d"); let lastSig = null; let lastMute = 0;
  const vt = captureStream.getVideoTracks()[0];
  vt.onmute = ()=>{ lastMute = Date.now(); };
  vt.onunmute = ()=>{ if (recording && Date.now()-lastMute<2000) splitClip(); };
  capMon = { interval: setInterval(()=>{ 
    if (!recording) return;
    try {
      x.drawImage(v,0,0,c.width,c.height);
      const d = x.getImageData(0,0,c.width,c.height).data;
      let sum=0, varsum=0;
      for (let i=0;i<d.length;i+=4){ const g=(d[i]*0.2126+d[i+1]*0.7152+d[i+2]*0.0722); sum+=g; varsum+=g*g; }
      const n=d.length/4, mean=sum/n, std=Math.sqrt(Math.max(0,varsum/n-mean*mean));
      const sig = mean+std*2; // simple signature
      if (lastSig!==null && Math.abs(sig-lastSig)>40) splitClip();
      lastSig = sig;
    } catch {}
  }, 800), videoEl: v, canvas: c, ctx: x };
}

function stopCaptureHeuristics(){
  if (capMon.interval) clearInterval(capMon.interval);
  capMon = { interval: null, videoEl: null, canvas: null, ctx: null };
}

function setupNavigator(){
  const go = ()=>{ 
    const url = els.navUrl.value.trim();
    if (!url) return;
    const href = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    monitoredUrl = href;
    els.navigator.src = href;
  };
  els.navGo.addEventListener("click", go);
  els.navUrl.addEventListener("keydown", (e)=>{ if (e.key==="Enter") go(); });
  els.navigator.addEventListener("load", ()=>{ 
    if (!els.autoSplit.checked) return;
    if (!recording) return;
    // Auto-split on iframe src change
    splitClip();
  });
}

document.getElementById("btn-compose").addEventListener("click", async ()=>{
  const selected = clips.filter(c=>c.selected && c.blob && !c.composing);
  if (!selected.length) return;
  els.composeStatus.textContent = "Composing...";
  els.composeStatus.style.color = "";
  els.composeBtn.disabled = true;
  try {
    const { concatenateClips } = await import("./composer.js");
    const out = await concatenateClips(selected.map(c=>c.blob), {
      width: 1280,
      height: 720,
      fps: 30
    });
    const url = URL.createObjectURL(out);
    const prev = document.getElementById("final-preview");
    prev.src = url;
    prev.play().catch(()=>{});
    const a = document.getElementById("download-link");
    a.href = url;
    a.style.display = "inline-block";
    els.composeStatus.textContent = "Done.";
  } catch (e){
    console.error(e);
    els.composeStatus.textContent = "Failed.";
    els.composeStatus.style.color = "crimson";
    alert("Composition failed. See console for details.");
  } finally {
    els.composeBtn.disabled = false;
  }
});

els.pick.addEventListener("click", pickTab);
els.start.addEventListener("click", startRecording);
els.split.addEventListener("click", splitClip);
els.stop.addEventListener("click", stopAll);

els.modalClose.addEventListener('click', () => {
    els.modalBackdrop.style.display = 'none';
    els.modalVideo.pause();
    els.modalVideo.src = '';
});
els.modalBackdrop.addEventListener('click', (e) => {
    if (e.target === els.modalBackdrop) {
        els.modalClose.click();
    }
});

setupNavigator();
restoreClips();
/* ...existing code... */