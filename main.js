(function(){
  const tg = window.Telegram && window.Telegram.WebApp;
  if (tg) {
    tg.expand();
    tg.MainButton.hide();
    tg.setHeaderColor('secondary_bg_color');
    tg.setBackgroundColor('secondary_bg_color');
  }
  const cfg = window.FITGLOW || {};
  const statusEl = document.getElementById('status');
  const btn = document.getElementById('payBtn');

  function setStatus(msg) {
    statusEl.textContent = msg || "";
  }

  async function fetchStatus(tgId){
    try{
      const res = await fetch(`${cfg.BACKEND_BASE}/status/${tgId}`);
      if(!res.ok) return;
      const data = await res.json();
      if(data.active){
        setStatus(`Подписка активна до ${new Date(data.paid_till).toLocaleDateString('ru-RU')}`);
        btn.textContent = "Продлить 49 ₽";
      }
    }catch(e){}
  }

  function pay(){
    if(!cfg.CP_PUBLIC_ID){ return setStatus("⚠️ Не задан PUBLIC_ID CloudPayments в config.js"); }
    const user = tg ? tg.initDataUnsafe?.user : null;
    if(!user){ return setStatus("⚠️ Telegram user не определён. Откройте MiniApp внутри Telegram."); }

    const invoiceId = `fitglow-${Date.now()}-${user.id}`;
    const widget = new cp.CloudPayments({language: 'ru-RU'});
    widget.pay('charge',
      {
        publicId: cfg.CP_PUBLIC_ID,
        description: cfg.TITLE,
        amount: cfg.PRICE,
        currency: cfg.CURRENCY,
        invoiceId: invoiceId,
        accountId: String(user.id),
        email: (user.username || 'user') + '@telegram',
        data: { tg_user_id: user.id }
      },
      {
        onSuccess: function (options) {
          setStatus("Оплата проходит… ждём подтверждения.");
        },
        onFail: function (reason, options) {
          setStatus("Оплата не прошла: " + (reason || "ошибка"));
        },
        onComplete: function (paymentResult, options) {
          // Финальное подтверждение — по серверному webhook Pay
          setStatus("Проверяем оплату… Проверьте сообщения от бота.");
          // Небольшой опрос статуса подписки
          setTimeout(()=>fetchStatus(user.id), 5000);
          setTimeout(()=>fetchStatus(user.id), 12000);
        }
      }
    );
  }

  if(btn){ btn.addEventListener('click', pay); }

  // подтянем статус при открытии
  const user = tg ? tg.initDataUnsafe?.user : null;
  if(user){
    fetchStatus(user.id);
  } else {
    setStatus("Откройте MiniApp внутри Telegram.");
  }
})();