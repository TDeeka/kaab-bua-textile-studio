const audioFile = document.getElementById("audioFile");
const audioPlayer = document.getElementById("audioPlayer");
const songName = document.getElementById("songName");

const waveCanvas = document.getElementById("waveCanvas");
const waveCtx = waveCanvas.getContext("2d");
const currentTimeText = document.getElementById("currentTime");
const durationTime = document.getElementById("durationTime");
const waveSelectedRange = document.getElementById("waveSelectedRange");

const statusTitle = document.getElementById("statusTitle");
const statusText = document.getElementById("statusText");

const analysisCard = document.getElementById("analysisCard");
const selectedTime = document.getElementById("selectedTime");
const beatMetric = document.getElementById("beatMetric");
const noteMetric = document.getElementById("noteMetric");
const energyMetric = document.getElementById("energyMetric");
const scoreMetric = document.getElementById("scoreMetric");
const reasonBox = document.getElementById("reasonBox");

const previewBtn = document.getElementById("previewBtn");
const weaveBtn = document.getElementById("weaveBtn");
const downloadBtn = document.getElementById("downloadBtn");
const saveGalleryBtn = document.getElementById("saveGalleryBtn");

const patternCanvas = document.getElementById("patternCanvas");
const ctx = patternCanvas.getContext("2d");

const patternStyle = document.getElementById("patternStyle");
const innerPattern = document.getElementById("innerPattern");
const lotusToggle = document.getElementById("lotusToggle");
const patternColumns = document.getElementById("patternColumns");
const columnText = document.getElementById("columnText");
const motifWidth = document.getElementById("motifWidth");
const widthText = document.getElementById("widthText");

const baseColor = document.getElementById("baseColor");
const motifColor = document.getElementById("motifColor");
const lightColor = document.getElementById("lightColor");
const accentColor = document.getElementById("accentColor");

const weavingStatus = document.getElementById("weavingStatus");
const progressText = document.getElementById("progressText");
const progressBar = document.getElementById("progressBar");
const motifPreviewGrid = document.getElementById("motifPreviewGrid");
const galleryGrid = document.getElementById("galleryGrid");
const galleryEmpty = document.getElementById("galleryEmpty");
const clearGalleryBtn = document.getElementById("clearGalleryBtn");
const tieMapCanvas = document.getElementById("tieMapCanvas");
const guideMotifName = document.getElementById("guideMotifName");
const guideMapTitle = document.getElementById("guideMapTitle");
const guideTieCount = document.getElementById("guideTieCount");
const rowGuideList = document.getElementById("rowGuideList");
const downloadGuideBtn = document.getElementById("downloadGuideBtn");
const downloadGuideCsvBtn = document.getElementById("downloadGuideCsvBtn");
const printGuideBtn = document.getElementById("printGuideBtn");

let audioContext;
let decodedBuffer = null;
let waveformData = [];
let selectedSection = null;
let songFinished = false;
let waveAnimation;
let weaveAnimation;
let previewTimer;
let weavingProgress = 0;

let features = {
  beat:0.5,
  energy:0.5,
  noteVariation:0.5,
  dominantNote:60,
  bpm:90,
  notes:[],
  beatTimes:[]
};

audioFile.addEventListener("change", async function(event){
  const file = event.target.files[0];
  if(!file) return;

  songFinished = false;
  selectedSection = null;
  weavingProgress = 0;

  if(waveSelectedRange){
    waveSelectedRange.textContent = "รอการวิเคราะห์";
  }

  features.beatTimes = [];

  analysisCard.classList.add("hidden");
  previewBtn.disabled = true;
  weaveBtn.disabled = true;
  downloadBtn.disabled = true;
  saveGalleryBtn.disabled = true;

  songName.textContent = "🎵 " + file.name;
  audioPlayer.src = URL.createObjectURL(file);

  if(!audioContext){
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }

  const buffer = await file.arrayBuffer();
  decodedBuffer = await audioContext.decodeAudioData(buffer.slice(0));

  prepareWaveform(decodedBuffer);

  durationTime.textContent = formatTime(decodedBuffer.duration);
  statusTitle.textContent = "พร้อมฟังเพลง";
  statusText.textContent = "กรุณาฟังเพลงจนจบ ระบบจะวิเคราะห์ช่วงเพลงประมาณ 24 วินาทีที่เหมาะกับการออกแบบลายผ้า";

  drawWave();
  drawEmptyCloth();
  updateProgress();
});

function prepareWaveform(buffer){
  const data = buffer.getChannelData(0);
  const width = waveCanvas.width;
  const step = Math.ceil(data.length / width);

  waveformData = [];

  for(let x=0; x<width; x++){
    let min = 1;
    let max = -1;

    for(let i=0; i<step; i++){
      const value = data[x * step + i] || 0;
      if(value < min) min = value;
      if(value > max) max = value;
    }

    waveformData.push({min,max});
  }
}

