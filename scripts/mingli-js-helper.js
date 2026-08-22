/*
* Version 1.0
* */
(function() {
    Date.prototype.DaysInMonth = function() {
        return 33 - new Date(this.getFullYear(), this.getMonth(), 33).getDate();
    };


    var matched, browser;

// Использовать jQuery.browser не одобряется.
// Подробнее: http://api.jquery.com/jQuery.browser
// jQuery.uaMatch поддерживается для совместимости
    jQuery.uaMatch = function( ua ) {
        ua = ua.toLowerCase();

        var match = /(chrome)[ \/]([\w.]+)/.exec( ua ) ||
            /(webkit)[ \/]([\w.]+)/.exec( ua ) ||
            /(opera)(?:.*version|)[ \/]([\w.]+)/.exec( ua ) ||
            /(msie) ([\w.]+)/.exec( ua ) ||
            ua.indexOf("compatible") < 0 && /(mozilla)(?:.*? rv:([\w.]+)|)/.exec( ua ) ||
            [];

        return {
            browser: match[ 1 ] || "",
            version: match[ 2 ] || "0"
        };
    };

    matched = jQuery.uaMatch( navigator.userAgent );
    browser = {};

    if ( matched.browser ) {
        browser[ matched.browser ] = true;
        browser.version = matched.version;
    }

// Chrome is Webkit, but Webkit is also Safari.
    if ( browser.chrome ) {
        browser.webkit = true;
    } else if ( browser.webkit ) {
        browser.safari = true;
    }

    jQuery.browser = browser;

    jQuery.sub = function() {
        function jQuerySub( selector, context ) {
            return new jQuerySub.fn.init( selector, context );
        }
        jQuery.extend( true, jQuerySub, this );
        jQuerySub.superclass = this;
        jQuerySub.fn = jQuerySub.prototype = this();
        jQuerySub.fn.constructor = jQuerySub;
        jQuerySub.sub = this.sub;
        jQuerySub.fn.init = function init( selector, context ) {
            if ( context && context instanceof jQuery && !(context instanceof jQuerySub) ) {
                context = jQuerySub( context );
            }

            return jQuery.fn.init.call( this, selector, context, rootjQuerySub );
        };
        jQuerySub.fn.init.prototype = jQuerySub.fn;
        var rootjQuerySub = jQuerySub(document);
        return jQuerySub;
    };

})();

(function(){
    jQuery('.ContentADJsonInsert').empty();
})();


jQuery.fn.center = function () {
    this.css("position","absolute");
    this.css("top", ((jQuery(window).height() - this.outerHeight()) / 2) + jQuery(window).scrollTop() + "px");
    this.css("left", ((jQuery(window).width() - this.outerWidth()) / 2) + jQuery(window).scrollLeft() + "px");
    return this;
};

function TemplateParse(template,data){
    "user strict";
    var search;
    for (var property in data) {
        if (data.hasOwnProperty(property)) {
            search = new RegExp('{' + property + '}', 'g');
            template = template.replace(search, data[property]);
        }
    }
    // заменяем оставшиеся параметры на пустое место оставшиеся параметры
    search = new RegExp('{[\\_\\w\\d\\-]+}', 'g');
    template = template.replace(search, '');
    return template;
}

