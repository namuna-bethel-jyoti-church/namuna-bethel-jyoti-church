const cfg=window.CHURCH_CONFIG||{};
const langButton=document.getElementById('langToggle');let language='en';
function setLanguage(next){language=next;document.documentElement.lang=next;document.querySelectorAll('[data-en][data-ne]').forEach(el=>{el.textContent=el.dataset[next]});langButton.textContent=next==='en'?'नेपाली':'English';}
langButton.addEventListener('click',()=>setLanguage(language==='en'?'ne':'en'));
const links={youtube:cfg.youtubeChannelUrl,prayer:cfg.prayerFormUrl};
document.querySelectorAll('[data-link]').forEach(a=>{const url=links[a.dataset.link];if(url){a.href=url;a.target='_blank';a.rel='noopener';a.textContent=language==='en'?'Open':'खोल्नुहोस्';}});
if('serviceWorker' in navigator && location.protocol.startsWith('http')){window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));}


/* Nepali songbook tools: romanization, saved playlist, auto-scroll and chord transposition. */
(()=>{
  const section=document.getElementById('worship');
  if(!section)return;
  const songs=[...section.querySelectorAll('.song-entry')];
  const search=document.getElementById('songSearch');
  const romanButton=document.getElementById('romanToggle');
  const playlistButton=document.getElementById('playlistToggle');
  const speed=document.getElementById('scrollSpeed');
  const transposeValue=document.getElementById('transposeValue');
  const favoritesKey='nbj-song-favorites-v1';
  let favorites=new Set();
  try{favorites=new Set(JSON.parse(localStorage.getItem(favoritesKey)||'[]'));}catch(_){}
  let romanized=false,playlistOnly=false,semitones=0,scrollTimer=null;
  const consonants={'क':'k','ख':'kh','ग':'g','घ':'gh','ङ':'ṅ','च':'ch','छ':'chh','ज':'j','झ':'jh','ञ':'ñ','ट':'ṭ','ठ':'ṭh','ड':'ḍ','ढ':'ḍh','ण':'ṇ','त':'t','थ':'th','द':'d','ध':'dh','न':'n','प':'p','फ':'ph','ब':'b','भ':'bh','म':'m','य':'y','र':'r','ल':'l','व':'w','श':'ś','ष':'ṣ','स':'s','ह':'h','क्ष':'kṣ','त्र':'tr','ज्ञ':'jñ','ळ':'ḷ'};
  const vowels={'अ':'a','आ':'ā','इ':'i','ई':'ī','उ':'u','ऊ':'ū','ऋ':'ṛ','ए':'e','ऐ':'ai','ओ':'o','औ':'au'};
  const marks={'ा':'ā','ि':'i','ी':'ī','ु':'u','ू':'ū','ृ':'ṛ','े':'e','ै':'ai','ो':'o','ौ':'au','ं':'ṃ','ँ':'̃','ः':'ḥ','़':''};
  function romanize(input){
    const chars=[...input];let out='';
    for(let i=0;i<chars.length;i++){
      const c=chars[i];
      if(vowels[c]){out+=vowels[c];continue;}
      if(consonants[c]){
        let base=consonants[c];
        if(chars[i+1]==='्'){out+=base;i++;}
        else if(marks[chars[i+1]]){out+=base+marks[chars[++i]];}
        else out+=base+'a';
        continue;
      }
      if(c==='्')continue;
      if(marks[c]){out+=marks[c];continue;}
      if(c==='।'){out+='.';continue;}
      if(c==='॥'){out+='..';continue;}
      out+=c;
    }
    return out;
  }
  const notes=['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
  function transposeChord(match,chord){
    const m=chord.match(/^([A-G])([#b]?)(.*)$/);if(!m)return match;
    let n=notes.indexOf(m[1]+m[2]);if(n<0)return match;
    n=(n+semitones+12*4)%12;
    return '['+notes[n]+m[3]+']';
  }
  function renderLyrics(){
    songs.forEach(song=>song.querySelectorAll('.song-lyrics p').forEach(p=>{
      const original=p.dataset.originalLyrics??p.textContent;
      p.dataset.originalLyrics=original;
      const adjusted=original.replace(/\[([A-G](?:#|b)?(?:m|maj|min|dim|aug|sus|add)?\d*)\]/g,(all,chord)=>transposeChord(all,chord));
      p.textContent=romanized?romanize(adjusted):adjusted;
    }));
    romanButton.setAttribute('aria-pressed',String(romanized));
    romanButton.textContent=romanized?'नेपाली अक्षर / Nepali':'अंग्रेजी अक्षरमा / Romanized';
    transposeValue.textContent=(semitones>0?'+':'')+semitones;
  }
  function saveFavorites(){try{localStorage.setItem(favoritesKey,JSON.stringify([...favorites]));}catch(_){}}
  function applyFilters(){
    const q=(search.value||'').trim().toLocaleLowerCase();
    songs.forEach(song=>{
      const title=song.querySelector('summary')?.textContent||'';
      const content=[title,...[...song.querySelectorAll('.song-lyrics p')].map(p=>p.dataset.originalLyrics||p.textContent)].join(' ').toLocaleLowerCase();
      song.hidden=(playlistOnly&&!favorites.has(title))||(q&&!content.includes(q)&&!romanize(content).toLocaleLowerCase().includes(q));
    });
    playlistButton.setAttribute('aria-pressed',String(playlistOnly));
    playlistButton.textContent=playlistOnly?'★ Show All Songs':'☆ My Playlist';
  }
  songs.forEach(song=>{
    const title=song.querySelector('summary')?.textContent?.trim()||'';
    const controls=document.createElement('div');controls.className='song-controls';
    const fav=document.createElement('button');fav.type='button';fav.className='favorite-song';
    const updateFav=()=>{const saved=favorites.has(title);fav.classList.toggle('saved',saved);fav.textContent=saved?'★ Saved to My Playlist':'☆ Save to My Playlist';};
    updateFav();
    fav.addEventListener('click',()=>{favorites.has(title)?favorites.delete(title):favorites.add(title);saveFavorites();updateFav();applyFilters();});
    controls.appendChild(fav);
    const hasChords=[...song.querySelectorAll('.song-lyrics p')].some(p=>/\[[A-G](?:#|b)?(?:m|maj|min|dim|aug|sus|add)?\d*\]/.test(p.textContent));
    const chordNote=document.createElement('span');chordNote.className='chord-availability';chordNote.textContent=hasChords?'Chords available':'Chords not added yet';controls.appendChild(chordNote);
    const lyrics=song.querySelector('.song-lyrics');if(lyrics)lyrics.insertBefore(controls,lyrics.firstChild);
  });
  romanButton.addEventListener('click',()=>{romanized=!romanized;renderLyrics();});
  playlistButton.addEventListener('click',()=>{playlistOnly=!playlistOnly;applyFilters();});
  search.addEventListener('input',applyFilters);
  document.getElementById('transposeDown').addEventListener('click',()=>{semitones=(semitones+11)%12;renderLyrics();});
  document.getElementById('transposeUp').addEventListener('click',()=>{semitones=(semitones+1)%12;renderLyrics();});
  document.getElementById('transposeReset').addEventListener('click',()=>{semitones=0;renderLyrics();});
  document.getElementById('scrollStart').addEventListener('click',()=>{
    if(scrollTimer)clearInterval(scrollTimer);
    scrollTimer=setInterval(()=>window.scrollBy(0,Number(speed.value)),40);
  });
  document.getElementById('scrollStop').addEventListener('click',()=>{if(scrollTimer)clearInterval(scrollTimer);scrollTimer=null;});
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&scrollTimer){clearInterval(scrollTimer);scrollTimer=null;}});
  renderLyrics();applyFilters();
})();