function drawWave(){
  cancelAnimationFrame(waveAnimation);

  function render(){
    const width = waveCanvas.width;
    const height = waveCanvas.height;
    const center = height / 2;

    waveCtx.clearRect(0,0,width,height);

    /* clean fashion-style background */
    waveCtx.fillStyle = "#fff8fb";
    waveCtx.fillRect(0,0,width,height);

    /* very subtle horizontal center line */
    waveCtx.beginPath();
    waveCtx.moveTo(0,center);
    waveCtx.lineTo(width,center);
    waveCtx.strokeStyle = "rgba(16,16,16,.06)";
    waveCtx.lineWidth = 1;
    waveCtx.stroke();

    let progress = 0;

    if(audioPlayer.duration && isFinite(audioPlayer.duration)){
      progress = audioPlayer.currentTime / audioPlayer.duration;
    }

    const playX = width * progress;

    /* =================================================
       SELECTED PHRASE HIGHLIGHT
       Shows only after whole-song analysis is complete.
    ================================================= */

    let selectedStartX = null;
    let selectedEndX = null;

    if(
      selectedSection &&
      audioPlayer.duration &&
      isFinite(audioPlayer.duration)
    ){
      selectedStartX =
        (selectedSection.start / audioPlayer.duration) * width;

      selectedEndX =
        (selectedSection.end / audioPlayer.duration) * width;

      const selectedWidth =
        Math.max(2, selectedEndX - selectedStartX);

      /* translucent rose block */
      waveCtx.fillStyle = "rgba(198,63,120,.12)";
      waveCtx.fillRect(
        selectedStartX,
        0,
        selectedWidth,
        height
      );

      /* top selection ribbon */
      waveCtx.fillStyle = "rgba(198,63,120,.92)";
      waveCtx.fillRect(
        selectedStartX,
        0,
        selectedWidth,
        5
      );

      /* start boundary */
      waveCtx.beginPath();
      waveCtx.moveTo(selectedStartX,0);
      waveCtx.lineTo(selectedStartX,height);
      waveCtx.strokeStyle = "#d8aa45";
      waveCtx.lineWidth = 2;
      waveCtx.stroke();

      /* end boundary */
      waveCtx.beginPath();
      waveCtx.moveTo(selectedEndX,0);
      waveCtx.lineTo(selectedEndX,height);
      waveCtx.strokeStyle = "#d8aa45";
      waveCtx.lineWidth = 2;
      waveCtx.stroke();
    }

    /* =================================================
       UNPLAYED WAVEFORM
    ================================================= */

    waveCtx.beginPath();

    waveformData.forEach(function(p,x){
      if(x <= playX) return;

      waveCtx.moveTo(
        x,
        center + p.min * center * .82
      );

      waveCtx.lineTo(
        x,
        center + p.max * center * .82
      );
    });

    waveCtx.strokeStyle = "rgba(195,122,161,.28)";
    waveCtx.lineWidth = 1;
    waveCtx.stroke();

    /* =================================================
       PLAYED WAVEFORM
    ================================================= */

    waveCtx.beginPath();

    waveformData.forEach(function(p,x){
      if(x > playX) return;

      waveCtx.moveTo(
        x,
        center + p.min * center * .82
      );

      waveCtx.lineTo(
        x,
        center + p.max * center * .82
      );
    });

    waveCtx.strokeStyle = "#c55d93";
    waveCtx.lineWidth = 1.3;
    waveCtx.stroke();

    /* Re-emphasize the selected phrase waveform */
    if(
      selectedSection &&
      selectedStartX !== null &&
      selectedEndX !== null
    ){
      waveCtx.save();

      waveCtx.beginPath();
      waveCtx.rect(
        selectedStartX,
        0,
        Math.max(2,selectedEndX-selectedStartX),
        height
      );
      waveCtx.clip();

      waveCtx.beginPath();

      waveformData.forEach(function(p,x){
        if(
          x < selectedStartX ||
          x > selectedEndX
        ){
          return;
        }

        waveCtx.moveTo(
          x,
          center + p.min * center * .82
        );

        waveCtx.lineTo(
          x,
          center + p.max * center * .82
        );
      });

      waveCtx.strokeStyle = "#9e2858";
      waveCtx.lineWidth = 1.55;
      waveCtx.stroke();

      waveCtx.restore();

      /* Selection label inside canvas when enough room */
      if(
        selectedEndX - selectedStartX > 105
      ){
        const label =
          "SELECTED " +
          formatTime(selectedSection.start) +
          "–" +
          formatTime(selectedSection.end);

        waveCtx.font = "bold 10px Arial";
        waveCtx.textBaseline = "top";

        const textWidth =
          waveCtx.measureText(label).width;

        let labelX =
          selectedStartX + 8;

        if(
          labelX + textWidth + 12 >
          selectedEndX
        ){
          labelX =
            selectedEndX -
            textWidth -
            8;
        }

        waveCtx.fillStyle =
          "rgba(255,255,255,.92)";

        waveCtx.fillRect(
          labelX - 5,
          11,
          textWidth + 10,
          20
        );

        waveCtx.fillStyle =
          "#9e2858";

        waveCtx.fillText(
          label,
          labelX,
          16
        );
      }
    }

    /* =================================================
       BEAT MARKERS INSIDE SELECTED PHRASE
    ================================================= */

    if(
      selectedSection &&
      selectedSection.beatTimes &&
      selectedSection.beatTimes.length
    ){
      waveCtx.save();

      selectedSection.beatTimes.forEach(function(time,index){
        if(!audioPlayer.duration || !isFinite(audioPlayer.duration)) return;

        const beatX = (time / audioPlayer.duration) * width;

        if(selectedStartX !== null && (beatX < selectedStartX || beatX > selectedEndX)){
          return;
        }

        const beatNumber = index + 1;
        const isMajor = index % 4 === 0;
        const markerTop = height - (isMajor ? 27 : 21);
        const markerBottom = height - 8;

        waveCtx.beginPath();
        waveCtx.moveTo(beatX, markerTop);
        waveCtx.lineTo(beatX, markerBottom);
        waveCtx.strokeStyle = isMajor ? "#9e2858" : "rgba(158,40,88,.72)";
        waveCtx.lineWidth = isMajor ? 1.8 : 1.15;
        waveCtx.stroke();

        /* Beat number */
        waveCtx.save();
        waveCtx.font = isMajor ? "bold 8px Arial" : "7px Arial";
        waveCtx.textAlign = "center";
        waveCtx.textBaseline = "bottom";

        const label = String(beatNumber);
        const labelY = markerTop - 2;

        /* Small white backing for readability */
        const labelWidth = waveCtx.measureText(label).width + 4;
        waveCtx.fillStyle = "rgba(255,255,255,.88)";
        waveCtx.fillRect(
          beatX - labelWidth/2,
          labelY - 9,
          labelWidth,
          9
        );

        waveCtx.fillStyle = isMajor ? "#9e2858" : "#8d6474";
        waveCtx.fillText(label, beatX, labelY);
        waveCtx.restore();
      });

      waveCtx.restore();
    }

    /* =================================================
       PLAYHEAD
    ================================================= */

    if(audioPlayer.duration){
      waveCtx.beginPath();
      waveCtx.moveTo(playX,0);
      waveCtx.lineTo(playX,height);
      waveCtx.strokeStyle = "#111111";
      waveCtx.lineWidth = 1.5;
      waveCtx.stroke();

      /* playhead top marker */
      waveCtx.beginPath();
      waveCtx.moveTo(playX-4,0);
      waveCtx.lineTo(playX+4,0);
      waveCtx.lineTo(playX,7);
      waveCtx.closePath();
      waveCtx.fillStyle = "#111111";
      waveCtx.fill();
    }

    currentTimeText.textContent =
      formatTime(audioPlayer.currentTime);

    waveAnimation =
      requestAnimationFrame(render);
  }

  render();
}

audioPlayer.addEventListener("play", function(){
  if(!songFinished){
    statusTitle.textContent = "กำลังฟังเพลง";
    statusText.textContent = "คลื่นเสียงกำลังเคลื่อนตามเพลง เมื่อเพลงจบระบบจะวิเคราะห์ทั้งเพลงก่อนเลือกช่วงสำหรับออกแบบลาย";
  }
});

audioPlayer.addEventListener("ended", function(){
  if(songFinished) return;

  songFinished = true;
  statusTitle.textContent = "กำลังวิเคราะห์เพลง";
  statusText.textContent = "ระบบกำลังค้นหาช่วงที่มี Beat ต่อเนื่อง มีการเปลี่ยนแปลงของ Note และ Energy เหมาะสม";

  setTimeout(analyseWholeSong,120);
});

function analyseWholeSong(){
  if(!decodedBuffer) return;

  const windowLength = Math.min(
    30,
    Math.max(
      12,
      Math.min(24, decodedBuffer.duration * .28)
    )
  );

  const hop = Math.max(6, windowLength / 3);
  const candidates = [];

  for(let start=0; start <= decodedBuffer.duration - windowLength; start += hop){
    candidates.push(analyseSection(start,windowLength));
  }

  if(candidates.length === 0){
    candidates.push(analyseSection(0,decodedBuffer.duration));
  }

  candidates.sort((a,b)=>b.score-a.score);
  selectedSection = candidates[0];

  features = {
    beat:selectedSection.beat,
    energy:selectedSection.energy,
    noteVariation:selectedSection.noteVariation,
    dominantNote:selectedSection.dominantNote,
    bpm:selectedSection.bpm,
    notes:selectedSection.notes,
    beatTimes:selectedSection.beatTimes || []
  };

  showAnalysis();

  previewBtn.disabled = false;
  weaveBtn.disabled = false;
  statusTitle.textContent = "วิเคราะห์เสร็จแล้ว";
  statusText.textContent = "ระบบเลือกช่วงเพลงที่เหมาะสมแล้ว สามารถฟังช่วงที่เลือกก่อน แล้วกดเริ่มทอผ้าได้";
}

