
(function(){
    const mainContainer = document.getElementById('hlavni-container');
    const sideContainer = document.getElementById('vedlejsi-container');

    function getNemesis(obj){
        return obj.nemesis ?? obj.Nemesis ?? 'Neznámý';
    }

    function createCard(person){
        const article = document.createElement('article');
        article.className = 'karta';

       
        const img = document.createElement('img');
        img.alt = person.jmeno || '';
        img.loading = 'lazy';

      
        function candidatesFromName(name){
            if(!name) return [];
            const parts = name.split(/\s+/).filter(Boolean);
            const first = parts[0]?.toLowerCase().replace(/[^a-z0-9]/g,'') || '';
            const last = parts[parts.length-1]?.toLowerCase().replace(/[^a-z0-9]/g,'') || '';
            const all = name.toLowerCase().replace(/\s+/g,'').replace(/[^a-z0-9]/g,'');
            const out = [];
            if(first) out.push(first);
            if(last && last !== first) out.push(last);
            if(all && !out.includes(all)) out.push(all);
            return out;
        }

        const cand = person.image ? [person.image] : candidatesFromName(person.jmeno).map(n => `images/${n}.jpg`);
        const placeholder = 'images/placeholder.svg';

        
        img.src = placeholder;
        article.appendChild(img);

        (function tryLoadCandidates(list){
            let i = 0;
            function next(){
                if(i >= list.length) return; 
                const test = new Image();
                test.onload = function(){ img.src = list[i]; };
                test.onerror = function(){ i += 1; next(); };
                test.src = list[i];
            }
            next();
        })(cand);

        const h = document.createElement('h3'); h.textContent = person.jmeno || 'Bez jména';
        article.appendChild(h);

        if(person.povolani) {
            const p1 = document.createElement('p'); p1.textContent = person.povolani; article.appendChild(p1);
        }
        if(person.vek) {
            const p2 = document.createElement('p'); p2.textContent = `Věk: ${person.vek}`; article.appendChild(p2);
        }

        const meta = document.createElement('div'); meta.className = 'meta';
        meta.textContent = `Status: ${person.status || '—'} • Nemesis: ${getNemesis(person)}`;
        article.appendChild(meta);

        return article;
    }

    async function loadJSON(path){
        console.debug('[fetch] requesting', path);
        const res = await fetch(path, {cache: 'no-cache'});
        console.debug('[fetch] response', path, res.status, res.statusText);
        if(!res.ok){
            let body = '';
            try{ body = await res.text(); }catch(e){ body = '<no body>'; }
            throw new Error(`HTTP ${res.status} ${res.statusText} — ${body.slice(0,200)}`);
        }
        try{
            return await res.json();
        }catch(e){
            const text = await res.text().catch(()=>'<unreadable>');
            throw new Error('Invalid JSON: ' + e.message + ' — response text: ' + text.slice(0,200));
        }
    }

    async function loadData(){
       
        try{
            const dataHlavni = await loadJSON('../data/hlavni_postavy.json');
            const arrH = dataHlavni?.hlavni_postavy || [];
            if(mainContainer){
                if(arrH.length === 0) mainContainer.innerHTML = '<p>Žádné položky k zobrazení.</p>';
                arrH.forEach(item => mainContainer.appendChild(createCard(item)));
            }

            const dataVedlejsi = await loadJSON('../data/vedlejsi_postavy.json');
            const arrV = dataVedlejsi?.vedlejsi_postavy || [];
            if(sideContainer){
                if(arrV.length === 0) sideContainer.innerHTML = '<p>Žádné položky k zobrazení.</p>';
                arrV.forEach(item => sideContainer.appendChild(createCard(item)));
            }
        }catch(e){
            const help = `Nepodařilo se načíst data přes fetch: ${e.message}.`;
            const advice = `Spusť lokální HTTP server (např. 'python -m http.server' v kořenovém adresáři projektu) a otevři http://localhost:8000/public/index.html`;
            const full = `${help} ${advice}`;
            
            const errEl = document.getElementById('fetch-error');
            if(errEl) errEl.innerHTML = `<strong>Chyba načítání dat</strong><p>${help}</p><p>${advice}</p><button id="retry-fetch">Zkusit znovu</button>`;
            if(mainContainer) mainContainer.innerHTML = '';
            if(sideContainer) sideContainer.innerHTML = '';
            console.error(e);
           
            setTimeout(()=>{
                const btn = document.getElementById('retry-fetch');
                if(btn) btn.addEventListener('click', ()=>{ if(errEl) errEl.textContent = 'Opakuji načítání...'; loadData(); });
            },50);
        }
    }

   
    loadData();
})();
