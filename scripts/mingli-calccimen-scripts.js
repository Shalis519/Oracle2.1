function StructClick(id){
	alert(id);
}



// function LoadDefaultSettings(callback){
//     if (typeof(callback)=='function'){callback(data);}else{
//         jQuery('#QMDJRotate option[value=0]').prop('selected',true);
//         jQuery('#QMDJRotate option[value=0]').change();
//         jQuery('#calc_type option[value=1]').prop('selected',true);
//         jQuery('#calc_type option[value=1]').change();
//         jQuery('#ctype option[value=1]').prop('selected',true);
//         jQuery('#ctype option[value=1]').change();
//         jQuery('#ghost_mode option[value=1]').prop('selected',true);
//         jQuery('#ghost_mode option[value=1]').change();
//         jQuery('#ghost_by option[value=1]').prop('selected',true);
//         jQuery('#ghost_by option[value=1]').change();
//         jQuery('#ghost_view_mode').prop('checked',false);
//         jQuery('#ghost_view_mode').change();
//         //jQuery('#empty option[value=0]').prop('selected',true);
//         jQuery('#view option[value="utf8"]').prop('selected',true);
// 		jQuery('#deal_D option[value=1]').prop('selected',true);
// 		jQuery('#deal_M option[value=1]').prop('selected',true);
// 		jQuery('#deal_Y option[value=1]').prop('selected',true);
// 	}
// 	return false;
// }

// function LoadSettings(callback){
// 	//AjaxJsonCall('calccimen','LoadSettings',null,callback);
// 	AjaxJsonCall2('calccimen','LoadSettings',null,function(){
// 		/*восстанавливаем настройки*/
//
// 	});
// }


//
// function Form2Session(param,value){
// 	var params = new Array();
// 	params[0] = param;
// 	params[1] = value;
// 	AjaxTextCall('calccimen','form2session',params,null);
// }

/* Функция выделения колонки на основе текущего периода */

function SelectCurentPer()
	{

		//Убираем выделения с колонок
		jQuery("#BZDayMap th, #BZDayMap td").removeClass("SelB");

		/* Получаем номер колонки на основе выбранного периода #period */
		var tColSelect = jQuery("#BZDayMap thead th[PeriodVal='"+ jQuery("#period option:selected").val() +"']").index();
		/*Принудительно изменяе, состояние селектора периодов*/
		//MenuApp.period = jQuery("#period option:selected").val();

		/* Выделяем колонку */
		jQuery("#BZDayMap tr").each(function(){$(this).find("th,td").eq(tColSelect).addClass("SelB")});


		/*Сохранять период в сессии!!!! ajax ом*/

	}
/* Конец выделения колонки на основе текущего периода */
/* Вешаем событие онченьж на выбор периода */

// jQuery('#period').change(function(){
// 		console.log('period change!');
// 	if (jQuery('#CalcType').val()==1){
//         return false;
// 	}else{
//         SelectCurentPer();
//         jQuery("#showCart").click();
// 	}
//
// 	});

jQuery('#deal').change(function(){
    if (jQuery('#CalcType').val()==1){
        return false;
    }else{
        SelectCurentPer();
        jQuery("#showCart").click();
    }
	});

/*Сохраняем данные о виде карты в сессию и обновляем вид*/
// jQuery('#view').change(function(){
// 	jQuery("#showCart").click();}
// );

/* Функция удаления диалоговых окон дворцов */