function analyseSection(startTime,duration){
  const data = decodedBuffer.getChannelData(0);
  const sampleRate = decodedBuffer.sampleRate;

  const start = Math.floor(startTime * sampleRate);
  const end = Math.min(data.length, Math.floor((startTime + duration) * sampleRate));
  const frameSize = 2048;

  const energies = [];
  const onsets = [];
  const notes = [];
  let previousEnergy = 0;

  for(let pos=start; pos<end-frameSize; pos+=frameSize){
    let sum = 0;
    let zero = 0;

    for(let i=0; i<frameSize; i++){
      const value = data[pos+i];
      sum += value*value;

      if(i>0){
        const previous = data[pos+i-1];
        if((previous >= 0 && value < 0) || (previous < 0 && value >= 0)){
          zero++;
        }
      }
    }

    const energy = Math.sqrt(sum/frameSize);
    energies.push(energy);

    onsets.push(Math.max(0,energy-previousEnergy));
    previousEnergy = energy;

    const zcr = zero/frameSize;
    let frequency = zcr*sampleRate/2;
    frequency = Math.max(55,Math.min(1100,frequency));

    let midi = 69 + 12*Math.log2(frequency/440);
    midi = Math.round(midi);
    midi = Math.max(36,Math.min(96,midi));

    notes.push(midi);
  }

  const meanEnergy = average(energies);
  const energy = clamp(meanEnergy*6);

  const onsetMean = average(onsets);
  const threshold = onsetMean*1.5;
  let beatCount = 0;
  const beatTimes = [];

  onsets.forEach(function(value,index){
    if(value > threshold){
      beatCount++;

      const frameTime = startTime + (index * frameSize / sampleRate);

      if(
        beatTimes.length === 0 ||
        frameTime - beatTimes[beatTimes.length-1] > .18
      ){
        beatTimes.push(frameTime);
      }
    }
  });

  const bpm = Math.max(45,Math.min(200,Math.round(beatCount/duration*60)||80));
  const beat = clamp(beatCount/Math.max(9,onsets.length*.17));

  const noteMean = average(notes);
  let variance = 0;

  notes.forEach(function(note){
    variance += Math.pow(note-noteMean,2);
  });

  variance /= Math.max(1,notes.length);
  const noteVariation = clamp(Math.sqrt(variance)/11);

  let energyVariance = 0;
  energies.forEach(function(value){
    energyVariance += Math.pow(value-meanEnergy,2);
  });

  energyVariance /= Math.max(1,energies.length);

  const stability = 1 - clamp(Math.sqrt(energyVariance)*9);
  const balancedEnergy = 1 - Math.abs(energy-.58);

  const score =
    beat*.30 +
    noteVariation*.27 +
    stability*.25 +
    balancedEnergy*.18;

  return {
    start:startTime,
    end:Math.min(decodedBuffer.duration,startTime+duration),
    beat,
    energy,
    noteVariation,
    dominantNote:Math.round(noteMean),
    bpm,
    notes,
    beatTimes,
    stability,
    score
  };
}

function showAnalysis(){
  const result = selectedSection;

  analysisCard.classList.remove("hidden");

  selectedTime.textContent =
    "ช่วง " +
    formatTime(result.start) +
    " – " +
    formatTime(result.end) +
    ` (${Math.round(result.end-result.start)} วินาที)`;

  if(waveSelectedRange){
    waveSelectedRange.textContent =
      formatTime(result.start) +
      " – " +
      formatTime(result.end);
  }

  beatMetric.textContent = Math.round(result.beat*100) + "%";
  noteMetric.textContent = Math.round(result.noteVariation*100) + "%";
  energyMetric.textContent = Math.round(result.energy*100) + "%";
  scoreMetric.textContent = Math.round(result.score*100) + "%";

  let text = "<strong>เหตุผลที่เลือกช่วงนี้</strong><br><br>";
  text += "• ระบบเลือกช่วงเพลงที่ยาวพอให้เห็นโครงสร้างจังหวะและวลีดนตรี ไม่ใช้เพียงช่วงสั้น ๆ<br><br>";

  if(result.beat > .5){
    text += "• Beat มีความต่อเนื่อง เหมาะสำหรับกำหนดระยะซ้ำของ Motif ตามแนวผืนผ้า<br><br>";
  }else{
    text += "• Beat ค่อนข้างโปร่ง จึงเหมาะกับลายที่มีพื้นที่สีพื้นมากขึ้น<br><br>";
  }

  if(result.noteVariation > .45){
    text += "• Note มีการเปลี่ยนระดับหลายช่วง จึงสามารถสร้างเฉดผ้าจากเข้มไปอ่อนได้<br><br>";
  }else{
    text += "• Note ค่อนข้างสม่ำเสมอ จึงให้ผืนผ้าที่มีโทนสีต่อเนื่องและนุ่มนวล<br><br>";
  }

  text += `• Tempo ที่ประเมินได้ประมาณ ${result.bpm} BPM โดย Note ใช้ควบคุมเฉดสี และ Beat ใช้ควบคุมจังหวะซ้ำของ Motif`;

  reasonBox.innerHTML = text;
}

previewBtn.addEventListener("click", function(){
  if(!selectedSection) return;

  clearTimeout(previewTimer);

  audioPlayer.currentTime = selectedSection.start;
  audioPlayer.play();

  previewTimer = setTimeout(function(){
    audioPlayer.pause();
  },(selectedSection.end-selectedSection.start)*1000);
});

weaveBtn.addEventListener("click", function(){
  if(!selectedSection) return;

  audioPlayer.pause();
  cancelAnimationFrame(weaveAnimation);

  weavingProgress = 0;
  downloadBtn.disabled = true;
  weavingStatus.textContent = "WEAVING";

  let startTimestamp = null;
  const duration = Math.max(7200,10500-features.bpm*13);

  function animate(timestamp){
    if(startTimestamp === null){
      startTimestamp = timestamp;
    }

    weavingProgress = Math.min(1,(timestamp-startTimestamp)/duration);

    drawTextile(weavingProgress);
    updateProgress();

    if(weavingProgress < 1){
      weaveAnimation = requestAnimationFrame(animate);
    }else{
      weavingStatus.textContent = "COMPLETE";
      downloadBtn.disabled = false;
      saveGalleryBtn.disabled = false;
    }
  }

  weaveAnimation = requestAnimationFrame(animate);
});

function drawTextile(progress){
  const width = patternCanvas.width;
  const height = patternCanvas.height;

  ctx.clearRect(0,0,width,height);
  ctx.fillStyle = adjustColor(baseColor.value,-.10);
  ctx.fillRect(0,0,width,height);

  const visibleHeight = height*progress;

  ctx.save();
  ctx.beginPath();
  ctx.rect(0,0,width,visibleHeight);
  ctx.clip();

  drawNoteBackground(width,height);
  drawFineWeave(width,height);
  drawVerticalPattern(width,height);
  drawBeatDetails(width,height);

  ctx.restore();

  if(progress < 1){
    ctx.fillStyle = "rgba(255,255,255,0.18)";
    ctx.fillRect(0,visibleHeight,width,height-visibleHeight);
    drawWeavingFront(visibleHeight,width);
  }
}

