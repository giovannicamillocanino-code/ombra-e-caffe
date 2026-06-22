document.addEventListener('DOMContentLoaded', function () {

    /* ================================================
       HAMBURGER MENU MOBILE
       ================================================ */
    const hamburger = document.getElementById('hamburger');
    const mainNav = document.getElementById('mainNav');

    if (hamburger && mainNav) {
        hamburger.addEventListener('click', function () {
            const isOpen = mainNav.classList.toggle('open');
            hamburger.classList.toggle('open', isOpen);
            hamburger.setAttribute('aria-expanded', isOpen);
        });

        mainNav.querySelectorAll('a').forEach(function (link) {
            link.addEventListener('click', function () {
                mainNav.classList.remove('open');
                hamburger.classList.remove('open');
                hamburger.setAttribute('aria-expanded', false);
            });
        });
    }

    /* ================================================
       LOGICA TARIFFE STAGIONALI
       ─────────────────────────────────────────────
       Tariffe base a notte (1–4 persone paganti):
         Bassa stagione  (gen, feb, ott, nov) : €145
         Bassa/Media     (mar, apr)            : €135
         Media stagione  (mag, giu, set)       : €145
         Alta stagione   (luglio)              : €235
         Altissima       (agosto)              : €255
         Festività       (dicembre)            : €175

       Ogni persona oltre le 4: +€20/notte
       Animali: +€100 una tantum

       Definizioni ospiti:
         Adulti         = persone con 12+ anni  → pagano tariffa piena
         Bambini 2–11   = 2 anni compiuti fino a 11 anni → pagano tariffa piena
         Bambini < 2a   = sotto i 2 anni → GRATIS (non contano nel prezzo)
         Max 12 ospiti  = adulti + bambini 2–11 + bambini <2a
       ================================================ */

    function tariffaBase(mese) {
        if (mese === 6) return { prezzo: 235, nome: 'Alta Stagione (Luglio)' };
        if (mese === 7) return { prezzo: 255, nome: 'Alta Stagione (Agosto)' };
        if (mese === 4 || mese === 5 || mese === 8) return { prezzo: 145, nome: 'Media Stagione' };
        if (mese === 2 || mese === 3) return { prezzo: 135, nome: 'Bassa/Media Stagione' };
        if (mese === 11) return { prezzo: 175, nome: 'Festività (Dicembre)' };
        return { prezzo: 145, nome: 'Bassa Stagione' };
    }

    function aggiornaCounterOspiti() {
        const adulti        = parseInt(document.getElementById('adulti').value) || 0;
        const bambini       = parseInt(document.getElementById('bambini').value) || 0;
        const bambiniGratis = parseInt(document.getElementById('bambini-gratis').value) || 0;
        const totaleContati = adulti + bambini;         // persone che contano per capienza
        const totaleFisico  = totaleContati + bambiniGratis; // tutti compreso neonati
        const counter = document.getElementById('ospiti-counter');
        if (!counter) return;

        if (totaleContati > 12) {
            counter.textContent = '⚠️ Massimo 12 ospiti (adulti + bambini 2–11 anni). Riduci il numero.';
            counter.style.color = '#dc3545';
        } else {
            const extra = Math.max(0, totaleContati - 4);
            let txt = `👥 Totale ospiti: ${totaleFisico}`;
            if (extra > 0) txt += ` · ${extra} ospite/i extra (+€20/notte cad.)`;
            if (bambiniGratis > 0) txt += ` · ${bambiniGratis} bambino/i <2 anni: gratis 🎉`;
            counter.textContent = txt;
            counter.style.color = '#a0c4a0';
        }
    }

    function calcolaTariffa() {
        const checkinVal    = document.getElementById('checkin').value;
        const checkoutVal   = document.getElementById('checkout').value;
        const adulti        = parseInt(document.getElementById('adulti').value) || 0;
        const bambini       = parseInt(document.getElementById('bambini').value) || 0;
        const bambiniGratis = parseInt(document.getElementById('bambini-gratis').value) || 0;
        const animali       = document.getElementById('animali').value;

        const risBox = document.getElementById('risultatoBox');
        const errBox = document.getElementById('erroreBox');

        // Validazione capienza (neonati <2a non contano per capienza)
        const totaleContati = adulti + bambini;
        const totaleFisico  = totaleContati + bambiniGratis;
        if (totaleContati > 12) {
            risBox.classList.add('d-none');
            errBox.classList.remove('d-none');
            errBox.textContent = '⚠️ Il numero massimo di ospiti è 12 (adulti + bambini 2–11 anni). I bambini sotto i 2 anni non contano nel limite.';
            return null;
        }

        if (!checkinVal || !checkoutVal) {
            risBox.classList.add('d-none');
            errBox.classList.remove('d-none');
            errBox.textContent = 'Seleziona sia la data di check-in che di check-out.';
            return null;
        }

        const dataIn  = new Date(checkinVal);
        const dataOut = new Date(checkoutVal);

        if (dataOut <= dataIn) {
            risBox.classList.add('d-none');
            errBox.classList.remove('d-none');
            errBox.textContent = 'La data di check-out deve essere successiva al check-in!';
            return null;
        }

        const oggi = new Date();
        oggi.setHours(0, 0, 0, 0);
        if (dataIn < oggi) {
            risBox.classList.add('d-none');
            errBox.classList.remove('d-none');
            errBox.textContent = 'La data di check-in non può essere nel passato.';
            return null;
        }

        const notti    = Math.ceil(Math.abs(dataOut - dataIn) / (1000 * 60 * 60 * 24));
        const stagione = tariffaBase(dataIn.getMonth());
        const base4    = stagione.prezzo;

        // Persone paganti = adulti (12+) + bambini 2–11 anni
        const extra          = Math.max(0, totaleContati - 4);
        const tariffaPerNotte = base4 + extra * 20;
        let totale            = tariffaPerNotte * notti;
        if (animali === 'si') totale += 100;

        errBox.classList.add('d-none');
        risBox.classList.remove('d-none');

        // Dettaglio testo
        let detPersone = adulti + ' Adult' + (adulti === 1 ? 'o (12+ anni)' : 'i (12+ anni)');
        if (bambini > 0)       detPersone += ', ' + bambini + ' Bambin' + (bambini === 1 ? 'o (2–11 anni)' : 'i (2–11 anni)');
        if (bambiniGratis > 0) detPersone += ', ' + bambiniGratis + ' Bambin' + (bambiniGratis === 1 ? 'o <2 anni (gratis)' : 'i <2 anni (gratis)');
        const animaleSup  = animali === 'si' ? ' + €100 supplemento animali' : '';
        const extraNote   = extra > 0
            ? ` · €${base4} base + ${extra}×€20 extra = €${tariffaPerNotte}/notte`
            : ` · €${tariffaPerNotte}/notte`;

        document.getElementById('dettaglioNotti').innerHTML =
            `<strong>${notti} nott${notti === 1 ? 'e' : 'i'}</strong> · ${stagione.nome} · ${detPersone}${extraNote}${animaleSup}`;
        document.getElementById('prezzoFinale').textContent = '€ ' + totale.toLocaleString('it-IT');

        return { checkin: checkinVal, checkout: checkoutVal, notti, adulti, bambini, bambiniGratis, animali, tariffaPerNotte, nomeStagione: stagione.nome, totale };
    }

    // Counter ospiti in tempo reale
    ['adulti', 'bambini', 'bambini-gratis'].forEach(function (id) {
        const el = document.getElementById(id);
        if (el) el.addEventListener('change', aggiornaCounterOspiti);
    });
    aggiornaCounterOspiti();

    const btnCalcola = document.getElementById('btnCalcola');
    if (btnCalcola) btnCalcola.addEventListener('click', calcolaTariffa);

    /* ================================================
       FORM RICHIESTA PRENOTAZIONE — WEB3FORMS
       ================================================ */
    const bookingForm = document.getElementById('bookingForm');

    if (bookingForm) {
        bookingForm.addEventListener('submit', function (e) {
            e.preventDefault();

            const successoDiv = document.getElementById('successoInvio');
            const errorDiv    = document.getElementById('errorInvio');
            const privacy     = document.getElementById('req-privacy').checked;

            errorDiv.classList.add('d-none');
            successoDiv.classList.add('d-none');

            if (!privacy) {
                errorDiv.classList.remove('d-none');
                errorDiv.textContent = 'Devi accettare la Privacy Policy per procedere.';
                return;
            }

            const dati = calcolaTariffa();
            const riepilogoInput = document.getElementById('preventivo-riepilogo');
            if (dati) {
                const animaleSup = dati.animali === 'si' ? ' + €100 supplemento animali' : '';
                riepilogoInput.value =
                    `${dati.notti} notti (${dati.checkin} → ${dati.checkout}) · ${dati.nomeStagione} · ` +
                    `${dati.adulti} Adulti (12+), ${dati.bambini} Bambini (2–11a), ${dati.bambiniGratis} Bambini (<2a gratis)` +
                    ` · €${dati.tariffaPerNotte}/notte${animaleSup} · STIMA TOTALE: €${dati.totale}`;
            } else {
                riepilogoInput.value = 'Date non compilate o non valide al momento dell\'invio.';
            }

            const btnInvia      = document.getElementById('btnInvia');
            const testoOriginale = btnInvia.innerHTML;
            btnInvia.disabled   = true;
            btnInvia.innerHTML  = '<i class="fas fa-spinner fa-spin me-2"></i> Invio in corso...';

            fetch('https://api.web3forms.com/submit', {
                method: 'POST',
                headers: { 'Accept': 'application/json' },
                body: new FormData(bookingForm)
            })
                .then(r => r.json())
                .then(function (result) {
                    if (result.success) {
                        successoDiv.classList.remove('d-none');
                        btnInvia.innerHTML = '<i class="fas fa-check me-2"></i> Richiesta Inviata';
                        bookingForm.reset();
                        document.getElementById('risultatoBox').classList.add('d-none');
                        aggiornaCounterOspiti();
                    } else {
                        errorDiv.classList.remove('d-none');
                        errorDiv.textContent = 'Invio non riuscito: ' + (result.message || 'riprova più tardi o contattaci telefonicamente.');
                        btnInvia.disabled  = false;
                        btnInvia.innerHTML = testoOriginale;
                    }
                })
                .catch(function () {
                    errorDiv.classList.remove('d-none');
                    errorDiv.textContent = 'Errore di connessione. Verifica la rete e riprova, oppure contattaci telefonicamente.';
                    btnInvia.disabled  = false;
                    btnInvia.innerHTML = testoOriginale;
                });
        });
    }

    /* ================================================
       CAROSELLO RECENSIONI (loop infinito)
       ================================================ */
    const wrapper = document.getElementById('review-wrapper');
    const btnLeft = document.getElementById('review-btn-left');
    const btnRight = document.getElementById('review-btn-right');

    if (wrapper && btnLeft && btnRight) {
        const originalCards    = Array.from(wrapper.children);
        const totalOriginals   = originalCards.length;
        let visibleCardsCount  = window.innerWidth <= 767 ? 1 : window.innerWidth <= 991 ? 2 : 3;

        for (let i = totalOriginals - visibleCardsCount; i < totalOriginals; i++) {
            if (originalCards[i]) wrapper.insertBefore(originalCards[i].cloneNode(true), wrapper.firstChild);
        }
        for (let i = 0; i < visibleCardsCount; i++) {
            if (originalCards[i]) wrapper.appendChild(originalCards[i].cloneNode(true));
        }

        let currentIndex   = visibleCardsCount;
        let isTransitioning = false;

        const updatePosition = function (smooth) {
            const cardWidth  = wrapper.children[0].offsetWidth;
            const totalWidth = cardWidth + 30;
            wrapper.style.transition = smooth ? 'transform 0.5s ease-in-out' : 'none';
            wrapper.style.transform  = 'translateX(-' + (currentIndex * totalWidth) + 'px)';
        };

        setTimeout(function () { updatePosition(false); }, 50);

        btnRight.addEventListener('click', function () {
            if (isTransitioning) return;
            isTransitioning = true; currentIndex++; updatePosition(true);
        });
        btnLeft.addEventListener('click', function () {
            if (isTransitioning) return;
            isTransitioning = true; currentIndex--; updatePosition(true);
        });
        wrapper.addEventListener('transitionend', function () {
            isTransitioning = false;
            if (currentIndex >= totalOriginals + visibleCardsCount) { currentIndex = visibleCardsCount; updatePosition(false); }
            if (currentIndex < visibleCardsCount) { currentIndex = totalOriginals + visibleCardsCount - 1; updatePosition(false); }
        });
        window.addEventListener('resize', function () {
            visibleCardsCount = window.innerWidth <= 767 ? 1 : window.innerWidth <= 991 ? 2 : 3;
            updatePosition(false);
        });
    }

    /* ================================================
       DATA MINIMA = OGGI
       ================================================ */
    const oggi  = new Date();
    const yyyy  = oggi.getFullYear();
    const mm    = String(oggi.getMonth() + 1).padStart(2, '0');
    const dd    = String(oggi.getDate()).padStart(2, '0');
    const oggiStr = `${yyyy}-${mm}-${dd}`;

    const checkinInput  = document.getElementById('checkin');
    const checkoutInput = document.getElementById('checkout');
    if (checkinInput)  checkinInput.min  = oggiStr;
    if (checkoutInput) checkoutInput.min = oggiStr;

    if (checkinInput && checkoutInput) {
        checkinInput.addEventListener('change', function () {
            if (checkoutInput.value && checkoutInput.value <= checkinInput.value) checkoutInput.value = '';
            checkoutInput.min = checkinInput.value || oggiStr;
        });
    }
});