function RemoveDialogCastle()
	{
		var RemoveDialog=jQuery("[QMDJDialogContent]");
		if ( RemoveDialog.length>0 )
			{
			for (i=0; i<RemoveDialog.length; i++)
				{
				if ( jQuery("div").is("[aria-describedby="+$(RemoveDialog[i]).attr("id")+"Window]") )
					{
                        jQuery( "#"+$(RemoveDialog[i]).attr("id")+"Window" ).dialog( "destroy" );
                        jQuery( "#"+$(RemoveDialog[i]).attr("id")+"Window" ).remove();
					}

				}
			}
	}


	jQuery('#SaveToDlg').dialog({
		autoOpen: false,
	      show: {
	        effect: "blind",
	        duration: 1000
	      },
	      hide: {
	        effect: "explode",
	        duration: 1000
	      },
	      buttons: {
	          "Сохранить": function() {

	        	  var param = new Array();
	        	  param[0]=jQuery('cardname').val();

	        	  AjaxJsonCall('calccimen','savecard',param,function(){
                      jQuery( this ).dialog( "close" );
	        	  });
	              return false;
	          },
	          "Отмена": function() {
                  jQuery( this ).dialog( "close" );
	          }
	        }

	});



	jQuery('#savePDF').click(function(){

		/* Проверяем валидность формы, если да, то сохраняем */
		if ( jQuery('#Date_BOX').isValid() )
		{

			/* Показываем лоадер */
			jQuery("#loading").removeClass("DNone");

			/* Удаляем все открытые диалоговые окна для дворцов */
			RemoveDialogCastle();

			var RemoveDialog=jQuery("[QMDJDialogContent]");
			if ( RemoveDialog.length>0 )
			{
				for (i=0; i<RemoveDialog.length; i++)
				{
					if ( jQuery("div").is("[aria-describedby="+$(RemoveDialog[i]).attr("id")+"Window]") )
					{
						$( "#"+$(RemoveDialog[i]).attr("id")+"Window" ).dialog( "destroy" );
						$( "#"+$(RemoveDialog[i]).attr("id")+"Window" ).remove();
					}

				}
			}

			/*Передаем параметры в скрипт*/

			var param = new Array();
			param[0] = jQuery('#day').val()+';'+jQuery('#month').val()+';'+jQuery('#year').val()+';'+jQuery('#thur').val()+';'+jQuery('#tmin').val();
			param[1] = jQuery('#lat').val()+'|'+jQuery('#lng').val()+'|'+jQuery('#utc').val()+'|'+jQuery('#countrycode').val()+'|'+jQuery('#cityId').val()+'|'+jQuery('#city').val()+'|'+jQuery('#geonameid').val()+'|'+jQuery('#google_id').val()+'|'+jQuery('#tz').val()+'|'+jQuery('#uauto').val();
			param[2] = jQuery('#period').val();
			param[3] = jQuery('#ctype').val();
			param[4] = jQuery('#deal').val();
			param[5] = jQuery('#ghost_mode').val();
			param[6] = jQuery('#ghost_by').val();
			param[7] = jQuery('#empty').val();

			if (jQuery('#ghost_view_mode').prop('checked')){
				param[8] = 1;
			}else{
				param[8] = 0;
			}

			if (jQuery('#setLocalTime').prop('checked')){
				param[9] = 1;
			}else{
				param[9] = 0;
			}

			param[10] = jQuery('#view').val();

			param[11] = jQuery('#calc_type').val(); // тип расчета поправок
			param[12] = jQuery('#QMDJRotate').val(); // Ориентация карты
			param[13] = jQuery('#view').val(); // Названия

            if (jQuery('#HourTypes').prop('checked')) {
                param[14] = 1; // Названия
            }else{
                param[14] = 0; // Названия
            }

			param[15] = jQuery('#deal_D').val(); // тип расчета поправок для месяца
			param[16] = jQuery('#deal_M').val(); // тип расчета поправок для месяца
			param[17] = jQuery('#deal_Y').val(); // тип расчета поправок для месяца
			AjaxTextCall2('calccimen', 'savePDF', param, function(data){
				jQuery('#cimencart').html(data);

				/* Прячем лоадер */
				jQuery("#loading").addClass("DNone");
			});
		}/* Окончание условия валидации */
		return false;
	});







	// function CalculateCard(data){
    //     console.log('js CalculateCard:');
    //     console.log(data);
	// 	jQuery('#CalcType').val(0); // Тип расчетов, по дате
	// 	/* Показываем лоадер */
	// 	jQuery("#loading").removeClass("DNone");
	//
	// 	/* Удаляем все открытые диалоговые окна для дворцов */
	// 	RemoveDialogCastle();
	//
	// 	var RemoveDialog=jQuery("[QMDJDialogContent]");
	// 	if (RemoveDialog.length>0){
	// 		for (i=0; i<RemoveDialog.length; i++){
	// 			if ( jQuery("div").is("[aria-describedby="+$(RemoveDialog[i]).attr("id")+"Window]")){
	// 				$( "#"+$(RemoveDialog[i]).attr("id")+"Window" ).dialog( "destroy" );
	// 				$( "#"+$(RemoveDialog[i]).attr("id")+"Window" ).remove();
	// 			}
	// 		}
	// 	}
	//
	// 	console.log('view:'+jQuery('#viewparam').val());
	//
	// 	var param = Form2Array(jQuery('#calcForm').serializeArray());
	// 	console.log('param1:');
	// 	console.log(param);
	//
	// 	/*дополняем саммив параметров*/
	// 	if (typeof data!=='undefined'){
	//
	// 	     console.log('1');
	// 		 console.log(data);
	// 		 _.merge(param,data);
	//
	// 		// param['ghost_view_mode'] = jQuery('#ghost_view_mode').prop('checked')?1:0;
	// 		 param['setLocalTime'] = FormQmdjApp.formdata.common.setLocalTime;
	// 		 param['view'] = FormQmdjApp.formdata.calccimen.view;
	// 		 param['calc_type'] = FormQmdjApp.formdata.calccimen.calc_type; // тип расчета поправок
	// 		// param['QMDJRotate'] = jQuery('#QMDJRotate').val(); // Ориентация карты
	// 		// param['hour_type'] = jQuery('#hour_type').prop('checked')?1:0; // Названия
	// 		param['ctype'] = FormQmdjApp.formdata.calccimen.ctype;
	// 		// param['ghost_by'] = jQuery('#ghost_by').val();
	// 		 param['empty'] = FormQmdjApp.formdata.calccimen.empty;
	// 		param['ghost_mode'] = FormQmdjApp.formdata.calccimen.ghost_mode;
	//
	// 		param['deal_D'] = MenuApp.deal_D;//jQuery('#deal_D').val(); // тип расчета поправок для месяца
	// 		param['deal_M'] = MenuApp.deal_M//jQuery('#deal_M').val(); // тип расчета поправок для месяца
	// 		param['deal_Y'] = MenuApp.deal_Y//jQuery('#deal_Y').val(); // тип расчета поправок для месяца
	// 		param['yyy'] = jQuery('#year').val();
    //         //param['template'] = jQuery('#template').val();
	//
	//
	// 	}else{
	// 		console.log('2');
	// 		param['ghost_view_mode'] = jQuery('#ghost_view_mode').prop('checked')?1:0;
	// 		//param['setLocalTime'] = jQuery('#setLocalTime').prop('checked')?1:0;
	// 		param['setLocalTime'] = FormQmdjApp.formdata.common.setLocalTime;
	// 		param['view'] = jQuery('#viewparam').val();
	// 		param['calc_type'] = jQuery('#calc_type').val(); // тип расчета поправок
	// 		param['QMDJRotate'] = jQuery('#QMDJRotate').val(); // Ориентация карты
	// 		param['hour_type'] = jQuery('#hour_type').prop('checked')?1:0; // Названия
	// 		param['deal_D'] = jQuery('#deal_D').val(); // тип расчета поправок для месяца
	// 		param['deal_M'] = jQuery('#deal_M').val(); // тип расчета поправок для месяца
	// 		param['deal_Y'] = jQuery('#deal_Y').val(); // тип расчета поправок для месяца
	// 		param['yyy'] = jQuery('#year').val();
	// 		param['ctype'] = jQuery('#ctype').val();
	// 		param['ghost_by'] = jQuery('#ghost_by').val();
	// 		param['empty'] = jQuery('#empty').val();
    //         param['ghost_mode'] = jQuery('#ghost_mode').val();
    //         //param['template'] = jQuery('#template').val();
	// 	}
    //     console.log('calccimen_calc data :');
	//
	// 	console.log(FormQmdjApp.formdata.calccimen);
	// 	console.log(FormQmdjApp.formdata.common.setLocalTime);
	//
	// 	param['HoursType'] = FormQmdjApp.formdata.calendar.HoursType;
	// 	param['parentuserid'] = FormQmdjApp.parentuserid; // Передаем данные о пользователе
	// 	param['parent'] = FormQmdjApp.parent; // Передаем данные о пользователе
	// 	if (param['view']===''){
	// 		param['view']='utf8';
	// 	}
	//
	// 	console.log('send params to calculate2:');
	// 	console.log(param);
	// 	AjaxTextCall2('calccimen', 'calculate2', param, function(data){
	// 		jQuery('#cimencart').html(data);
	// 		jQuery("#loading").addClass("DNone");
	// 		return false;
	// 	});
	//
	// 	return false;
	// }



	jQuery('#showCart2').on('click',function(){
		/* Проверяем валидность формы, если да, то сохраняем */
		if ( jQuery('#Date_BOX').isValid()){

		    // console.log('----------------------');
		    // console.log(FormQmdjApp.formdata.calccimen);
		    // console.log('----------------------');

			CalculateCard(FormQmdjApp.formdata.calccimen);
		}else{
			jQuery.mAlert('Дата не корректна! проверьте введенные данные');
		}
		return false;
	});


	/*Инициализация автокомплита*/
	InitAutocomplete('#fname','#fname','/ajax.php?m=cards&object=1&script=autoCardList',function(data){
			//document.location = "/card/" + data.id; '/ajax.php?m=cards&object=1&script=autoCardList' /ajax.php?m=cards&script=getCardList
		});

	$("#fname").click(function() {
		if(!$(this).val()){
			$(this).autocomplete( "search", '000');
		} else{
			$(this).autocomplete( "search", $(this).val());
		}
	});

	/* К каждому диву мы привязываем автокомплит */


		function SetUtcAutoText(utc){
			if (utc!='none'){

				if (utc>0){
					jQuery("#sutc option:selected").html(UTCAuto+' '+utc);
					}else{
						jQuery("#sutc option:selected").html(UTCAuto+' '+utc);

					}}else{
					//jQuery('#UtcResult').html('');
			}
		}


		function SelectCity(obj){
			/*Метод вызывается при выборе города (элемента автокомплита)*/
			/* Получаем текущий инпукт и поднимаемся до родительского дива */

			var data = {
				lng: obj.attr('lng'),
				lat: obj.attr('lat'),
				utc: obj.attr('utc'),
				countrycode: obj.attr('cc'),
				id: obj.attr('cityid'),
				geonameid:obj.attr('geonameid'),
				google_id:obj.attr('google_id')
			};



			/*Распихиваем данные по полям отталкиваясь от родительского дива. Ищем по единым параметрам*/
			jQuery("#lng").val(data.lng);
			jQuery("#lat").val(data.lat);


				jQuery('#utc').val(data.utc);
				jQuery("#sutc option[value='auto']").attr('selected','selected');
				SetUtcAutoText(data.utc);



			/*Добавляем значения в скрытые поля*/
			jQuery("#cityId").val(data.id);
			jQuery("#geonameid").val(data.geonameid);
			jQuery("#google_id").val(data.google_id);

			jQuery("#countrycode").val(data.countrycode);
			var param = new Array();
			param[0] = data.id; // ID Населенного пункта
			param[1] = data.name; // ID Населенного пункта

			AjaxTextCall('calc','add_cache',param,null);
		}


		jQuery('#sutc').change(function(){
			if ($(this).val()!='auto'){
				jQuery("#utc").val($(this).val());
				SetUtcAutoText('none');
			}else{
				jQuery('#day').change();
			}

		});




		jQuery('#RU').click(function(){
			chLang('ru-RU');
			return false;
		});
		jQuery('#EN').click(function(){
			chLang('en-GB');
			return false;
		});

		function NewCard(){
			AjaxFormTextCall2('#calcForm','calccimen','newcard',null,function (data){
				document.location = '/qmdj';
			});
		}

		function SaveTo(callback){
			/*AjaxFormTextCall('#calcForm','calccimen','savecard',null,function (data){
				alert('Сохранение карты завершено!');
			});*/
			tinyMCE.triggerSave();
			var data = jQuery('#calcForm').serializeArray();
			data.push({name: 'comments', value: $('.CimenComments textarea').val()});
            //console.log('card save:');
            //console.log(data);
			AjaxJsonCall2('calccimen','savecard',data,callback);

		}


		function SaveFormValue(param){
		    AjaxJsonCall2('calccimen','SaveFormValue',param);
		    return false;
		}

		function LoadFormValue(){
            AjaxJsonCall2('calccimen','LoadFormValue',null,function(result){
    			/*заполняем форму*/
				jQuery.each(result,function(index,value){
					 /*пробегаем по */
					jQuery.each(value,function(key,item){

						switch (index){
							case 'select':
                                jQuery('#'+key+' option[value="'+item+'"]').prop('selected',true);
								break;
							case 'check':
								if (item===1){
                                    jQuery('#'+key).prop('checked',true);
								}else{
                                    jQuery('#'+key).prop('checked',false);
								}
								break;
						}
					});
				});
				return false
			});
		}