function drawNoteBackground(width,height){
  const notes = features.notes;

  if(!notes || !notes.length){
    ctx.fillStyle = baseColor.value;
    ctx.fillRect(0,0,width,height);
    return;
  }

  const sections = 12;
  const sectionHeight = height/sections;

  for(let section=0; section<sections; section++){
    const from = Math.floor(section/sections*notes.length);
    const to = Math.floor((section+1)/sections*notes.length);
    const group = notes.slice(from,Math.max(from+1,to));
    const note = average(group);

    const normalized = clamp((note-36)/60);
    const brightness = -.08 + normalized*.18;

    ctx.fillStyle = adjustColor(baseColor.value,brightness);
    ctx.fillRect(0,section*sectionHeight,width,sectionHeight+2);
  }
}

function getPatternShape(){
  if(patternStyle.value === "compact"){
    return {
      widthScale:.76,
      heightScale:1.18,
      wingSpread:.72,
      centerBarScale:.72,
      repeatScale:.80,
      echoLayer:0,
      accentDiamond:false,
      wingLevels:5,
      centerRows:5
    };
  }

  if(patternStyle.value === "wide"){
    return {
      widthScale:1.28,
      heightScale:.88,
      wingSpread:1.34,
      centerBarScale:1.28,
      repeatScale:1.22,
      echoLayer:0,
      accentDiamond:false,
      wingLevels:5,
      centerRows:5
    };
  }

  if(patternStyle.value === "slender"){
    return {
      widthScale:.62,
      heightScale:1.34,
      wingSpread:.66,
      centerBarScale:.64,
      repeatScale:.76,
      echoLayer:0,
      accentDiamond:false,
      wingLevels:6,
      centerRows:6
    };
  }

  if(patternStyle.value === "layered"){
    return {
      widthScale:1.05,
      heightScale:1.08,
      wingSpread:1.02,
      centerBarScale:1.02,
      repeatScale:.94,
      echoLayer:.14,
      accentDiamond:false,
      wingLevels:6,
      centerRows:5
    };
  }

  if(patternStyle.value === "royal"){
    return {
      widthScale:1.02,
      heightScale:1.02,
      wingSpread:.96,
      centerBarScale:1.12,
      repeatScale:1.00,
      echoLayer:.07,
      accentDiamond:true,
      wingLevels:5,
      centerRows:6
    };
  }

  return {
    widthScale:1.00,
    heightScale:1.00,
    wingSpread:1.00,
    centerBarScale:1.00,
    repeatScale:1.00,
    echoLayer:0,
    accentDiamond:false,
    wingLevels:5,
    centerRows:5
  };
}

function drawVerticalPattern(width,height){
  const columns = Number(patternColumns.value);
  const columnWidth = width/columns;
  const shape = getPatternShape();

  const repeatHeight =
    columnWidth *
    1.85 *
    shape.repeatScale *
    (1.08-features.beat*.18);

  for(let col=0; col<columns; col++){
    const centerX = col*columnWidth + columnWidth/2;
    const offset = col%2 ? repeatHeight*.50 : 0;

    for(let y=-repeatHeight+offset; y<height+repeatHeight; y+=repeatHeight){
      drawKaabMotif(centerX,y,columnWidth,col);
    }
  }
}

function drawKaabMotif(x,y,columnWidth,columnIndex){
  const shape = getPatternShape();

  ctx.save();
  ctx.translate(x,y);

  const widthRatio = Number(motifWidth.value)/100;
  const motifW = columnWidth*widthRatio*shape.widthScale;
  const motifH = motifW*1.95*shape.heightScale;

  ctx.globalAlpha = .30 + features.energy*.28;
  ctx.strokeStyle = motifColor.value;
  ctx.fillStyle = motifColor.value;
  ctx.lineWidth = 1.15;

  if(shape.echoLayer > 0){
    ctx.save();
    ctx.globalAlpha *= .40;
    drawKaabWing(0,-motifH*.245,motifW*(1+shape.echoLayer),motifH*.45,false,shape.wingSpread*.98,shape.wingLevels);
    drawKaabWing(0,motifH*.245,motifW*(1+shape.echoLayer),motifH*.45,true,shape.wingSpread*.98,shape.wingLevels);
    ctx.restore();
  }

  drawKaabWing(0,-motifH*.245,motifW,motifH*.42,false,shape.wingSpread,shape.wingLevels);
  drawKaabWing(0,motifH*.245,motifW,motifH*.42,true,shape.wingSpread,shape.wingLevels);

  ctx.save();
  ctx.strokeStyle = lightColor.value;
  ctx.globalAlpha *= .70;

  const spineLength =
    patternStyle.value === "wide"
      ? motifH*.12
      : patternStyle.value === "compact"
      ? motifH*.23
      : patternStyle.value === "slender"
      ? motifH*.28
      : motifH*.18;

  ctx.beginPath();
  ctx.moveTo(0,-spineLength);
  ctx.lineTo(0,spineLength);
  ctx.stroke();
  ctx.restore();

  drawKaabCenterBars(motifW,motifH,shape.centerBarScale);

  if(shape.accentDiamond){
    drawCenterDiamond(motifW,motifH);
  }

  if(innerPattern.checked){
    drawKaabInnerTicks(motifW,motifH,shape);
  }

  if(lotusToggle.checked){
    const lotusRandom = pseudoRandom(columnIndex,Math.round(y));
    if(lotusRandom > .72){
      drawTinyLotus(motifW*.18);
    }
  }

  ctx.restore();
}

function drawKaabWing(cx,cy,width,height,flipped,wingSpread=1,levels=5){
  ctx.save();
  ctx.translate(cx,cy);

  if(flipped){
    ctx.scale(1,-1);
  }

  for(let level=0; level<levels; level++){
    const t = level/(levels-1);

    const sideX =
      width *
      (.10+t*.31) *
      wingSpread;

    const y =
      -height*.43 +
      t*height*.72;

    const dashHeight =
      height *
      (.10+t*.025);

    drawVerticalDashGroup(-sideX,y,dashHeight,3,width*.052);
    drawVerticalDashGroup(sideX,y,dashHeight,3,width*.052);
  }

  drawCenterColumnBlocks(width,height,Math.max(4,Math.round(levels)));
  ctx.restore();
}

function drawVerticalDashGroup(x,y,dashHeight,count,gap){
  const dashWidth = Math.max(1.5,dashHeight*.17);

  for(let i=0; i<count; i++){
    const offsetX = (i-(count-1)/2)*gap;

    ctx.fillRect(
      x+offsetX-dashWidth/2,
      y-dashHeight/2,
      dashWidth,
      dashHeight
    );
  }
}

function drawCenterColumnBlocks(width,height,rows=5){
  ctx.save();
  ctx.globalAlpha *= .82;

  const blockWidth = width*.035;
  const blockHeight = height*.052;
  const rowGap = height*.076;
  const columnGap = width*.060;

  for(let row=0; row<rows; row++){
    const y = -height*.40 + row*rowGap;

    ctx.fillRect(-columnGap*1.5,y,blockWidth,blockHeight);
    ctx.fillRect(-columnGap*.50,y,blockWidth,blockHeight);
    ctx.fillRect(columnGap*.50,y,blockWidth,blockHeight);
    ctx.fillRect(columnGap*1.5,y,blockWidth,blockHeight);
  }

  ctx.restore();
}

