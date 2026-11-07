/* =========================================================
   BOCHKY — main.js (оптимизированная версия)
   - без Inputmask (нативная маска телефона)
   - ленивая загрузка Яндекс.Карт
   - ленивая загрузка SmartCaptcha
   - убран мёртвый код
   ========================================================= */

$(document).ready(function () {

  /* ======================================================
     1. ЛЕНИВАЯ ЗАГРУЗКА SMARTCAPTCHA
     ====================================================== */
  (function lazyCaptcha() {
    var loaded = false;
    function loadCaptcha() {
      if (loaded) return;
      loaded = true;
      var s = document.createElement('script');
      s.src = 'js/captcha.js';
      s.defer = true;
      document.head.appendChild(s);
    }
    var captchas = document.querySelectorAll('.smart-captcha-wrapper');
    if (!captchas.length) return;
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries, obs) {
        for (var i = 0; i < entries.length; i++) {
          if (entries[i].isIntersecting) {
            obs.disconnect();
            loadCaptcha();
            return;
          }
        }
      }, { rootMargin: '100px' });
      captchas.forEach(function (el) { io.observe(el); });
    } else {
      loadCaptcha();
    }
  })();

  /* ======================================================
     2. СБРОС SMARTCAPTCHA
     ====================================================== */
  function resetSmartCaptcha() {
    if (window.smartCaptcha && typeof window.smartCaptcha.reset === 'function') {
      window.smartCaptcha.reset();
    }
  }

  /* ======================================================
     3. МОБИЛЬНОЕ МЕНЮ
     ====================================================== */
  $('#showmenu').on('click', function () {
    $('.main-menu').addClass('opened');
  });
  $('#hidemenu').on('click', function () {
    $('.main-menu').removeClass('opened');
  });
  $('.main-menu__mobile').on('click', 'a', function () {
    $('.main-menu').removeClass('opened');
  });

  /* ======================================================
     4. КАРТА (ленивая загрузка API Яндекс.Карт)
     ====================================================== */
  (function initMapLazily() {
    var mapEl = document.getElementById('map');
    if (!mapEl) return;
    var loaded = false;

    function loadApi() {
      if (loaded) return;
      loaded = true;
      var s = document.createElement('script');
      s.src = 'https://api-maps.yandex.ru/2.0/?load=package.full&lang=ru-RU';
      s.onload = function () { ymaps.ready(buildMap); };
      document.head.appendChild(s);
    }

    function buildMap() {
      var map = new ymaps.Map('map', {
        center: [54.617866, 39.74885],
        zoom: 13,
        behaviors: isTouchDevice() ? ['multiTouch'] : ['default'],
      });
      map.geoObjects.add(new ymaps.Placemark([54.6265, 39.732476], { hintContent: '' }, {}));
      map.geoObjects.add(new ymaps.Placemark([54.608457, 39.770486], { hintContent: '' }, {}));
      map.controls.add(new ymaps.control.ZoomControl());
    }

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries, obs) {
        if (entries[0].isIntersecting) { obs.disconnect(); loadApi(); }
      }, { rootMargin: '200px' }).observe(mapEl);
    } else {
      window.addEventListener('load', loadApi);
    }
  })();

  /* ======================================================
     5. ПОДСТАНОВКА ДАННЫХ В ПОПАП ТОВАРА
     ====================================================== */
  function get_product_info(link, container) {
    var $product = link.closest('.catalog-item');
    var $imageSrc = $product.querySelector('img').src;
    var $title = $product.querySelector('.catalog-item__name').textContent;
    var $description = $product.querySelector('.catalog-item__text').textContent;

    container.querySelector('.popup-info__title').textContent = $title;
    container.querySelector("input[name='title']").value = $title;
    container.querySelector('.popup-info__descr').textContent = $description;
    container.querySelector('.popup-info__img img').src = $imageSrc;
  }

  /* ======================================================
     6. МАСКА ТЕЛЕФОНА (нативная, без Inputmask)
     ====================================================== */
  function maskPhone(input) {
    input.addEventListener('input', function () {
      var d = this.value.replace(/\D/g, '').slice(0, 11);
      if (d.startsWith('8')) d = '7' + d.slice(1);
      if (d && !d.startsWith('7')) d = '7' + d;
      var out = '+7';
      if (d.length > 1) out += ' (' + d.slice(1, 4);
      if (d.length >= 5) out += ') ' + d.slice(4, 7);
      if (d.length >= 8) out += '-' + d.slice(7, 9);
      if (d.length >= 10) out += '-' + d.slice(9, 11);
      this.value = out;
    });
  }
  document.querySelectorAll('input.text-input--phone').forEach(maskPhone);

  /* ======================================================
     7. ВАЛИДАЦИЯ ТЕЛЕФОНА
     ====================================================== */
  function checkPhone($form, raw) {
    if (raw.length !== 10) {
      $form.find('input.text-input--phone').addClass('error');
      $form.find('button[type="submit"]').attr('disabled', '');
      return 'error';
    } else {
      $form.find('input.text-input--phone').removeClass('error');
      $form.find('button[type="submit"]').removeAttr('disabled');
      return 'valid';
    }
  }

  $(document).on('click', '.popup-form__form button[type="submit"]', function () {
    var $parentForm = $(this).closest('.popup-form__form');
    var unmaskedVal = $parentForm.find('input.text-input--phone').val().replace(/\D/g, '').slice(1);
    if (checkPhone($parentForm, unmaskedVal) === 'error') return false;
  });

  $(document).on('keyup change', 'input.text-input--phone', function () {
    var unmaskedVal = $(this).val().replace(/\D/g, '').slice(1);
    var $parentForm = $(this).closest('.popup-form__form');
    checkPhone($parentForm, unmaskedVal);
  });

  /* ======================================================
     8. ОТПРАВКА ФОРМ В ПОПАПАХ (.popup-form__form)
     ====================================================== */
  function sendEmail(e) {
    e.preventDefault();

    var msg = {
      loading: 'Отправка...',
      success: 'Спасибо. Форма отправлена',
      failed: 'Что-то пошло не так...',
    };

    var form = this;
    var fData = new FormData(form);
    var wrap = form.closest('.popup__inner');
    var statusMessage = wrap.querySelector('.status');
    statusMessage.textContent = msg.loading;

    fetch('mail.php', { method: 'POST', body: fData })
      .then(function (r) {
        if (!r.ok) throw new Error('Ошибка отправки');
        return r.text();
      })
      .then(function () {
        statusMessage.textContent = msg.success;
      })
      .catch(function () {
        statusMessage.textContent = msg.failed;
        resetSmartCaptcha();
      })
      .finally(function () {
        form.reset();
        resetSmartCaptcha();
        setTimeout(function () {
          $.magnificPopup.close();
          statusMessage.textContent = '';
        }, 2000);
        form.removeEventListener('submit', sendEmail);
      });
  }

  function handlerSubmit(popup) {
    var form = popup.content[0].querySelector('form.popup-form__form');
    if (form) form.addEventListener('submit', sendEmail);
  }

  /* ======================================================
     9. ОТКРЫТИЕ ПОПАПОВ
     ====================================================== */
  $(document).on('click', '.open-popup', function (e) {
    e.preventDefault();
    var self = this;
    var popupEl = $(this).attr('href');
    if (!$(popupEl).length) return false;

    $.magnificPopup.open({
      fixedContentPos: true,
      fixedBgPos: true,
      items: { src: $(popupEl), type: 'inline' },
      callbacks: {
        open: function () {
          if (this.content[0].id === 'popup-info') {
            get_product_info(self, this.content[0]);
          }
          handlerSubmit(this);
        },
      },
    });
    return false;
  });

  $(document).on('click', '.close-popup', function (e) {
    e.preventDefault();
    $.magnificPopup.close();
  });

  /* ======================================================
     10. КВИЗ-ФОРМА — отправка через AJAX
     ====================================================== */
  $('#test-section form')
    .off('submit.quiz')
    .on('submit.quiz', function (e) {
      e.preventDefault();
      var $form = $(this);
      var formData = new FormData(this);

      $.ajax({
        url: $form.attr('action'),
        type: $form.attr('method') || 'post',
        data: formData,
        processData: false,
        contentType: false,
        success: function () {
          $.magnificPopup.open({
            fixedContentPos: true,
            fixedBgPos: true,
            showCloseBtn: false,
            closeOnBgClick: true,
            enableEscapeKey: true,
            items: { src: $('#popup-thanks'), type: 'inline' },
          });
          $form[0].reset();
          resetSmartCaptcha();
        },
        error: function (xhr) {
          alert('Ошибка отправки. Попробуйте ещё раз.');
          console.error('Send error', xhr.status, xhr.responseText);
          resetSmartCaptcha();
        },
      });
    });

  /* ======================================================
     11. ГАЛЕРЕИ (Slick)
     ====================================================== */
  $('.gallery__slider').each(function () {
    var that = $(this);
    that
      .on('init', function () {
        that.find('.slick-slide[data-slick-index="-1"]').addClass('lt1');
        that.find('.slick-slide[data-slick-index="1"]').addClass('gt1');
      })
      .slick({
        centerMode: true,
        centerPadding: 0,
        slidesToShow: 5,
        arrows: false,
        touchThreshold: 20,
      })
      .on('beforeChange', function (event, slick, current, next) {
        that.find('.gt1').removeClass('gt1');
        that.find('.lt1').removeClass('lt1');

        var lt1 = current < next && current > 0 ? current : next - 1;
        var gt1 = current < next || next === 0 ? next + 1 : current;
        var sliderEdge = slick.slideCount - 1;

        that.find('.slick-slide[data-slick-index="' + lt1 + '"]').addClass('lt1');
        that.find('.slick-slide[data-slick-index="' + gt1 + '"]').addClass('gt1');

        if (current === sliderEdge && next === 0) {
          that.find('.slick-slide[data-slick-index="' + current + '"]').addClass('lt1');
          that.find('.slick-slide[data-slick-index="' + (current + 1) + '"]').addClass('active-helper');
          that.find('.slick-slide[data-slick-index="' + (current + 2) + '"]').addClass('gt1');
        }
        if (current === 0 && next === sliderEdge) {
          that.find('.slick-slide[data-slick-index="' + current + '"]').addClass('gt1');
          that.find('.slick-slide[data-slick-index="' + (current - 1) + '"]').addClass('active-helper');
          that.find('.slick-slide[data-slick-index="' + (current - 2) + '"]').addClass('lt1');
        }
      })
      .on('afterChange', function () {
        that.find('.active-helper').removeClass('active-helper');
      });
  });

  $('.gallery .slick-prev').on('click', function () {
    $(this).closest('.gallery').find('.gallery__slider').slick('slickPrev');
  });
  $('.gallery .slick-next').on('click', function () {
    $(this).closest('.gallery').find('.gallery__slider').slick('slickNext');
  });

  /* ======================================================
     12. FAQ
     ====================================================== */
  $('.faq-item__title').on('click', function () {
    $(this)
      .toggleClass('faq-item__title--active')
      .next('.faq-item__text')
      .slideToggle(300);
  });

  /* ======================================================
     13. ФИЛЬТР КАТАЛОГА
     ====================================================== */
  $('.catalog-filter__item').on('click', function () {
    if ($(this).hasClass('catalog-filter__item--active')) return false;

    $('.catalog-filter__item').removeClass('catalog-filter__item--active');
    $(this).addClass('catalog-filter__item--active');

    var filterVal = $(this).data('filter');
    if (filterVal !== 'all') {
      $('.catalog-cell').addClass('hidden');
      $('.catalog-item[data-type="' + filterVal + '"]').each(function () {
        $(this).closest('.catalog-cell').removeClass('hidden');
      });
    } else {
      $('.catalog-cell').removeClass('hidden');
    }
  });

  /* ======================================================
     14. ГАЛЕРЕЯ ТОВАРА (страница shop, если есть)
     ====================================================== */
  $('.shop-item__thumb').on('click', function () {
    var imgSrc = $(this).find('img').attr('src');
    $(this).closest('.shop-item__gallery').find('.shop-item__bigimg img').attr('src', imgSrc);
    return false;
  });

  $('.shop-item .show-more').on('click', function () {
    var $hidden = $(this).closest('.shop-item__added').find('.shop-item__hidden');
    if (!$hidden.length) return false;

    if ($hidden.is(':hidden')) {
      $hidden.slideDown(300);
      $(this).text('Скрыть');
    } else {
      $hidden.slideUp(300);
      $(this).text('Смотреть все');
    }
    return false;
  });

  /* ======================================================
     15. ВНЕШНЯЯ ФОРМА #my-unique-form (если есть на странице)
     ====================================================== */
  var externalForm = document.querySelector('#my-unique-form');
  if (externalForm) {
    externalForm.addEventListener('submit', function (e) {
      e.preventDefault();

      var msg = {
        loading: 'Отправка...',
        success: 'Спасибо! Форма отправлена.',
        failed: 'Что-то пошло не так...',
      };

      var statusEl = externalForm.querySelector('.status');
      statusEl.textContent = msg.loading;

      fetch('mail.php', { method: 'POST', body: new FormData(externalForm) })
        .then(function (r) {
          if (!r.ok) throw new Error('Ошибка отправки');
          return r.text();
        })
        .then(function () { statusEl.textContent = msg.success; })
        .catch(function () { statusEl.textContent = msg.failed; })
        .finally(function () {
          externalForm.reset();
          resetSmartCaptcha();
          setTimeout(function () { statusEl.textContent = ''; }, 3000);
        });
    });
  }

});

/* ======================================================
   ХЕЛПЕР: определение тач-устройства
   ====================================================== */
function isTouchDevice() {
  try {
    document.createEvent('TouchEvent');
    return true;
  } catch (e) {
    return false;
  }
}