function ShowSearchByNumWindow(param){
	var UniqName = 'SearchByNumWindow';
	var html = '<p class="Attent">\n' +
		'<svg style="width: 2em;height: 2em;float: left;margin: 0.3em 0.5em 0 0;"><use xlink:href="/img/ico_ML_16x16_Map.svg#Idea_02"></use></svg>\n' +
		param.text+
		'</p> <input placeholder="1-1080" type="number" min="1" max="1080" class="VAMid" id="'+UniqName+'CardNum" name="'+UniqName+'InputCardNum" value="">';

	param.text = html;

	param = jQuery.extend({
		'title':'Поиск по номеру',
		'text':html,
		'width':'300px',
		'nobutton':0,
		'draggable':1,
		action: function (e){
			if (e.action==='button') {
				/*Расчет карты*/
				jQuery('#CalcType').val(1); // Тип расчетов, по номеру
				var num = jQuery('#'+UniqName+'CardNum').val();

				var param={
					'CardNum':num,
					'period':jQuery('#period').val(),
					'ctype':jQuery('#ctype').val(),
					'deal':	jQuery('#deal').val(),
					'ghost_mode':jQuery('#ghost_mode').val(),
					'ghost_by':jQuery('#ghost_by').val(),
					'empty':jQuery('#empty').val(),
					'view':jQuery('#view').val(),
					'calc_type':jQuery('#calc_type').val(),
					'QMDJRotate':jQuery('#QMDJRotate').val(),
					'deal_D': jQuery('#deal_D').val(), // тип расчета поправок для месяца
					'deal_M': jQuery('#deal_M').val(), // тип расчета поправок для месяца
					'deal_Y': jQuery('#deal_Y').val() // тип расчета поправок для месяца

				};


				if (jQuery('#ghost_view_mode').prop('checked')){
					param['ghost_view_mode'] = 1;
				}else{
					param['ghost_view_mode'] = 0;
				}

				if (jQuery('#setLocalTime').prop('checked')){
					param['setLocalTime'] = 1;
				}else{
					param['setLocalTime'] = 0;
				}


				if (jQuery('#hour_type').prop('checked')==true) {
					param['hour_type'] = 1; // Названия
				}else{
					param['hour_type'] = 0; // Названия
				}

				/* Показываем лоадер */
				jQuery("#loading").removeClass("DNone");
				AjaxTextCall2('calccimen','SearchByNum',param,function(html){
					/* Показываем лоадер */
					jQuery("#loading").addClass("DNone");
					jQuery('#cimencart').html(html);
				});




			}
		}
	},param);
	jQuery.mAlert(param);
}

