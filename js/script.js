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

        // Chiude il menu quando si clicca un link
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
       Bassa stagione  : €42/persona/notte  (gen-apr, ott-dic)
       Media stagione  : €60/persona/notte  (mag, giu, set)
       Alta stagione   : €95/persona/notte  (lug, ago)
       Bambini         : stessa tariffa adulti (NESSUNO sconto)
       Animali         : supplemento fisso €100 (una tantum)
       Soggiorno minimo: 7 notti
       ================================================ */
    function calcolaTariffa() {
        const checkinVal = document.getElementById('checkin').value;
        const checkoutVal = document.getElementById('checkout').value;
        const adulti = parseInt(document.getElementById('adulti').value) || 0;
        const bambini = parseInt(document.getElementById('bambini').value) || 0;
        const animali = document.getElementById('animali').value;

        const risBox = document.getElementById('risultatoBox');
        const errBox = document.getElementById('erroreBox');

        if (!checkinVal || !checkoutVal) {
            risBox.classList.add('d-none');
            errBox.classList.remove('d-none');
            errBox.textContent = 'Seleziona sia la data di check-in che di check-out.';
            return null;
        }

        const dataIn = new Date(checkinVal);
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

        const diffTime = Math.abs(dataOut - dataIn);
        const notti = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (notti < 7) {
            risBox.classList.add('d-none');
            errBox.classList.remove('d-none');
            errBox.textContent = 'Il soggiorno minimo è di 7 notti. Seleziona un periodo più lungo.';
            return null;
        }

        const mese = dataIn.getMonth(); // 0=gen, 6=lug, 7=ago

        let tariffaPersonaNotte = 42;
        let nomeStagione = 'Bassa Stagione';

        if (mese === 4 || mese === 5 || mese === 8) { // mag, giu, set
            tariffaPersonaNotte = 60;
            nomeStagione = 'Media Stagione';
        } else if (mese === 6 || mese === 7) { // lug, ago
            tariffaPersonaNotte = 95;
            nomeStagione = 'Alta Stagione';
        }

        const totalePersone = adulti + bambini;
        const costoBase = totalePersone * tariffaPersonaNotte * notti;
        let totale = costoBase;

        if (animali === 'si') {
            totale += 100; // supplemento fisso una tantum
        }

        errBox.classList.add('d-none');
        risBox.classList.remove('d-none');

        const animaleSup = animali === 'si' ? ' + €100 supplemento animali' : '';
        document.getElementById('dettaglioNotti').innerHTML =
            `<strong>${notti} notti</strong> · ${nomeStagione} · ${adulti} Adulti${bambini > 0 ? ', ' + bambini + ' Bambini' : ''} · <strong>€${tariffaPersonaNotte}/notte a persona</strong>${animaleSup}`;

        document.getElementById('prezzoFinale').textContent = '€ ' + totale.toLocaleString('it-IT');

        return {
            checkin: checkinVal,
            checkout: checkoutVal,
            notti,
            adulti,
            bambini,
            animali,
            tariffaPersonaNotte,
            nomeStagione,
            totale
        };
    }

    const btnCalcola = document.getElementById('btnCalcola');
    if (btnCalcola) {
        btnCalcola.addEventListener('click', calcolaTariffa);
    }

    /* ================================================
       FORM DI RICHIESTA PRENOTAZIONE — WEB3FORMS
       Invia i dati al servizio Web3Forms via fetch.
       L'email arriva sempre alla casella collegata alla
       Access Key, indipendentemente dal dispositivo
       dell'utente (nessun client di posta richiesto).
       ================================================ */
    const bookingForm = document.getElementById('bookingForm');

    if (bookingForm) {
        bookingForm.addEventListener('submit', function (e) {
            e.preventDefault();

            const successoDiv = document.getElementById('successoInvio');
            const errorDiv = document.getElementById('errorInvio');
            const privacy = document.getElementById('req-privacy').checked;

            errorDiv.classList.add('d-none');
            successoDiv.classList.add('d-none');

            if (!privacy) {
                errorDiv.classList.remove('d-none');
                errorDiv.textContent = 'Devi accettare la Privacy Policy per procedere.';
                return;
            }

            // Ricalcola il preventivo e lo inserisce nel campo nascosto,
            // così il riepilogo prezzo arriva anche nell'email.
            const dati = calcolaTariffa();
            const riepilogoInput = document.getElementById('preventivo-riepilogo');
            if (dati) {
                const animaleSup = dati.animali === 'si' ? ' + €100 supplemento animali' : '';
                riepilogoInput.value =
                    `${dati.notti} notti (${dati.checkin} → ${dati.checkout}) · ${dati.nomeStagione} · ` +
                    `${dati.adulti} Adulti, ${dati.bambini} Bambini · €${dati.tariffaPersonaNotte}/notte a persona` +
                    `${animaleSup} · STIMA TOTALE: €${dati.totale}`;
            } else {
                riepilogoInput.value = 'Date non compilate o non valide al momento dell\'invio.';
            }

            // Stato di caricamento sul bottone
            const btnInvia = document.getElementById('btnInvia');
            const testoOriginale = btnInvia.innerHTML;
            btnInvia.disabled = true;
            btnInvia.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i> Invio in corso...';

            const formData = new FormData(bookingForm);

            fetch('https://api.web3forms.com/submit', {
                method: 'POST',
                headers: { 'Accept': 'application/json' },
                body: formData
            })
                .then(function (response) { return response.json(); })
                .then(function (result) {
                    if (result.success) {
                        successoDiv.classList.remove('d-none');
                        btnInvia.innerHTML = '<i class="fas fa-check me-2"></i> Richiesta Inviata';
                        bookingForm.reset();
                        document.getElementById('risultatoBox').classList.add('d-none');
                    } else {
                        errorDiv.classList.remove('d-none');
                        errorDiv.textContent = 'Invio non riuscito: ' + (result.message || 'riprova più tardi o contattaci telefonicamente.');
                        btnInvia.disabled = false;
                        btnInvia.innerHTML = testoOriginale;
                    }
                })
                .catch(function () {
                    errorDiv.classList.remove('d-none');
                    errorDiv.textContent = 'Errore di connessione. Verifica la rete e riprova, oppure contattaci telefonicamente.';
                    btnInvia.disabled = false;
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
        const originalCards = Array.from(wrapper.children);
        const totalOriginals = originalCards.length;
        let visibleCardsCount = window.innerWidth <= 767 ? 1 : window.innerWidth <= 991 ? 2 : 3;

        // Clona per loop infinito
        for (let i = totalOriginals - visibleCardsCount; i < totalOriginals; i++) {
            if (originalCards[i]) {
                wrapper.insertBefore(originalCards[i].cloneNode(true), wrapper.firstChild);
            }
        }
        for (let i = 0; i < visibleCardsCount; i++) {
            if (originalCards[i]) {
                wrapper.appendChild(originalCards[i].cloneNode(true));
            }
        }

        let currentIndex = visibleCardsCount;
        let isTransitioning = false;

        const updatePosition = function (smooth) {
            const cardWidth = wrapper.children[0].offsetWidth;
            const gap = 30;
            const totalWidth = cardWidth + gap;
            wrapper.style.transition = smooth ? 'transform 0.5s ease-in-out' : 'none';
            wrapper.style.transform = 'translateX(-' + (currentIndex * totalWidth) + 'px)';
        };

        setTimeout(function () { updatePosition(false); }, 50);

        btnRight.addEventListener('click', function () {
            if (isTransitioning) return;
            isTransitioning = true;
            currentIndex++;
            updatePosition(true);
        });

        btnLeft.addEventListener('click', function () {
            if (isTransitioning) return;
            isTransitioning = true;
            currentIndex--;
            updatePosition(true);
        });

        wrapper.addEventListener('transitionend', function () {
            isTransitioning = false;
            if (currentIndex >= totalOriginals + visibleCardsCount) {
                currentIndex = visibleCardsCount;
                updatePosition(false);
            }
            if (currentIndex < visibleCardsCount) {
                currentIndex = totalOriginals + visibleCardsCount - 1;
                updatePosition(false);
            }
        });

        window.addEventListener('resize', function () {
            visibleCardsCount = window.innerWidth <= 767 ? 1 : window.innerWidth <= 991 ? 2 : 3;
            updatePosition(false);
        });
    }

    /* ================================================
       IMPOSTA DATA MINIMA = OGGI
       ================================================ */
    const oggi = new Date();
    const yyyy = oggi.getFullYear();
    const mm = String(oggi.getMonth() + 1).padStart(2, '0');
    const dd = String(oggi.getDate()).padStart(2, '0');
    const oggiStr = `${yyyy}-${mm}-${dd}`;

    const checkinInput = document.getElementById('checkin');
    const checkoutInput = document.getElementById('checkout');
    if (checkinInput) checkinInput.min = oggiStr;
    if (checkoutInput) checkoutInput.min = oggiStr;

    if (checkinInput && checkoutInput) {
        checkinInput.addEventListener('change', function () {
            if (checkoutInput.value && checkoutInput.value <= checkinInput.value) {
                checkoutInput.value = '';
            }
            checkoutInput.min = checkinInput.value || oggiStr;
        });
    }
});
