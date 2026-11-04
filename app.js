const cfg=window.CHURCH_CONFIG||{};
const langButton=document.getElementById('langToggle');let language='en';
function setLanguage(next){language=next;document.documentElement.lang=next;document.querySelectorAll('[data-en][data-ne]').forEach(el=>{el.textContent=el.dataset[next]});langButton.textContent=next==='en'?'नेपाली':'English';}
langButton.addEventListener('click',()=>setLanguage(language==='en'?'ne':'en'));
const links={youtube:cfg.youtubeChannelUrl,prayer:cfg.prayerFormUrl};
document.querySelectorAll('[data-link]').forEach(a=>{const url=links[a.dataset.link];if(url){a.href=url;a.target='_blank';a.rel='noopener';a.textContent=language==='en'?'Open':'खोल्नुहोस्';}});
if('serviceWorker' in navigator && location.protocol.startsWith('http')){window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));}