jQuery(function(){
    		LoadFormValue();

			/*Созраняем поля формы*/
			// jQuery('.saveValue').blur(function(){
			// 	Form2Session(jQuery(this).attr('id'),jQuery(this).val());
			// });



    		jQuery('.saveFormValueSelect').change(function(){
               // alert(jQuery(this).attr('id'));
                var param = {
                    id: jQuery(this).attr('id'),
                    value:jQuery(this).val(),
					type:'select'
                };
				//alert('1');
                SaveFormValue(param);
		    });

    		jQuery('.saveFormValueCheck').click(function(){
    			var val;
    			if (jQuery(this).prop('checked')){
    				val = 1;
				}else{
    				val = 0;
				}
        		var param = {
            		id: jQuery(this).attr('id'),
            		value:val,
					type:'check'
        		};
        		SaveFormValue(param);
    		});



			/*jQuery('input[type=checkbox].saveValue').click(function(){
				if (jQuery(this).prop('checked')) {
					Form2Session($(this).attr('id'), 1);
				}else{
					Form2Session($(this).attr('id'), 0);
				}
			});*/

			jQuery('.ViewOpt').change(function (){
				/*var param = new Array();
				param[0] = jQuery(this).attr('ViewOpt');
				param[1] = jQuery(this).val();
				AjaxTextCall('calccimen','update_view_option',param,null);*/
			});

    jQuery('#showCardByNum').click(function(){

    	jQuery('#CalcType').val(1); // Тип расчетов, по номеру
		var num = jQuery('#dialog-SearchByNum>#CardNum').val();

		var param={
			'CardNum':num,
			'period':jQuery('#period').val(),
			'ctype':jQuery('#ctype').val(),
			'deal':	jQuery('#deal').val(),
			'ghost_mode':jQuery('#ghost_mode').val(),
			'ghost_by':jQuery('#ghost_by').val(),
			'empty':jQuery('#empty').val(),
			'view':jQuery('#view').val(),
			'calc_type':jQuery('#calc_type').val(),
			'QMDJRotate':jQuery('#QMDJRotate').val(),
			'deal_D': jQuery('#deal_D').val(), // тип расчета поправок для месяца
			'deal_M': jQuery('#deal_M').val(), // тип расчета поправок для месяца
			'deal_Y': jQuery('#deal_Y').val() // тип расчета поправок для месяца

		};

        //console.log('prepare FORM:');

        if (jQuery('#ghost_view_mode').prop('checked')){
            param['ghost_view_mode'] = 1;
        }else{
            param['ghost_view_mode'] = 0;
        }

        if (jQuery('#setLocalTime').prop('checked')){
            param['setLocalTime'] = 1;
        }else{
            param['setLocalTime'] = 0;
        }


        if (jQuery('#hour_type').prop('checked')==true) {
            param['hour_type'] = 1; // Названия
        }else{
            param['hour_type'] = 0; // Названия
        }
		jQuery.mAlert({'text':'<div id="js_loader" class="loader_Micro "></div> '+WE_ARE_SEARCHING_CHARTS_PLS_WAIT,'nobutton':1});
		AjaxTextCall2('calccimen','SearchByNum',param,function(html){
			jQuery.mAlert('hide');
			jQuery('#dialog-SearchByNum>#CardNum').val('');
            jQuery('#cimencart').html(html);
            jQuery( "#dialog-SearchByNum" ).dialog( "close" );
            return false;
		});

	});
// -----------------------

			jQuery('#year').change();

		});