function drawKaabCenterBars(motifW,motifH,scale=1){
  ctx.save();
  ctx.strokeStyle = accentColor.value;
  ctx.globalAlpha *= .68;
  ctx.lineWidth = 1.05;

  const widths = [
    motifW*.35*scale,
    motifW*.64*scale,
    motifW*.43*scale
  ];

  const ys = [
    -motifH*.052,
    0,
    motifH*.052
  ];

  for(let i=0; i<ys.length; i++){
    const half = widths[i]/2;

    ctx.beginPath();
    ctx.moveTo(-half,ys[i]);
    ctx.lineTo(half,ys[i]);
    ctx.stroke();
  }

  ctx.fillStyle = accentColor.value;
  ctx.fillRect(
    -motifW*.020,
    -motifH*.020,
    motifW*.040,
    motifH*.040
  );

  ctx.restore();
}

function drawKaabInnerTicks(motifW,motifH,shape){
  ctx.save();
  ctx.strokeStyle = lightColor.value;
  ctx.globalAlpha *= .50;
  ctx.lineWidth = 1;

  const rows = shape && shape.wingLevels ? Math.min(6,Math.max(4,shape.wingLevels-1)) : 4;

  for(let i=0; i<rows; i++){
    const y = (i-(rows-1)/2)*motifH*.070;
    const length = motifW*.085;

    ctx.beginPath();
    ctx.moveTo(-motifW*.23-length,y);
    ctx.lineTo(-motifW*.23+length,y);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(motifW*.23-length,y);
    ctx.lineTo(motifW*.23+length,y);
    ctx.stroke();
  }

  ctx.restore();
}

function drawCenterDiamond(motifW,motifH){
  ctx.save();
  ctx.strokeStyle = accentColor.value;
  ctx.globalAlpha *= .80;
  ctx.lineWidth = 1.2;

  const w = motifW*.12;
  const h = motifH*.10;

  ctx.beginPath();
  ctx.moveTo(0,-h);
  ctx.lineTo(w,0);
  ctx.lineTo(0,h);
  ctx.lineTo(-w,0);
  ctx.closePath();
  ctx.stroke();

  ctx.restore();
}

function drawTinyLotus(size){
  ctx.save();
  ctx.strokeStyle = accentColor.value;
  ctx.fillStyle = accentColor.value;
  ctx.globalAlpha = .85;
  ctx.lineWidth = 1.5;

  const petals = 5;

  for(let i=0; i<petals; i++){
    ctx.save();
    ctx.rotate(i*Math.PI*2/petals);

    ctx.beginPath();
    ctx.moveTo(0,0);
    ctx.quadraticCurveTo(size*.24,-size*.28,0,-size*.68);
    ctx.quadraticCurveTo(-size*.24,-size*.28,0,0);
    ctx.stroke();

    ctx.restore();
  }

  ctx.beginPath();
  ctx.arc(0,0,size*.08,0,Math.PI*2);
  ctx.fill();

  ctx.restore();
}

function drawBeatDetails(width,height){
  const rows = Math.round(14+features.beat*8);
  const rowGap = height/rows;

  ctx.save();
  ctx.strokeStyle = lightColor.value;
  ctx.globalAlpha = .10 + features.beat*.10;
  ctx.lineWidth = 1;

  for(let row=0; row<rows; row++){
    if(row%3 === 1) continue;

    const y = row*rowGap + rowGap/2;

    for(let x=20; x<width; x+=50){
      const random = pseudoRandom(row,x);
      if(random < .70) continue;

      const length = 5 + random*7;

      ctx.beginPath();
      ctx.moveTo(x,y);
      ctx.lineTo(x+length,y);
      ctx.stroke();
    }
  }

  ctx.restore();
}

function drawFineWeave(width,height){
  ctx.save();
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 1;

  ctx.globalAlpha = .040;
  for(let y=0; y<height; y+=5){
    ctx.beginPath();
    ctx.moveTo(0,y);
    ctx.lineTo(width,y);
    ctx.stroke();
  }

  ctx.globalAlpha = .025;
  for(let x=0; x<width; x+=7){
    ctx.beginPath();
    ctx.moveTo(x,0);
    ctx.lineTo(x,height);
    ctx.stroke();
  }

  ctx.restore();
}

function drawWeavingFront(y,width){
  ctx.save();

  const gradient = ctx.createLinearGradient(0,y-18,0,y+18);
  gradient.addColorStop(0,"rgba(255,255,255,0)");
  gradient.addColorStop(.5,lightColor.value);
  gradient.addColorStop(1,"rgba(255,255,255,0)");

  ctx.globalAlpha = .44;
  ctx.fillStyle = gradient;
  ctx.fillRect(0,y-18,width,36);

  ctx.restore();
}

function drawEmptyCloth(){
  ctx.fillStyle = adjustColor(baseColor.value,-.10);
  ctx.fillRect(0,0,patternCanvas.width,patternCanvas.height);

  ctx.save();
  ctx.globalAlpha = .025;
  ctx.strokeStyle = "#ffffff";

  for(let y=0; y<patternCanvas.height; y+=7){
    ctx.beginPath();
    ctx.moveTo(0,y);
    ctx.lineTo(patternCanvas.width,y);
    ctx.stroke();
  }

  ctx.restore();
}

function updateProgress(){
  const percent = Math.round(weavingProgress*100);
  progressText.textContent = percent + "%";
  progressBar.style.width = percent + "%";
}

patternColumns.addEventListener("input", function(){
  columnText.textContent = patternColumns.value;
  redrawCurrentTextile();
});

motifWidth.addEventListener("input", function(){
  widthText.textContent = motifWidth.value + "%";
  redrawCurrentTextile();
});

lotusToggle.addEventListener("change", redrawCurrentTextile);
innerPattern.addEventListener("change", redrawCurrentTextile);
patternStyle.addEventListener("change", function(){
  renderMotifPreviews();
  redrawCurrentTextile();
  drawTieMap();
});

[baseColor,motifColor,lightColor,accentColor].forEach(function(control){
  control.addEventListener("input",redrawCurrentTextile);
});

function redrawCurrentTextile(){
  if(selectedSection && weavingProgress > 0){
    drawTextile(weavingProgress);
  }else{
    drawEmptyCloth();
  }
}

downloadBtn.addEventListener("click", function(){
  const link = document.createElement("a");
  link.download = "kaab-bua-music-textile.png";
  link.href = patternCanvas.toDataURL("image/png");
  link.click();
});



/* =====================================================
WEFT IKAT WEAVING GUIDE - 24 x 24 PROTOTYPE
===================================================== */

const TIE_MAP_SIZE = 24;

function makeEmptyTieMap(){
  return Array.from(
    {length:TIE_MAP_SIZE},
    () => Array(TIE_MAP_SIZE).fill(false)
  );
}

function setTie(map,row,col){
  if(
    row >= 0 &&
    row < TIE_MAP_SIZE &&
    col >= 0 &&
    col < TIE_MAP_SIZE
  ){
    map[row][col] = true;
  }
}

function mirrorTie(map,row,col){
  setTie(map,row,col);
  setTie(
    map,
    row,
    TIE_MAP_SIZE - 1 - col
  );
}

function tieBand(map,row,center,width){
  const start =
    Math.round(center - width/2);

  for(let c=start; c<start+width; c++){
    mirrorTie(map,row,c);
  }
}

