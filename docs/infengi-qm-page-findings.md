TITLE=Калькулятор Ци Мень Дун Цзя
SCRIPTS:
https://mc.yandex.ru/metrika/watch.js
[inline]
https://ajax.googleapis.com/ajax/libs/jquery/1.8/jquery.min.js
/media/system/js/mootools-core.js?495e386e404b5202432e2df87ba32699
/media/system/js/core.js?495e386e404b5202432e2df87ba32699
/js/scripts.js?v=17
/media/system/js/keepalive.js?495e386e404b5202432e2df87ba32699
https://infengi.ru/modules/mod_jshopping_cart_wl_ajax/assets/js/js_cart_view.js
https://infengi.ru/modules/mod_jshopping_cart_wl_ajax/assets/js/ajax.js
[inline]
https://cdn.jsdelivr.net/npm/suggestions-jquery@19.2.0/dist/js/jquery.suggestions.min.js
https://code.jquery.com/ui/1.10.4/jquery-ui.js
/js/bz/timepicker-addon.js
https://maps.googleapis.com/maps/api/js?libraries=places&key=AIzaSyBNuRMD4j3gpSuKtVIoiSEduxU52WyMvDk
/js/html2canvas.js
/js/jquery.cookie.js
/js/jquery.disable.text.select.js
/js/qm.js
[inline]
[inline]
[inline]
[inline]
FORMS:
form action=/qm method=post id=login-form
form action=/qm method=GET id=bzForm
QM-RELATED IDS:
select#sistem
button#qmSubmit
div#warningChasWrap
div#warningChas
div#qm_result
input#rasklad_year
input#rasklad_month
input#rasklad_day
div#qmPrintObl
div#qm_all
div#chasBloks
div#chas_block1
div#chas_block2
div#chas_block3
div#chas_block4
div#chas_block5
div#chas_block6
div#chas_block7
div#chas_block8
div#chas_block9
div#chas_block10
div#chas_block11
div#chas_block12
div#chas_block13
div#qm_hours
div#qm_hours_tbl1
div#qm_hours_tbl2
div#qm_hours_tbl3
div#qm_hours_tbl4
div#qm_hours_tbl5
div#qm_hours_tbl6
div#qm_hours_tbl7
div#qm_hours_tbl8
div#qm_hours_tbl9
div#qm_hours_tbl10
div#qm_hours_tbl11
div#qm_hours_tbl12
div#qm_hours_tbl13
div#ui-datepicker-div
INLINE HANDLERS:
form onkeydown=if(event.keyCode==13){return false;}
button onclick=CloseCadreAlertCookie();

## Проверка 21.08.2026

Источник: https://infengi.ru/qm?bzData=21.08.2026&bzDataOld=21.08.2026&sistem=1&city=Москва%2C+Россия&utc=3.00&lat=55.755826&lng=37.6173&bzName=&bzPol=1&bzData2=07.08.2026&bzData2Old=07.08.2026&bzTime2=11%3A15&city2=Москва%2C+Россия&utc2=3.00&lat2=55.755826&lng2=37.6173&pro=0

Один серверный ответ страницы содержит все 13 часовых блоков: 庚子, 辛丑, 壬寅, 癸卯, 甲辰, 乙巳, 丙午, 丁未, 戊申, 己酉, 庚戌, 辛亥 и 壬子. В HTML присутствуют отдельные DOM-блоки `chas_block1`–`chas_block13`, а также 13 таблиц `.qm_table` для часовых карт. Поэтому для сверки не требуется вручную отправлять 13 отдельных запросов: достаточно разобрать один HTML-ответ и сопоставить каждый блок с картой Aether Oracle.

Страница использует выбранную систему Чжи Рен (`sistem=1` в URL), город Москва, UTC+3 и координаты 55.755826, 37.6173. Время двухчасовок в infengi задано по солнечной локализации, поэтому при сравнении нужно разделять номер/ствол часового столпа и отображаемое локальное окно времени.