(function( $ ) {
    var SelectorIndex = 1;
    var plgOptions = [];

    var methods = {
        init : function( options ) {
            // А ВОТ ЭТОТ
            var option = jQuery.extend({
                placeholder:'введите данные ...',
                event_add_item:function(objid,data){}, // Действия при выборе элемента
                event_before_reload:function(list){return list;},
                event_remove_item:function(objid,data){},
                event_draw_item:function(item){        },
                items:[],
                plugin:'system', // Плагин обрабатывающий автокомплит
                getListMethod:'list', // Метод плагина, для флрирования списка
                reloadItemsDataMethod:'reload', // Обновление списка
                itemsclass:'ListItems'
            },options);
            setPlgOptions(option);
            return this.each(function(){
                var o = getPlgOptions();
                var $this = $(this),
                data = $this.data('MLTokens');
                 InlineSelector = true;
                // Если плагин ещё не проинициализирован
                if ( ! data ) {
                    /*
                     * Тут выполняем инициализацию
                    */
                    o.DOMid = $this.attr('id');

                    if (typeof o.DOMid === 'undefined') {
                        o.DOMid = 'MLToken'+SelectorIndex;
                        SelectorIndex++;
                        $this.attr('id',o.DOMid);
                    }

                    let template = jQuery('#'+o.DOMid+' script[type="html/template"]').html();
                    jQuery('#'+o.DOMid).html(''); // Удаляем шаблон, за ненадобностью

                    if (typeof template ==='undefined'){
                        /*ДОбавляем шаблон по умолчанию*/
                        template = '<span class="{itemsclass}">Шаблон не указан!</span>';
                    }

                    jQuery(this).data('ItemTemplate',template);

                    init($this,o);
                    jQuery(this).data('MLTokens', {
                        target : $this,
                    });

                    jQuery(this).data('items',option.items);

                }else{
                    console.log('Plugin already init!');
                }


            });
        },
        additems: function (arg){
            if (typeof arg.items!=='undefined') {
                jQuery(this).data('items',arg.items);
            }
        },
        list : function (arg){
            if (typeof arg !== 'undefined') {
                if (typeof arg.items === 'undefined') {
                    return jQuery(this).data('items');
                } else {
                    jQuery(this).data('items', arg.items);
                }
            }else{
                let d = jQuery(this).data('items');
                return jQuery(this).data('items');
            }
        },

        setDate: function(arg){
            console.log('arg:');
            console.log(arg);

            if (typeof arg!=='undefined'){
                jQuery(this).find('#'+jQuery(this).attr('id')+'Autocomplete').attr('date',arg);
            }
        },
        updateitems : function(arg) {
            if (typeof arg !=='undefined') {
                if (typeof arg.items !== 'undefined') {

                    var aItems = [];
                    for(var idx in arg.items){
                        aItems.push(arg.items[idx]);
                    }

                    jQuery(this).data('items', aItems);
                    ReloadList(jQuery(this));
                } else {
                    ReloadList(jQuery(this));
                }
            }else{
                ReloadList(jQuery(this));
            }
        },
        disable: function(){
            jQuery(this).attr('disabled','disabled');
        },
        enable: function(){
            jQuery(this).removeAttr('disabled');
        },
        hideinput: function(){
            jQuery(this).find('#'+jQuery(this).attr('id')+'Autocomplete').addClass('DNone');
        },
        showinput: function(){
            jQuery(this).find('#'+jQuery(this).attr('id')+'Autocomplete').removeClass('DNone');
        }


    };

    jQuery.fn.MLTokens = function (method){
        if (methods[method]) {
            return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (typeof method === 'object' || !method) {
            return methods.init.apply(this, arguments);
        } else {
            if (arguments.length === 1) {
                jQuery.error('Укажите параметры для  диалога' + method + ' не существует для jQuery.fn.MLToken');
            } else {
                jQuery.error('Метод с именем ' + method + ' не существует для jQuery.fn.InlineSelector');
            }

        }

        return this;
    };

    function init(target,opt){
        "use strict";
        /*Добавляем автокомлете*/
        //jQuery(target).addClass('InlineSelector');
        jQuery(target).addClass('MLToken_Wrapper');
        jQuery(target).append('<span id="'+opt.DOMid+'List">');
        jQuery(target).find('#'+opt.DOMid+'List').addClass('MLTokenList');
        jQuery(target).find('#'+opt.DOMid+'List').append('<input type="text" id="'+opt.DOMid+'Autocomplete" id="'+opt.DOMid+'Autocomplete" autocomplete="off" role="textbox" aria-autocomplete="list" aria-haspopup="true">');

        let autocompleteObj =  jQuery(target).find('#'+opt.DOMid+'Autocomplete');

        //autocompleteObj.addClass('InlineSelectorAutocomplete');
        autocompleteObj.addClass('MLTokenInput');

        autocompleteObj.attr('placeholder',opt.placeholder);
        autocompleteObj.data('parent',target);
        autocompleteObj.data('backspace_was_pressed',0);

        jQuery(target).on('click',function(){
            var selector = jQuery('#'+jQuery(this).attr('id')+'Autocomplete');
            if (selector.prop('disabled')) {
                selector.focus();
                selector.autocomplete('search', '000');
            }
        });

        /*Нажание кнопок*/
        jQuery('#'+jQuery(target).attr('id')+'Autocomplete').on('keyup', function(e) {


            if (!e.ctrlKey && (e.which === 27)){
                /*Зактыть окно*/
                e.preventDefault();
            }

            if(!e.ctrlKey && (e.which === 13)) {
                e.preventDefault();
                return false;
            }
            if(!e.ctrlKey && (e.which === 8)&&(jQuery(this).val().length===0)) {

               e.preventDefault();
                let status = jQuery(this).data('backspace_was_pressed');
                if (status===1){
                    /*Удаляем последний в списке элемент*/
                    var items =  jQuery(jQuery(this).data('parent')).data('items');
                    var data = items.pop();
                    jQuery(jQuery(this).data('parent')).data('items',items);
                    if(data !== undefined){
                        opt.event_remove_item(jQuery(jQuery(this).data('parent')).attr('keyid'),data.id);
                    }
                    ReloadList(jQuery(this).data('parent'));
                    jQuery(this).data('backspace_was_pressed',0);

                }else{
                    /*Выставляем статус в 1 и ждем следующего нажатия, а пока выделим элемент*/
                    jQuery(this).data('backspace_was_pressed',1);
                }
               return false;
            }else{
                jQuery(this).data('backspace_was_pressed',0);
            }
        });

        /*Удаление элемента из списка*/
        jQuery(target).on('click','.'+opt.RemoveBtnClass,function(){
            var items = jQuery(target).data('items');
            var newitems = [];
            for(var idx in items){

              if (Number(items[idx].id)!==Number(jQuery(this).attr('itemid')) && String(items[idx].id)!==String(jQuery(this).attr('itemid'))){
                  newitems.push(items[idx]);
                }
            }
            jQuery(target).data('items',newitems);
            // Ищем ближайшего предка с itemsclass
            jQuery(this).closest('.'+opt.itemsclass).hide(300);
            opt.event_remove_item(jQuery(target).attr('keyid'),jQuery(this).attr('itemid'));
            ReloadList(target);
            return false;
        });

        InitAutocomplete(autocompleteObj,target,'/ajax.php?m='+opt.plugin+'&object=1&script='+opt.getListMethod+'&force=1',function(data,parent){
            /*Добавляем id в массив для каждого селектора отдельно*/

            let items = jQuery.makeArray(jQuery(parent).data('items'));
            var noFound = 1;
            /*Проверка на налицее элемента в массиве*/
            for(var idx in items){
                if (Number(items[idx].id)===Number(data.id) || String(items[idx].id)===String(data.id)){
                    noFound = 0;
                    break;
                }
            }

            if (noFound){
                items.push(data);
                jQuery(parent).data('items',items);
                /*todo:Действия при выборе элемента*/
                opt.event_add_item(jQuery(parent).attr('keyid'),data); // keyid - не обязательное поле, для идентификации обьектов к которым добавлен InlineSelector
                /*Обновить список*/
                ReloadList(parent);
            }

            autocompleteObj.val('');
        });

        jQuery(autocompleteObj).on('click',function () {

            jQuery(this).autocomplete("search", jQuery(autocompleteObj).val()?jQuery(autocompleteObj).val():'000');

            return false;
        });

    }

    function InsertItem(parent,data){
        var o = getPlgOptions();
        let parentid = jQuery(parent).attr('id');
        jQuery('#'+parentid+'Autocomplete').before(data);
        o.event_draw_item(data);
    }

    function ReloadList(parent){
        var o = getPlgOptions();
        let items = jQuery(parent).data('items');
        /*Очищаем список*/
        jQuery('#'+jQuery(parent).attr('id')+' .'+o.itemsclass).remove();
        items = o.event_before_reload(jQuery(parent).attr('keyid'),items);
        /*Выводим список*/
        for(var index in items){
            items[index].itemsclass = o.itemsclass;
            if (items[index].id>0 || items[index].id != '') {
                if(jQuery(parent).data('ItemTemplate') !== null){
                    InsertItem(parent, TemplateParse(jQuery(parent).data('ItemTemplate'), items[index]));
                }
            }
        }
    }

    function setPlgOptions(opt){
        plgOptions = opt;
    }
    function getPlgOptions(){
        return plgOptions;
    }

})(jQuery);


/**
 * ПЛАГИН mAlert
 */
(function( $ ) {
    "use strict";
    var AlertOptions = [];
    var methods = {
        'init': function (options) {
            var options = jQuery.extend({
                text: '',
                type: 1, /* 1 - info, 2 - danger */
                title: '',
                class:'',
                width: '',
                height:'',
                content_class:'',
                content_div:0,
                nobutton: 0,
                draggable:0,
                modal: false,
                btnCaption:'Ok <svg><use xlink:href="/img/ico_ML_16x16_Map.svg#Confirm_Min"></use></svg>',
                btnClass:'AllBotton',
                dialog_id:'MingliCurrentAlert',
                action: function (e) {
                },
                action_after_create_window:function(){

                }
            }, options);


            setPlgOptions(options);

            var id = Math.floor(Math.random() * (10000000 - 1)) + 1;
            var dId = options.dialog_id;// + id;
            jQuery('#' + dId + '_bg').remove();
            jQuery('body').append('<div id="' + dId + '_bg" class="BG_General">');

            jQuery('#' + dId + '_bg').append('<fieldset id="' + dId + '" class="ML_Window '+options.class+'" >');

            if (options.width!==''){
                 jQuery('#'+dId).css('width',options.width);
            }
            if (options.height!==''){
                jQuery('#'+dId).css('height',options.height);
            }
            if (options.title !== '') { // Есть алерт, значит это окно
                jQuery('#' + dId).append('<div id="' + dId + '_title_area" class="Legend ui-draggable-handle"></div>');
                jQuery('#' + dId+'_title_area').append('<div id="' + dId + '_title" class="Title"></div>');
                jQuery('#' + dId + '_title').html(options.title);
                jQuery('#' + dId+'_title_area').append('<div id="' + dId + '_CloseWin" class="Close CloseAlertWin" title="' + TITLE_CLOSEWINDOW + '"><svg><use xlink:href="/img/ico_ML_16x16_Map.svg#Close"></use></svg></div>');
                jQuery('#' + dId + '_CloseWin').click(function () {
                    jQuery('#' + dId + '_bg').fadeOut().remove();
                    options.action({action:'close'});
                });

                jQuery('#' + dId).append('<div id="'+dId+'_content">'+options.text+'</div>');



            }else{
                jQuery('#' + dId + '').append('<div class="AlertBody">');
                jQuery('#' + dId + '>div.AlertBody').append('<div id="' + dId + '_content">');
                jQuery('#' + dId + '_content').html(options.text);
            }

            options.action_after_create_window(options);

            if (options.draggable===1) {
                jQuery('#' + dId).draggable();
            }

            //class="positive"

            if (!options.nobutton) {
                jQuery('#' + dId + '').append('<div class="FFooter">');
                jQuery('#' + dId + '>div.FFooter').append(' <div class="ActionBar JC_FE">');
                jQuery('#' + dId + '>div.FFooter>div.ActionBar').append('<button id="' + dId + '_btn" class="'+options.btnClass+'" type="button" style="width: 7em;">');

                jQuery('#' + dId + '_btn').html(options.btnCaption);
                jQuery('#' + dId + '_btn').click(function () {
                    options.action({action:'button','window_id':options.dialog_id});
                    jQuery('#' + dId + '_bg').fadeOut().remove();
                    return false;
                });
            }
        },
        'hide': function () {
            var o = getPlgOptions();
            var dId = o.dialog_id;
            jQuery('#' + dId + '_bg').fadeOut().remove();
        }
    };

    jQuery.mAlert = function (method) {
        if (methods[method]) {
            return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (typeof method === 'object' || !method) {
            return methods.init.apply(this, arguments);
        } else {
            if (arguments.length === 1) {
                arguments[0] = {'text': method};
                return methods.init.apply(this, arguments);
            } else {
                $.error('Метод с именем ' + method + ' не существует для jQuery.mAlert');
            }
        }
        return this;
    };

    function setPlgOptions(opt){
        AlertOptions = opt;
    }
    function getPlgOptions(){
        return AlertOptions;
    }

})(jQuery);


jQuery('.CloseAlertWin').click(function(){
    jQuery.mAlert('hide');
    $('.BG_General').addClass('DNone');
    $('body').removeClass('OFlH');
    return false;
});

/**
 * ПЛАГИН mConfirm
 */
(function( $ ) {
    jQuery.mConfirm = function (text, opt) {
        var options = jQuery.extend({
            'type': 1, /* 1 - info, 2 - danger */
            'title': '',
            'class': '',
            'modal': false,
            'buttons': {

                'cancel': {
                    'text': '<svg><use xlink:href="/img/ico_ML_16x16_Map.svg#Cancel"></use></svg>' + CANCEL,
                    'class': 'AllBottonLight',
                    'action': function () {
                    }
                },
                'ok': {
                    'text': 'Ok <svg><use xlink:href="/img/ico_ML_16x16_Map.svg#Confirm_Min"></use></svg>',
                    'class': 'AllBotton',
                    'action': function () {
                    }
                }

            }
        }, opt);


        var id = Math.floor(Math.random() * (10000000 - 1)) + 1;
        var dId = 'Confirm';//+id;
        jQuery('#' + dId + '_bg').remove();
        jQuery('body').append('<div id="' + dId + '_bg" class="BG_General">');
        if(typeof device === 'object'){
            if(device.mobile() && device.portrait()){
                if(!jQuery('body').hasClass('OFlH')){
                    jQuery('body').addClass('OFlH');
                }
            }
        }

        jQuery('#' + dId + '_bg').append('<fieldset id="' + dId + '_field" class="Alert ML_Window '+options.class+'">');

        if (options.title !== '') {
            jQuery('#' + dId +'_field').append('<h2 id="' + dId + '_title">');
            jQuery('#' + dId + '_title').html(options.title);
        }

        jQuery('#' + dId + '_field').append('<section class="ML_Table">');
        jQuery('#' + dId + '_field>section.ML_Table').append('<div class="FBody">');
        jQuery('#' + dId + '_field>section.ML_Table>div.FBody').append('<p id="' + dId + '_content">');
        jQuery('#' + dId + '_content').html(text);

        jQuery('#' + dId + '_field>section.ML_Table').append('<div class="FFooter">');

        jQuery('#' + dId + '_field>section.ML_Table>div.FFooter').append(' <div class="ActionBar JC_FE">');
        for (var btn_key in options.buttons) {

            var button = options.buttons[btn_key];
            jQuery('#' + dId + '_field>section.ML_Table>div.FFooter>div.ActionBar').append('<button id="' + dId + '_btn_' + btn_key + '" class="' + button.class + '" type="button" >');
            jQuery('#' + dId + '_btn_' + btn_key).html(button.text);
            jQuery('#' + dId + '_btn_' + btn_key).attr('code', btn_key);

            jQuery('#' + dId + '_btn_' + btn_key).click(function (btn) {
                    return function () {
                        $('body').removeClass('OFlH');
                        jQuery('#' + dId + '_bg').fadeOut().remove();
                        options.buttons[btn].action();
                    }
                }(btn_key)
            );

        }
        return this;
    };
})(jQuery);

jQuery.fn.InputValidator = function(checkInputs){
    // Ищем все подчиненные инпуты
    "use strict";
    var inputs = this.find('input');
    var isError = true;
    //var checkInputs = options.inputs;
    inputs.each(function(){
        //console.log(this.name);
        if (checkInputs.includes(this.name)){
            //console.log(this.name);
            // Элемент найден в массиве обязательных параметров
            if (this.value===''){
                isError = false;
                return false;
            }
        }
    });
    return isError;
};

/**
 * получаем временную метку в формате UnixTimeStamp
 *
 *
 */

Date.prototype.getUnixTimestamp = function() {

    return Math.round(this.getTime() / 1000);

};


/**
 * Проверка данных города в форме на корректность, вывод окна с выбором похожего города
 * @param options
 * @constructor
 */
function CityFormValidator(options){
    "use strict";
    options = jQuery.extend({
        html:'<div id="mAlertCityError"><div class="Text">' + CHOOSE_PLACE_AGAIN + ':</div><section id="mAlertCityList"><div class="Loader"><div class="loader3Circle"></div>'+ WE_ARE_LOOKING_FOR +'</div></section></div>', // Текст окна Должен содержать DOM mAlertCityList
        noCityHtml:'<div class="Attent">' + CITY_NAME_NOT_SPECIFIED + '</div>', // Строка вывода при не указанном названии города
        title: DATE_REFINEMENT, // Заголовок окна
        Parent:'#AutoINIBirth', // Элемент содержащий форму с полями города
        CityNameSelector:'#city', // Элемент с названием города
        InputsIdArray:['city','cityId','google_id','lat','lng','tz','uauto','utc'],
        action: function(){}, //  Событие при положительной проверке
        ChangeUtc: function(){} // Пересчен значения UTC при выборе города
    }, options);

    if (jQuery(options.Parent).InputValidator(options.InputsIdArray)){
        options.action();
    }else{
        // Вывести предупреждение и добавить список выбора
        var html = options.html;
        var city = jQuery(options.Parent+' '+options.CityNameSelector).val();
        /*Получаем все данные города*/
        var citydata = {
            'city': city,
            'cityid':jQuery(options.Parent+' #cityId').val(),
            'google_id':jQuery(options.Parent+' #google_id').val(),
            'geonameid':jQuery(options.Parent+' #geonameid').val(),
            'countrycode':jQuery(options.Parent+' #countrycode').val(),
            'tz':jQuery(options.Parent+' #tz').val(),
            'utc':jQuery(options.Parent+' #utc').val(),
            'lat':jQuery(options.Parent+' #lat').val(),
            'lng':jQuery(options.Parent+' #lng').val(),
        };
        /*Проверяем на наличее данных города*/

        var isCity = false;

        if (city===''){ // Проверка на имя
            if (citydata.cityid<=0){ // провера id города
                if (parseInt(citydata.lat)===0 || parseInt(citydata.lng)===0){ // Провверка наличия координат
                    isCity = true;
                }else{
                }
            }else{
                isCity = true;
            }
        }else{
            isCity = true;
        }


        if (isCity){
            jQuery.mAlert({'title':options.title,'text':html,'nobutton':1,'draggable':1});
            var QueryResult = {};
            /*Делаем запрос к серверу с именеи города*/
            AjaxJsonCall2('geomgr','FindСities',{q:city,city:citydata},function(result){
                jQuery('#mAlertCityList').html('');
                jQuery('#mAlertCityList').append('<ul id="mAlertCityListUL"></ul>');

                if (result.count===1){
                    //let cityid = citydata.cityid;
                    var city = result.items[0].data;
                    jQuery(options.Parent + ' #city').val(city.name);
                    jQuery(options.Parent + ' #tz').val(city.tz);
                    jQuery(options.Parent + ' #countycode').val(city.countycode);
                    jQuery(options.Parent + ' #geonameid').val(city.geonameid);
                    jQuery(options.Parent + ' #google_id').val(city.google_id);
                    jQuery(options.Parent + ' #cityId').val(city.cityid);
                    jQuery(options.Parent + ' #lat').val(city.lat);
                    jQuery(options.Parent + ' #lng').val(city.lng);
                    jQuery(options.Parent + ' #uauto').val(city.uauto);
                    jQuery(options.Parent + ' #utc').val(city.utc);
                    options.ChangeUtc();
                    options.action();
                    jQuery.mAlert('hide');
                }
                if (result.count>1) {
                    for (var key in result.items) {
                        if (result.items.hasOwnProperty(key)) {
                            /*Формируем список*/
                            QueryResult[result.items[key].data.cityid] = result.items[key].data;
                            jQuery('#mAlertCityListUL').append('<li class="SelectCity" cityid="'+result.items[key].data.cityid+'"><div class="CityBlock"><span class="CityName">'+result.items[key].data.name+'</span><span class="CityUTC">('+result.items[key].data.addInfo+')</span></div><div class="CityRegion">'+result.items[key].data.country+result.items[key].data.regionname+'</div></li>');
                        }

                    }
                    // Добавляем событие на выбор города
                    jQuery('.SelectCity').on('click', function () {
                        let cityid = jQuery(this).attr('cityid');
                        var city = QueryResult[cityid];
                        jQuery(options.Parent + ' #city').val(city.name);
                        jQuery(options.Parent + ' #tz').val(city.tz);
                        jQuery(options.Parent + ' #countycode').val(city.countycode);
                        jQuery(options.Parent + ' #geonameid').val(city.geonameid);
                        jQuery(options.Parent + ' #google_id').val(city.google_id);
                        jQuery(options.Parent + ' #cityId').val(city.city_id);
                        jQuery(options.Parent + ' #lat').val(city.lat);
                        jQuery(options.Parent + ' #lng').val(city.lng);
                        jQuery(options.Parent + ' #uauto').val(city.uauto);
                        jQuery(options.Parent + ' #utc').val(city.utc);
                        options.ChangeUtc();
                        options.action();
                        jQuery.mAlert('hide');
                    });
                }

            });
        }else{
            //Внимание: Город не указан. Возможен неверный расчет!
            var text = '<div id="mAlertCityError"><div class="Text">' + ALERT_NO_CITY + '</div></div>';
            var text_cancel = '<svg><use xlink:href="/img/ico_ML_16x16_Map.svg#Cancel"></use></svg> <span class="text">Отмена</span> ';
            var text_ok = '<svg class="positive"><use xlink:href="/img/ico_ML_16x16_Map.svg#Confirm_Min"></use></svg> <span class="text">Рассчитать</span> ';
            jQuery.mConfirm(text, {/*'title':options.title,'nobutton':1,'draggable':1,*/
                'buttons':{
                    'cancel': {
                        'text': text_cancel,
                        'class': 'AllBottonLight',
                        'action': function () {
                        }
                    },
                    'ok': {
                        'text': text_ok,
                        'class': 'AllBottonLight',
                        'action': function () {
                            $('#setLocalTime').click();
                            //document.location = '/bazi/' + GetShort();
                            options.action();
                        },
                    }
                }

            });
            //jQuery('#mAlertCityList').html(options.noCityHtml);
        }


    }
}



//************** DARKMAN ***************

/*показ и гашение блока*/
jQuery.fn.BlockToggle = function(options){
    var class_name = this.attr('name');

    options = jQuery.extend( {
		'type':this.attr('type'),
        'class':'DNone',
        'ShowAction':function(){},
        'HideAction':function(){}
    }, options);

	/*Гасим выбранный блок*/
    jQuery('#'+class_name+'_block').addClass(options.class);


    switch (options.type) {
        case 'checkbox':
            jQuery('#' + class_name).click(function () {
                if (jQuery(this).prop('checked')) {
					/*Показываем блок*/
                    jQuery('#' + class_name + '_block').removeClass(options.class);
                    options.ShowAction();
                } else {
					/*Гасим блок*/
                    jQuery('#' + class_name + '_block').addClass(options.class);
                    options.HideAction();
                }
            });
            break;
        case 'radio':
            jQuery("input[name='"+class_name+"']").change(function () {
                if (jQuery('#'+class_name).prop('checked')) { // проверяем конкретный элемент
					/*Показываем блок*/
                    jQuery('#' + class_name + '_block').removeClass(options.class);
                    options.ShowAction();
                } else {
					/*Гасим блок*/
                    jQuery('#' + class_name + '_block').addClass(options.class);
                    options.HideAction();
                }
            });
            break;
    }
};




// ######################################################################

function Redirect(url){
	document.location = url;
}


function AjaxFormTextCall2(formSelector,plugin,action,param,callback){
	var form = jQuery(formSelector).serializeArray();
	AjaxTextCall2(plugin,action,form,callback);
}

function AjaxTextCall(plugin,action,param,callback){

	jQuery.ajax({
		   type: "POST",
		   url: "/ajax.php?m="+plugin+"&script="+action,
		   data: {
			param:param
		   },
		   dataType:"text",
		   success: function(data){
			   if (typeof(callback)==='function'){callback(data);}
		   },
		   error:function(e,result){
			   console.log('plugin:'+plugin+' action:'+action+'\n'+result.responseText);
			}
		 });
}


function AjaxJsonCall(plugin,action,param,callback){
	jQuery.ajax({
		   type: "POST",
		   url: "/ajax.php?m="+plugin+"&script="+action,
		   data: {
			param:param
		   },

		   dataType:"json",
		   success: function(data){

			   if (typeof(callback)==='function'){callback(data);}
		   },
		   error:function(result,e){
			   console.log('plugin:'+plugin+' action:'+action+'\n'+result.responseText);
			}
		 });
}

function AjaxTextCall2(plugin,action,param,callback){
    jQuery.ajax({
		type: "POST",
		url: "/ajax.php?m="+plugin+"&script="+action+'&object=1',
		data: param,
		dataType:"text",
        method:'POST',
		success: function(data){
			if (typeof(callback)==='function'){callback(data);}
		},
		error:function(result,e){
			console.log('plugin:'+plugin+' action:'+action+'\n'+result.responseText);
		}
	});
}


function AjaxJsonCall2(plugin,action,param,callback,errorCallback){

	jQuery.ajax({
		type: "POST",
		url: "/ajax.php?m="+plugin+"&script="+action+'&object=1',
		data: param,
		dataType:"json",
        method:'POST',
        success: function(data){
			if (typeof(callback)==='function'){callback(data);}
		},
		error:function(result,e){
            console.log('param:');
            console.log(param);
			console.log('plugin:'+plugin+' action:'+action+'\n'+result.responseText);
            if (typeof(errorCallback)==='function'){errorCallback(e);}
		}
	});
}

//передача данных в виде строки вместо объекта
function AjaxJsonStringCall(plugin,action,param,callback,errorCallback){
	jQuery.ajax({
		type: "POST",
		url: "/ajax.php?m="+plugin+"&script="+action+'&object=1',
		data: JSON.stringify(param), 
		contentType: 'application/json',     
		dataType: "json",
		success: function(data){
			if (typeof(callback)==='function'){callback(data);}
		},
		error: function(result, e){
			console.log('param:');
			console.log(param);
			console.log('plugin:'+plugin+' action:'+action+'\n'+result.responseText);
			if (typeof(errorCallback)==='function'){errorCallback(e);}
		}
	});
}

/*Асинхронный метод отправки Ajax Запроса на сервер*/
function AjaxJsonFetchCall(plugin, action, param, callback, errorCallback) {
    const url = `/ajax.php?m=${plugin}&script=${action}&object=1`;

    // Определяем тип данных для отправки
    let bodyData;
    let contentType;

    if (param instanceof FormData) {
        bodyData = param;
        // FormData сам устанавливает правильный Content-Type с boundary
    } else if (typeof param === 'object') {
        bodyData = JSON.stringify(param);
        contentType = 'application/json';
    } else {
        bodyData = new URLSearchParams(param);
        contentType = 'application/x-www-form-urlencoded';
    }

    const options = {
        method: 'POST',
        body: bodyData
    };

    if (contentType && !(param instanceof FormData)) {
        options.headers = {
            'Content-Type': contentType
        };
    }

    return fetch(url, options)
        .then(response => {
            if (!response.ok) {
                return response.text().then(text => {
                    throw new Error(`HTTP ${response.status}: ${text}`);
                });
            }
            return response.json();
        })
        .then(data => {
            if (typeof callback === 'function') {
                callback(data);
            }
            return data;
        })
        .catch(error => {
            console.log('param:', param);
            console.log(`plugin:${plugin} action:${action}\n${error.message}`);

            if (typeof errorCallback === 'function') {
                errorCallback(error);
            }

            throw error;
        });
}


function AjaxJsonCall3(plugin, action, param, callback, errorCallback) {
    jQuery.ajax({
        type: "POST",
        url: `/ajax.php?m=${plugin}&script=${action}&object=1`,
        data: param,
		headers: {
			'Content-Type': 'application/json'
		},
        dataType: "json",
        success: function(data) {
            if (typeof(callback) === 'function') {
                callback(data);
            }
        },
        error: function(result, e) {
            console.log('param:');
            console.log(param);
            console.log(`plugin:${plugin}, action:${action}\n${result.responseText}`);
            if (typeof(errorCallback) === 'function') {
                errorCallback(e);
            }
        }
    });
}

function AjaxJsonCallAsync(plugin,action,param,callback){
	jQuery.ajax({
		type: "POST",
		url: "/ajax.php?m="+plugin+"&script="+action+'&object=1',
		data: param,
		dataType:"json",
		async: false,
        method:'POST',
        success: function(data){
			if (typeof(callback)==='function'){callback(data);}
		},
		error:function(result,e){
			console.log('plugin:'+plugin+' action:'+action+'\n'+result.responseText);
		}
	});
}


function Form2Array(serializeData){
    'use strict';
	var result = {};
	jQuery.each(serializeData,function(index,value){
		result[value.name] = value.value;
	});
	return result;
}

function LoadFormValueFunc(param){
    AjaxJsonCall2(param['plugin'],param['action'],param['data'],function(result){
		/*заполняем форму*/
        jQuery.each(result,function(index,value){
			/*пробегаем по */
            jQuery.each(value,function(key,item){
                switch (index){
                    case 'select':
                        jQuery('#'+param['form']+' #'+key+' option[value="'+item+'"]').prop('selected',true);
                        break;
                    case 'check':
                        if (item==1){
                            jQuery('#'+param['form']+' #'+key).prop('checked',true);
                        }else{
                            jQuery('#'+param['form']+' #'+key).prop('checked',false);
                        }
                        break;
                }
            });
        });
        return false;
    });
}

function ChangeTagName(el, newTagName) {
    var n = document.createElement(newTagName);
    var attr = el.attributes;
    for (var i = 0, len = attr.length; i < len; ++i) {
        n.setAttribute(attr[i].name, attr[i].value);
    }
    n.innerHTML = el.innerHTML;
    el.parentNode.replaceChild(n, el);
}

function readTextFile(file, callback) {
    var rawFile = new XMLHttpRequest();
    rawFile.overrideMimeType("application/json");
    rawFile.open("GET", file, true);
    rawFile.onreadystatechange = function() {
        if (rawFile.readyState === 4 && rawFile.status == "200") {
            callback(rawFile.responseText);
        }
    }
    rawFile.send(null);
}

function sortPriceTable(tableClass){
    var $elements = tableClass.find('tbody tr');
    var $target = tableClass.find('tbody');

    $elements.sort(function(a,b){
        if($(a).find('td').last().find('input').val() == ''){
            return -1;
        }
        if($(b).find('td').last().find('input').val() == ''){
            return 1;
        }

        let adate = $(a).find('td').last().find('input').val().split('.');
        let bdate = $(b).find('td').last().find('input').val().split('.');

        let aa = new Date(adate[2], adate[1] - 1, adate[0]).getTime();
        let bb = new Date(bdate[2], bdate[1] - 1, bdate[0]).getTime();

        if (aa > bb){
            return 1;
        } // если первое значение больше второго
        if (aa == bb) {
            return 0;
        } // если равны
        if (aa < bb) {
            return -1;
        }// если первое значение меньше второго
    });
    $elements.detach().appendTo($target);

    tableClass.find('.active').removeClass('active');
    let i = 0;
    let tabBasket = tableClass.find('tbody tr');
    if(tabBasket.length > 1){
        while ( i < tabBasket.length){
            if( tabBasket.eq(i).find('td').last().find('input').val() !== '' ){
                let date = tabBasket.eq(i).find('td').last().find('input').val().split('.');
                if(new Date().getTime() > new Date(date[2], date[1] - 1, date[0]).getTime()){
                    tableClass.find('.active').removeClass('active');
                    tabBasket.eq(i).addClass('active');
                } else{
                    break;
                }
            }
            i++;
        }
        if( tableClass.find('.active').length === 0 ){
            let el = tableClass.find('tbody tr input[value=""]').closest('tr');
            if( el.length !== 0 ){
                el.eq(0).addClass('active')
            }
        }
    } else{
        tabBasket.eq(0).addClass('active');
    }
}

function _formatDate(date, text = false) {
    if (date > 0) {
        var cDate = new Date(date * 1000);
        let day = cDate.getDate();
        let month = cDate.getMonth() + 1;
        let year = cDate.getFullYear();
        if (text) {
            return numeral(day).format('00') + ' ' + _lang['TXT_MONTH_' + month] + ' ' + year;
        } else {
            return numeral(day).format('00') + '.' + numeral(month).format('00') + '.' + year;
        }
    } else {
        return '';
    }
}

function getOffsetSum(elem) {
    var top=0, left=0;
    while(elem) {
        top = top + parseFloat(elem.offsetTop);
        left = left + parseFloat(elem.offsetLeft);
        elem = elem.offsetParent;
    }

    return {top: Math.round(top), left: Math.round(left)}
}

function getOffsetRect(elem) {
    // (1)
    var box = elem.getBoundingClientRect()

    // (2)
    var body = document.body
    var docElem = document.documentElement

    // (3)
    var scrollTop = window.pageYOffset || docElem.scrollTop || body.scrollTop
    var scrollLeft = window.pageXOffset || docElem.scrollLeft || body.scrollLeft

    // (4)
    var clientTop = docElem.clientTop || body.clientTop || 0
    var clientLeft = docElem.clientLeft || body.clientLeft || 0

    // (5)
    var top  = box.top +  scrollTop - clientTop
    var left = box.left + scrollLeft - clientLeft

    return { top: Math.round(top), left: Math.round(left) }
}


function getOffset(elem) {
    if (elem.getBoundingClientRect) {
        // "правильный" вариант
        return getOffsetRect(elem)
    } else {
        // пусть работает хоть как-то
        return getOffsetSum(elem)
    }
}

function getCoords(elem) {
    if (typeof elem!=='undefined') {
        let box = elem.getBoundingClientRect();

        return {
            top: box.top + window.pageYOffset,
            right: box.right + window.pageXOffset,
            bottom: box.bottom + window.pageYOffset,
            left: box.left + window.pageXOffset
        };
    }else{
        return {
            top: window.pageYOffset,
            right: window.pageXOffset,
            bottom:window.pageYOffset,
            left: window.pageXOffset
        };
    }
}

function FontFlagsEncoding(code){
    var tmp='';
    if(code === undefined){
        return tmp;
    }
    code = code.toUpperCase();
    let base = 127397;
    _.forEach(code.split(""),(char)=>{
        tmp = tmp + "&#"+(127397+(char.charCodeAt(0)))+";"
    });
    return tmp;
}

function lastDayOfMonth(year,month){
    return (32 - new Date(year, month, 32).getDate());
}

function formatDateValue(date, text = false,long= false) {

    if (date > 0) {
        var cDate = new Date(date * 1000);
        let day = cDate.getDate();
        let month = cDate.getMonth() + 1;
        let year = cDate.getFullYear();
        if (text) {
            if (long) {
                return numeral(day).format('00') + ' ' + _lang['TXT_MONTH_' + month] + ' ' + year;
            } else {
                return numeral(day).format('00') + ' ' + _lang['TXT_SHORT_MONTH_' + month] + ' ' + year;
            }
        } else {
            return numeral(day).format('00') + '.' + numeral(month).format('00') + '.' + year;
        }
    } else {
        return '';
    }
}

function formatDateTimeValue(date, text = false,long= false){

    if (date > 0) {
        var cDate = new Date(date * 1000);
        let day = cDate.getDate();
        let month = cDate.getMonth() + 1;
        let year = cDate.getFullYear();
        let time = numeral(cDate.getHours()).format('00')+':'+numeral(cDate.getMinutes()).format('00');
        if (text) {
            if (long) {
                return numeral(day).format('00') + ' ' + _lang['TXT_MONTH_' + month] + ' ' + year+ ' '+time;
            }else {
                return numeral(day).format('00') + ' ' + _lang['TXT_SHORT_MONTH_' + month] + ' ' + year+ ' '+time;
            }
        } else {
            return numeral(day).format('00') + '.' + numeral(month).format('00') + '.' + year+' '+time;
        }
    } else {
        return '';
    }
}

function hightlight(str,sub){
    var exp = new RegExp("("+sub+")","i");
    return str.replace(exp,'<mark>$1</mark>');
}

function CopyToClipboard(text,callback) {

    if (typeof navigator.clipboard!=='undefined') {
        navigator.clipboard.writeText(text)
            .then(() => {
                if (typeof callback==='function') callback(text);
            })
            .catch((error) => {
                console.error(`Could not copy text: ${error}`);
            });
    }else{
        var TempText = document.createElement("input");
        TempText.value = text;
        document.body.appendChild(TempText);
        TempText.select();
        document.execCommand("copy");
        document.body.removeChild(TempText);
        if (typeof callback==='function') callback(text);
    }
}

function loadjscssfile(filename, filetype){
    if (filetype=="js"){ //if filename is a external JavaScript file
        var fileref=document.createElement('script')
        fileref.setAttribute("type","text/javascript")
        fileref.setAttribute("src", filename)
    }
    else if (filetype=="css"){ //if filename is an external CSS file
        var fileref=document.createElement("link")
        fileref.setAttribute("rel", "stylesheet")
        fileref.setAttribute("type", "text/css")
        fileref.setAttribute("href", filename)
    }
    if (typeof fileref!="undefined")
        document.getElementsByTagName("head")[0].appendChild(fileref)
}

function changeTimezone(date, ianatz) {
    // suppose the date is 12:00 UTC
    var invdate = new Date(date.toLocaleString('en-US', {
        timeZone: ianatz
    }));
    // then invdate will be 07:00 in Toronto
    // and the diff is 5 hours
    var diff = date.getTime() - invdate.getTime();
    // so 12:00 in Toronto is 17:00 UTC
    return new Date(date.getTime() - diff); // needs to substract
}