function generateTieMap(style){
  const map = makeEmptyTieMap();
  const mid = (TIE_MAP_SIZE - 1)/2;

  for(let row=0; row<TIE_MAP_SIZE; row++){
    const y =
      Math.abs(row-mid)/mid;

    let spread;
    let bandWidth = 2;

    if(style === "compact"){
      spread =
        2.2 +
        Math.round(y*3.4);

      bandWidth =
        y < .28 ? 2 : 1;
    }
    else if(style === "wide"){
      spread =
        3.8 +
        Math.round(y*6.0);

      bandWidth =
        y < .33 ? 3 : 2;
    }
    else if(style === "slender"){
      spread =
        1.8 +
        Math.round(y*3.0);

      bandWidth = 1;
    }
    else if(style === "layered"){
      spread =
        2.8 +
        Math.round(y*4.2);

      bandWidth = 2;
    }
    else if(style === "royal"){
      spread =
        2.7 +
        Math.round(y*4.0);

      bandWidth =
        y < .24 ? 3 : 2;
    }
    else{
      spread =
        3.0 +
        Math.round(y*4.5);

      bandWidth = 2;
    }

    const leftCenter =
      Math.round(mid-spread);

    tieBand(
      map,
      row,
      leftCenter,
      bandWidth
    );

    /* central spine / heart */
    if(style === "slender"){
      if(
        row >= 4 &&
        row <= 19 &&
        row % 2 === 0
      ){
        setTie(map,row,11);
        setTie(map,row,12);
      }
    }
    else if(
      row >= 8 &&
      row <= 15 &&
      row % 2 === 0
    ){
      setTie(map,row,11);
      setTie(map,row,12);
    }

    /* stepped inner detail */
    if(
      row === 5 ||
      row === 8 ||
      row === 15 ||
      row === 18
    ){
      mirrorTie(
        map,
        row,
        8
      );
    }

    if(style === "compact"){
      if(
        row === 10 ||
        row === 13
      ){
        mirrorTie(map,row,9);
      }
    }

    if(style === "wide"){
      if(
        row === 6 ||
        row === 9 ||
        row === 14 ||
        row === 17
      ){
        mirrorTie(map,row,5);
        mirrorTie(map,row,6);
      }
    }

    if(style === "layered"){
      if(
        row % 4 === 1 ||
        row % 4 === 2
      ){
        const secondCenter =
          Math.max(
            2,
            leftCenter-3
          );

        tieBand(
          map,
          row,
          secondCenter,
          1
        );
      }
    }

    if(style === "royal"){
      if(
        row >= 9 &&
        row <= 14
      ){
        const local =
          Math.abs(row-11.5);

        const diamondHalf =
          Math.max(
            0,
            Math.round(2.7-local)
          );

        for(
          let offset=-diamondHalf;
          offset<=diamondHalf;
          offset++
        ){
          setTie(
            map,
            row,
            Math.round(mid+offset)
          );
        }
      }
    }
  }

  /* emphasize top and bottom stepped caps */
  const capRows = [1,2,21,22];

  capRows.forEach(function(row,index){
    const base =
      index < 2
        ? 6+index
        : 7-(index-2);

    mirrorTie(map,row,base);
  });

  return map;
}

function drawTieMap(){
  if(!tieMapCanvas){
    return;
  }

  const map =
    generateTieMap(
      patternStyle.value
    );

  const gctx =
    tieMapCanvas.getContext("2d");

  const width =
    tieMapCanvas.width;

  const height =
    tieMapCanvas.height;

  const marginLeft = 78;
  const marginTop = 78;
  const marginRight = 30;
  const marginBottom = 30;

  const gridW =
    width -
    marginLeft -
    marginRight;

  const gridH =
    height -
    marginTop -
    marginBottom;

  const cellW =
    gridW/TIE_MAP_SIZE;

  const cellH =
    gridH/TIE_MAP_SIZE;

  gctx.clearRect(
    0,
    0,
    width,
    height
  );

  gctx.fillStyle =
    "#ffffff";

  gctx.fillRect(
    0,
    0,
    width,
    height
  );

  /* labels */
  gctx.fillStyle =
    "#777";

  gctx.font =
    "18px Arial";

  gctx.textAlign =
    "center";

  gctx.textBaseline =
    "middle";

  for(let col=0; col<TIE_MAP_SIZE; col++){
    gctx.fillText(
      String(col+1),
      marginLeft + col*cellW + cellW/2,
      marginTop - 28
    );
  }

  gctx.textAlign =
    "right";

  for(let row=0; row<TIE_MAP_SIZE; row++){
    gctx.fillText(
      String(row+1),
      marginLeft - 18,
      marginTop + row*cellH + cellH/2
    );
  }

  /* cells */
  let tieCount = 0;

  for(let row=0; row<TIE_MAP_SIZE; row++){
    for(let col=0; col<TIE_MAP_SIZE; col++){
      const x =
        marginLeft +
        col*cellW;

      const y =
        marginTop +
        row*cellH;

      if(map[row][col]){
        tieCount++;

        gctx.fillStyle =
          "#c63f78";

        gctx.fillRect(
          x+1,
          y+1,
          cellW-2,
          cellH-2
        );
      }
      else{
        gctx.fillStyle =
          "#ffffff";

        gctx.fillRect(
          x+1,
          y+1,
          cellW-2,
          cellH-2
        );
      }

      gctx.strokeStyle =
        "#ded9db";

      gctx.lineWidth = 1;

      gctx.strokeRect(
        x,
        y,
        cellW,
        cellH
      );
    }
  }

  /* stronger 4-cell guides */
  gctx.save();
  gctx.strokeStyle =
    "rgba(198,63,120,.35)";

  gctx.lineWidth = 2;

  for(let n=0; n<=TIE_MAP_SIZE; n+=4){
    const x =
      marginLeft +
      n*cellW;

    gctx.beginPath();
    gctx.moveTo(
      x,
      marginTop
    );
    gctx.lineTo(
      x,
      marginTop+gridH
    );
    gctx.stroke();

    const y =
      marginTop +
      n*cellH;

    gctx.beginPath();
    gctx.moveTo(
      marginLeft,
      y
    );
    gctx.lineTo(
      marginLeft+gridW,
      y
    );
    gctx.stroke();
  }

  gctx.restore();

  updateRowGuide(
    map,
    tieCount
  );
}

function positionsToRanges(
  rowData
){
  const positions = [];

  rowData.forEach(
    function(tied,index){
      if(tied){
        positions.push(index+1);
      }
    }
  );

  if(!positions.length){
    return "ไม่มัด";
  }

  const ranges = [];
  let start = positions[0];
  let previous = positions[0];

  for(let i=1; i<=positions.length; i++){
    const current =
      positions[i];

    if(
      current ===
      previous+1
    ){
      previous =
        current;

      continue;
    }

    if(start === previous){
      ranges.push(
        String(start)
      );
    }
    else{
      ranges.push(
        start+"–"+previous
      );
    }

    start = current;
    previous = current;
  }

  return ranges.join(", ");
}

function updateRowGuide(
  map,
  tieCount
){
  const motifName =
    getMotifLabel(
      patternStyle.value
    );

  if(guideMotifName){
    guideMotifName.textContent =
      motifName;
  }

  if(guideMapTitle){
    guideMapTitle.textContent =
      motifName +
      " · 24 × 24";
  }

  if(guideTieCount){
    guideTieCount.textContent =
      tieCount +
      " tie points";
  }

  if(!rowGuideList){
    return;
  }

  rowGuideList.innerHTML = "";

  map.forEach(
    function(row,rowIndex){

      const tiedCount =
        row.filter(Boolean).length;

      const item =
        document.createElement(
          "div"
        );

      item.className =
        "row-guide-item";

      item.innerHTML = `
        <span class="row-number">
          ROW ${String(rowIndex+1).padStart(2,"0")}
        </span>

        <span class="row-positions">
          ${positionsToRanges(row)}
        </span>

        <span class="row-count">
          ${tiedCount} จุด
        </span>
      `;

      rowGuideList.appendChild(
        item
      );
    }
  );
}