// Поиск ближайших дат с такимиже картами

function getAutoINIBirthCorrection(lng, utc){
	AjaxJsonCall2('calc', 'getDescRealshift', {
		lng: lng,
		utc: utc,
		year: jQuery('#Date_BOX #year').val(),
		month: jQuery('#Date_BOX #month').val(),
		day: jQuery('#Date_BOX #day').val(),
		hour: jQuery('#Date_BOX #thur').val(),
		min: jQuery('#Date_BOX #tmin').val(),
	}, function(data){
		if(jQuery('#AutoINIBirth #city').val() !== '' ||
			( jQuery('#AutoINIBirth #lng').val() !== '' && jQuery('#AutoINIBirth #lat').val() !== '' )
		){
			jQuery('#AutoINIBirth .Correction').removeClass('DNone');
		} else{
			jQuery('#AutoINIBirth .Correction').addClass('DNone');
		}
		jQuery('#AutoINIBirth .Correction span').html(data.desc_realshift);
		if( jQuery('.Correction').length > 0 ){
			jQuery('.Correction .HI_correction').html(data.desc_realshift);
			var hour_info = jQuery('.Correction .HourInfo');
			hour_info.find('td font').eq(0).html(data.limits.hour.data.animal_text);
			hour_info.find('.BZ_DesrRight_H').html(data.limits.hour.data.utf8);
			hour_info.find('.HI_Time').html(
				data.limits.left.hour+':'+data.limits.left.min+' - '+data.limits.right.hour+':'+data.limits.right.min
			);
			if(data.hours.is_change == true){
				jQuery('.Correction .IsChange').removeClass('DNone');
				jQuery('.Correction .ChangeTime').html(data.hours.change.hour+':'+data.hours.change.min);
			} else{
				jQuery('.Correction .IsChange').addClass('DNone');
			}
		}
	});
}


function ShowCimenHours(callback){
	callback();
}
