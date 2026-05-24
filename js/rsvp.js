(function () {
  var form = document.querySelector('.rsvp-form');
  if (!form) return;

  var messageEl = document.getElementById('rsvp-message');
  var submitBtn = form.querySelector('button[type="submit"]');
  var config = window.RSVP_CONFIG || {};

  var ATTENDANCE_LABELS = {
    yes: 'Я приду / Мы придём',
    no: 'Прийти не получается',
  };

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    submitForm();
  });

  function setLoading(loading) {
    if (!submitBtn) return;
    submitBtn.disabled = loading;
    submitBtn.textContent = loading ? 'Отправляем…' : 'Отправить';
  }

  function showMessage(text, type) {
    if (!messageEl) return;
    messageEl.textContent = text;
    messageEl.hidden = !text;
    messageEl.className = 'rsvp-message' + (type ? ' rsvp-message--' + type : '');
  }

  async function submitForm() {
    if (!config.formspreeUrl) {
      showMessage(
        'Форма ещё не подключена. Напишите организаторам лично.',
        'error'
      );
      return;
    }

    var formData = new FormData(form);
    var attendance = formData.get('attendance');
    var name = String(formData.get('name') || '').trim();

    if (!attendance || !name) return;

    setLoading(true);
    showMessage('', '');

    try {
      var response = await fetch(config.formspreeUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          Присутствие: ATTENDANCE_LABELS[attendance] || attendance,
          Имя: name,
        }),
      });

      if (!response.ok) {
        var result = await response.json().catch(function () { return {}; });
        var errMsg =
          (result.errors && result.errors[0] && result.errors[0].message) ||
          'Не удалось отправить ответ';
        throw new Error(errMsg);
      }

      form.reset();
      showMessage('Спасибо! Мы получили ваш ответ ❤️', 'success');
    } catch (error) {
      showMessage(
        'Не удалось отправить. Попробуйте ещё раз или напишите нам лично.',
        'error'
      );
      console.error(error);
    } finally {
      setLoading(false);
    }
  }
})();