function downloadTieMapPNG(){
  drawTieMap();

  const link =
    document.createElement("a");

  link.download =
    "weft-ikat-" +
    patternStyle.value +
    "-24x24.png";

  link.href =
    tieMapCanvas.toDataURL(
      "image/png"
    );

  link.click();
}

function downloadTieMapCSV(){
  const map =
    generateTieMap(
      patternStyle.value
    );

  const rows = [
    [
      "Row",
      "Tie Positions",
      "Tie Count"
    ]
  ];

  map.forEach(
    function(row,index){

      rows.push([
        index+1,
        positionsToRanges(row),
        row.filter(Boolean).length
      ]);
    }
  );

  const csv =
    rows
      .map(
        row =>
          row
            .map(value =>
              `"${String(value).replaceAll('"','""')}"`
            )
            .join(",")
      )
      .join("\n");

  const blob =
    new Blob(
      ["\ufeff"+csv],
      {
        type:
          "text/csv;charset=utf-8"
      }
    );

  const url =
    URL.createObjectURL(
      blob
    );

  const link =
    document.createElement("a");

  link.href = url;

  link.download =
    "weft-ikat-" +
    patternStyle.value +
    "-rows.csv";

  link.click();

  URL.revokeObjectURL(
    url
  );
}

if(downloadGuideBtn){
  downloadGuideBtn.addEventListener(
    "click",
    downloadTieMapPNG
  );
}

if(downloadGuideCsvBtn){
  downloadGuideCsvBtn.addEventListener(
    "click",
    downloadTieMapCSV
  );
}

if(printGuideBtn){
  printGuideBtn.addEventListener(
    "click",
    function(){
      drawTieMap();
      window.print();
    }
  );
}


/* =====================================================
MOTIF PREVIEW CARDS
===================================================== */

function getPatternShapeForStyle(style){
  const current = patternStyle.value;

  patternStyle.value = style;
  const shape = getPatternShape();
  patternStyle.value = current;

  return shape;
}

function drawPreviewMotif(canvas, style){
  const pctx = canvas.getContext("2d");
  const w = canvas.width;
  const h = canvas.height;

  pctx.clearRect(0,0,w,h);

  /* soft textile base */
  const grad = pctx.createLinearGradient(0,0,w,h);
  grad.addColorStop(0, "#f7e5ed");
  grad.addColorStop(1, "#d49ab8");
  pctx.fillStyle = grad;
  pctx.fillRect(0,0,w,h);

  pctx.save();
  pctx.globalAlpha = .12;
  pctx.strokeStyle = "#ffffff";
  pctx.lineWidth = 1;

  for(let y=0; y<h; y+=5){
    pctx.beginPath();
    pctx.moveTo(0,y);
    pctx.lineTo(w,y);
    pctx.stroke();
  }

  for(let x=0; x<w; x+=7){
    pctx.beginPath();
    pctx.moveTo(x,0);
    pctx.lineTo(x,h);
    pctx.stroke();
  }
  pctx.restore();

  const shape = getPatternShapeForStyle(style);
  const cx = w/2;
  const cy = h/2;

  const motifW = Math.min(
    w*.58,
    w*.48*shape.widthScale
  );

  const motifH = Math.min(
    h*.78,
    motifW*1.58*shape.heightScale
  );

  pctx.save();
  pctx.translate(cx,cy);
  pctx.strokeStyle = "#fff5fb";
  pctx.fillStyle = "#fff5fb";
  pctx.lineWidth = 1.25;
  pctx.globalAlpha = .86;

  function previewDashGroup(x,y,dashHeight,count,gap){
    const dashWidth = Math.max(1.2,dashHeight*.18);

    for(let i=0;i<count;i++){
      const dx = (i-(count-1)/2)*gap;
      pctx.fillRect(
        x+dx-dashWidth/2,
        y-dashHeight/2,
        dashWidth,
        dashHeight
      );
    }
  }

  function previewWing(cyLocal, flipped, scale=1){
    pctx.save();
    pctx.translate(0,cyLocal);

    if(flipped){
      pctx.scale(1,-1);
    }

    const levels = shape.wingLevels || 5;

    for(let level=0; level<levels; level++){
      const t = level/(levels-1);
      const sideX =
        motifW *
        (.10+t*.31) *
        shape.wingSpread *
        scale;

      const yy =
        -motifH*.18 +
        t*motifH*.31;

      const dashHeight =
        motifH *
        (.035+t*.011);

      previewDashGroup(
        -sideX,
        yy,
        dashHeight,
        3,
        motifW*.050
      );

      previewDashGroup(
        sideX,
        yy,
        dashHeight,
        3,
        motifW*.050
      );
    }

    pctx.restore();
  }

  if(shape.echoLayer > 0){
    pctx.save();
    pctx.globalAlpha *= .34;
    previewWing(-motifH*.22,false,1+shape.echoLayer);
    previewWing(motifH*.22,true,1+shape.echoLayer);
    pctx.restore();
  }

  previewWing(-motifH*.22,false);
  previewWing(motifH*.22,true);

  /* vertical spine */
  pctx.strokeStyle = "#fff";
  pctx.globalAlpha = .70;
  pctx.beginPath();
  pctx.moveTo(0,-motifH*.18);
  pctx.lineTo(0,motifH*.18);
  pctx.stroke();

  /* center bars */
  pctx.strokeStyle = "#f2d392";
  pctx.globalAlpha = .90;

  [
    [shape.centerBarScale*.28,-motifH*.045],
    [shape.centerBarScale*.48,0],
    [shape.centerBarScale*.32,motifH*.045]
  ].forEach(function(item){
    pctx.beginPath();
    pctx.moveTo(-motifW*item[0],item[1]);
    pctx.lineTo(motifW*item[0],item[1]);
    pctx.stroke();
  });

  if(shape.accentDiamond){
    pctx.beginPath();
    pctx.moveTo(0,-motifH*.08);
    pctx.lineTo(motifW*.10,0);
    pctx.lineTo(0,motifH*.08);
    pctx.lineTo(-motifW*.10,0);
    pctx.closePath();
    pctx.stroke();
  }

  pctx.restore();
}

function renderMotifPreviews(){
  if(!motifPreviewGrid) return;

  motifPreviewGrid
    .querySelectorAll(".motif-card")
    .forEach(function(card){

      const style = card.dataset.style;
      const canvas = card.querySelector("canvas");

      drawPreviewMotif(canvas,style);

      card.classList.toggle(
        "selected",
        style === patternStyle.value
      );
    });
}

function selectMotifStyle(style){
  patternStyle.value = style;

  renderMotifPreviews();
  redrawCurrentTextile();
  drawTieMap();
}

if(motifPreviewGrid){
  motifPreviewGrid.addEventListener("click",function(event){
    const card = event.target.closest(".motif-card");

    if(!card){
      return;
    }

    selectMotifStyle(card.dataset.style);
  });
}



/* =====================================================
TEXTILE GALLERY - LOCAL STORAGE
===================================================== */

const GALLERY_STORAGE_KEY = "kaabBuaTextileGalleryV1";
const GALLERY_MAX_ITEMS = 12;

function getMotifLabel(style){
  const labels = {
    compact:"ลายกาบกระชับ",
    traditional:"ลายกาบสมมาตร",
    wide:"ลายกาบกว้าง",
    slender:"ลายกาบเพรียวสูง",
    layered:"ลายกาบซ้อนชั้น",
    royal:"ลายกาบประดับกลาง"
  };

  return labels[style] || style;
}

