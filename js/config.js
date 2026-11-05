/* ==========================================================================
   SQL Archive — configurazione
   Modifica qui i dati per le donazioni PayPal.
   ========================================================================== */
window.SQL_ARCHIVE_CONFIG = {
  paypal: {
    // Opzione 1 (consigliata): il tuo nome utente PayPal.Me
    //   es. se il tuo link è https://paypal.me/MarioRossi  ->  'MarioRossi'
    username: 'TUO_USERNAME_PAYPAL',

    // Opzione 2: ID di un pulsante "Donate" creato su paypal.com
    //   (se compilato, ha la precedenza su username)
    hostedButtonId: '',

    currency: 'EUR',
    amounts: [3, 5, 10, 20]
  }
};