function loadGallery(){
  try{
    const raw = localStorage.getItem(GALLERY_STORAGE_KEY);

    if(!raw){
      return [];
    }

    const parsed = JSON.parse(raw);

    return Array.isArray(parsed)
      ? parsed
      : [];
  }
  catch(error){
    console.warn("Cannot load gallery:",error);
    return [];
  }
}

function saveGallery(items){
  try{
    localStorage.setItem(
      GALLERY_STORAGE_KEY,
      JSON.stringify(items)
    );
  }
  catch(error){
    console.warn("Cannot save gallery:",error);
    alert("พื้นที่จัดเก็บ Gallery เต็ม กรุณาลบผลงานบางชิ้นก่อน");
  }
}

function createGalleryThumbnail(){
  const thumb = document.createElement("canvas");

  thumb.width = 320;
  thumb.height = 400;

  const tctx = thumb.getContext("2d");

  tctx.fillStyle = "#ffffff";
  tctx.fillRect(
    0,
    0,
    thumb.width,
    thumb.height
  );

  tctx.drawImage(
    patternCanvas,
    0,
    0,
    patternCanvas.width,
    patternCanvas.height,
    0,
    0,
    thumb.width,
    thumb.height
  );

  return thumb.toDataURL(
    "image/jpeg",
    .78
  );
}

function saveCurrentDesignToGallery(){
  if(
    weavingProgress < 1 ||
    !selectedSection
  ){
    return;
  }

  const items = loadGallery();

  const item = {
    id:
      Date.now().toString(36) +
      Math.random().toString(36).slice(2,7),

    image:
      createGalleryThumbnail(),

    song:
      songName.textContent.replace(/^🎵\s*/,""),

    motif:
      patternStyle.value,

    motifLabel:
      getMotifLabel(patternStyle.value),

    selectedRange:
      formatTime(selectedSection.start) +
      " – " +
      formatTime(selectedSection.end),

    bpm:
      features.bpm,

    beat:
      Math.round(features.beat*100),

    note:
      Math.round(features.noteVariation*100),

    createdAt:
      new Date().toLocaleString("th-TH")
  };

  items.unshift(item);

  if(items.length > GALLERY_MAX_ITEMS){
    items.length = GALLERY_MAX_ITEMS;
  }

  saveGallery(items);
  renderGallery();

  saveGalleryBtn.textContent =
    "SAVED TO GALLERY ✓";

  setTimeout(function(){
    saveGalleryBtn.textContent =
      "SAVE TO GALLERY ♡";
  },1400);

  const gallerySection =
    document.getElementById("gallery");

  if(gallerySection){
    gallerySection.scrollIntoView({
      behavior:"smooth",
      block:"start"
    });
  }
}

function deleteGalleryItem(id){
  const items =
    loadGallery().filter(
      item => item.id !== id
    );

  saveGallery(items);
  renderGallery();
}

function downloadGalleryItem(id){
  const item =
    loadGallery().find(
      entry => entry.id === id
    );

  if(!item){
    return;
  }

  const link =
    document.createElement("a");

  link.href =
    item.image;

  link.download =
    "kaab-bua-gallery-" +
    item.id +
    ".jpg";

  link.click();
}

function renderGallery(){
  if(
    !galleryGrid ||
    !galleryEmpty
  ){
    return;
  }

  const items =
    loadGallery();

  galleryGrid.innerHTML = "";

  galleryEmpty.style.display =
    items.length
      ? "none"
      : "flex";

  items.forEach(function(item,index){
    const article =
      document.createElement("article");

    article.className =
      "gallery-item";

    article.innerHTML = `
      <div class="gallery-image-wrap">
        <img src="${item.image}" alt="${item.motifLabel}">
        <span class="gallery-index">${String(index+1).padStart(2,"0")}</span>
      </div>

      <div class="gallery-info">
        <span class="gallery-motif">${item.motifLabel}</span>
        <h3>${escapeHtml(item.song || "Untitled Song")}</h3>
        <p>
          Selected ${item.selectedRange}<br>
          BPM ${item.bpm} · Beat ${item.beat}% · Note ${item.note}%<br>
          ${item.createdAt}
        </p>

        <div class="gallery-actions">
          <button
            class="gallery-download"
            type="button"
            data-gallery-download="${item.id}">
            DOWNLOAD
          </button>

          <button
            class="gallery-delete"
            type="button"
            title="ลบ"
            data-gallery-delete="${item.id}">
            ×
          </button>
        </div>
      </div>
    `;

    galleryGrid.appendChild(article);
  });
}

function escapeHtml(text){
  return String(text)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

if(saveGalleryBtn){
  saveGalleryBtn.addEventListener(
    "click",
    saveCurrentDesignToGallery
  );
}

if(galleryGrid){
  galleryGrid.addEventListener(
    "click",
    function(event){

      const downloadButton =
        event.target.closest(
          "[data-gallery-download]"
        );

      if(downloadButton){
        downloadGalleryItem(
          downloadButton.dataset.galleryDownload
        );
        return;
      }

      const deleteButton =
        event.target.closest(
          "[data-gallery-delete]"
        );

      if(deleteButton){
        deleteGalleryItem(
          deleteButton.dataset.galleryDelete
        );
      }
    }
  );
}

if(clearGalleryBtn){
  clearGalleryBtn.addEventListener(
    "click",
    function(){

      const items =
        loadGallery();

      if(!items.length){
        return;
      }

      const ok =
        confirm(
          "ต้องการลบผลงานทั้งหมดใน Gallery หรือไม่?"
        );

      if(!ok){
        return;
      }

      localStorage.removeItem(
        GALLERY_STORAGE_KEY
      );

      renderGallery();
    }
  );
}


function adjustColor(hex,amount){
  hex = hex.replace("#","");

  let r = parseInt(hex.substring(0,2),16);
  let g = parseInt(hex.substring(2,4),16);
  let b = parseInt(hex.substring(4,6),16);

  if(amount >= 0){
    r += (255-r)*amount;
    g += (255-g)*amount;
    b += (255-b)*amount;
  }else{
    const factor = 1+amount;
    r *= factor;
    g *= factor;
    b *= factor;
  }

  r = Math.round(clamp255(r));
  g = Math.round(clamp255(g));
  b = Math.round(clamp255(b));

  return (
    "#" +
    r.toString(16).padStart(2,"0") +
    g.toString(16).padStart(2,"0") +
    b.toString(16).padStart(2,"0")
  );
}

function average(values){
  if(!values.length) return 0;
  return values.reduce((a,b)=>a+b,0)/values.length;
}

function clamp(value){
  return Math.max(0,Math.min(1,value));
}

function clamp255(value){
  return Math.max(0,Math.min(255,value));
}

function pseudoRandom(a,b){
  const seed = selectedSection ? selectedSection.start*137 : 11;
  const value = Math.sin(a*12.9898 + b*78.233 + seed)*43758.5453;
  return value - Math.floor(value);
}

function formatTime(seconds){
  if(!seconds || !isFinite(seconds)){
    seconds = 0;
  }

  const minutes = Math.floor(seconds/60);
  const secs = Math.floor(seconds%60).toString().padStart(2,"0");

  return minutes + ":" + secs;
}

drawEmptyCloth();
renderMotifPreviews();
renderGallery();
drawTieMap();
