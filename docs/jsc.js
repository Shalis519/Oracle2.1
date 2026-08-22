/*
 JavaScript Sun Calculator
c 2001 Juergen Giesen
http://www.jgiesen.de
*/

var string1="ex1";
var dat, myDay, myMonth, myYear, myHour, myMinute, JD, UT, OK, offset, timezone1, cityUTC, dIM, DEC, RA, EOT
var lat, longit, offset, htb, DIM, locOffset;
var month = new Array('Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec');
var UTRISE, UTSET, RISE, SETT, ABOVE;

function frac(X) {
 X = X - Math.floor(X);
 if (X<0) X = X + 1.0;
 return X;		
}

	function sunDecRA (what, jd) {
		var PI2 = 2.0*Math.PI;
		var cos_eps = 0.917482;
		var sin_eps = 0.397778;				
		var M, DL, L, SL, X, Y, Z, R;
		var T, dec, ra;		
		T = (jd - 2451545.0) / 36525.0;	// number of Julian centuries since Jan 1, 2000, 0 GMT								
		M = PI2*frac(0.993133 + 99.997361*T);
		DL = 6893.0*Math.sin(M) + 72.0*Math.sin(2.0*M);
		L = PI2*frac(0.7859453 + M/PI2 + (6191.2*T+DL)/1296000);
		SL = Math.sin(L);
		X = Math.cos(L);
		Y = cos_eps*SL;
		Z = sin_eps*SL;
		R = Math.sqrt(1.0-Z*Z);
		dec = (360.0/PI2)*Math.atan(Z/R);
		ra = (48.0/PI2)*Math.atan(Y/(X+R));
		if (ra<0) ra = ra + 24.0;
		if (what==1) return dec; else return ra;			
}

function riseset(DATE, MONTH, YEAR, HOUR) {
 var K = Math.PI/180.0;
 var sh = Math.sin(-K*0.8333);
 var jd=JulDay (DATE, MONTH, YEAR, HOUR)
 var dec = sunDecRA(1,jd);
 var ra = sunDecRA(2,jd);
 var gha = computeGHA (DATE, MONTH, YEAR, HOUR)	
 Y0 = Math.sin(K*computeHeight(dec, lat, longit, gha)) - sh;
	
 var jdPlus = JulDay(DATE, MONTH, YEAR, HOUR+1.0);
 dec = sunDecRA(1,jdPlus);
 ra = sunDecRA(2,jdPlus);
 gha = computeGHA (DATE, MONTH, YEAR, HOUR+1.0)	
 yPlus = Math.sin(K*computeHeight(dec, lat, longit, gha)) - sh;
	
 var jdMinus = JulDay(DATE, MONTH, YEAR, HOUR-1.0);
 dec = sunDecRA(1,jdMinus);
 ra = sunDecRA(2,jdMinus);
 gha = computeGHA (DATE, MONTH, YEAR, HOUR-1.0)
 yMinus = Math.sin(K*computeHeight(dec, lat, longit, gha)) - sh;
	
	ABOVE = (yMinus>0.0);

	QUAD(yMinus,yPlus);
	switch (NZ)
	{
		case 0: break;
		case 1:		
			if (yMinus<0.0) {UTRISE = HOUR+zero1; RISE=true;}
			else {UTSET = HOUR+zero1; SETT=true;}
			break;		
		case 2:		
			if (YE<0.0) {UTRISE = HOUR+zero2; UTSET=HOUR+zero1;}
			else {UTRISE = HOUR+zero1; UTSET=HOUR+zero2;}
			RISE=true;
			SETT=true;
			break;					
	}		
}

function QUAD(yMinus,yPlus){
	NZ = 0;
	var XE;
	var A = 0.5*(yMinus+yPlus) - Y0;
	var B = 0.5*(yPlus-yMinus);
	var C = Y0;
	XE = -B/(2.0*A);
	YE = (A*XE+B)*XE + C;
	var DIS = B*B - 4.0*A*C;
	if (DIS>=0) {
		DX = 0.5*Math.sqrt(DIS)/Math.abs(A);
		zero1 = XE - DX;
		zero2 = XE + DX;
		if (Math.abs(zero1)<=1.0) NZ = NZ + 1;
		if (Math.abs(zero2)<=1.0) NZ = NZ + 1;
		if (zero1<-1.0) zero1=zero2;
	}
}

function HoursMinutes(time) {
 var min=Math.round(60*(time-Math.floor(time)));
 var str;
 if (min>=10) str=Math.floor(time)+":"+min;
 else  str=Math.floor(time)+":0"+min;
 if (min==60) str=Math.floor(time+1)+":00";
 return str;
}

function computeHeight(dec, latitude, longit, gha) {	
 var K = Math.PI/180.0;
 var lat_K = latitude*K;
 var dec_K = dec*K;
 var x=Number(gha)+Number(longit);
 sinHeight =Math.sin(dec_K)*Math.sin(lat_K) + Math.cos(dec_K)*Math.cos(lat_K)*Math.cos(K*x);	
 return Math.asin(sinHeight)/K;
}

function computeGHA (T, M, J, STD) {	
		var K = Math.PI/180.0, N, X, XX, P;		
		 N = 365 * J + T + 31 * M - 46;		 
		 if (M<3) N = N + Math.floor((J-1)/4);
		else N = N - Math.floor(0.4*M + 2.3) + Math.floor(J/4);			 
		P = STD/24.0;
		X = (P + N - 7.22449E5) * 0.98564734 + 279.306;
		X = X * K;
		XX = -104.55 * Math.sin(X) - 429.266 * Math.cos(X) + 595.63 * Math.sin(2.0 * X) - 2.283 * Math.cos(2.0 * X);
		XX = XX + 4.6 * Math.sin(3.0 * X) + 18.7333 * Math.cos(3.0 * X);
		XX = XX - 13.2 * Math.sin(4.0 * X) - Math.cos(5.0 * X) - Math.sin(5.0 * X) / 3.0 + 0.5 * Math.sin(6.0 * X) + 0.231;
		XX = XX / 240.0 + 360.0 * (P + 0.5);
		if (XX > 360.0) XX = XX - 360.0;  
 	return XX;				
}

function getTZone() {
var utHour = Math.floor(UT);
 timezone1=document.getElementById("form_hours").cityUTC2.options[document.getElementById("form_hours").cityUTC2.selectedIndex].value;
 cityUTC=document.getElementById("form_hours").cityUTC.value;
 if (cityUTC!=0) offset=-60*cityUTC;
  else offset=-60*timezone1;
 RISE = false;
 SETT = false;
 locOffset = -offset/60;
 newHour = utHour + locOffset;
 console.log('getTZone timezone1:'+timezone1);
 console.log('getTZone cityUTC:'+cityUTC);
   console.log('getTZone newHour:'+newHour);

 if (newHour>=24) {
 newHour=newHour-24;
 document.getElementById("form_hours").cho.options[newHour].selected=true;
 myDay=myDay+1;

  console.log('getTZone myDay+1:'+myDay);

 document.getElementById("form_hours").cd.options[myDay-1].selected=true;
 }
 if (newHour<0) {
 newHour=newHour+24;
 document.getElementById("form_hours").cho.options[newHour].selected=true;
 myDay=myDay-1;
  
  console.log('getTZone myDay-1:'+myDay);

 document.getElementById("form_hours").cd.options[myDay-1].selected=true;
}
 var str = " " + myYear+", "+myDay+" "+ document.getElementById("form_hours").cm.options[myMonth-1].value;
 
 str = str +"  , "+newHour+":";
 if (myMinute<10) str=str+"0"+myMinute; else str=str+myMinute;
 document.getElementById("form_hours").text1.value=str;

 console.log('getTZone str:'+str);

 RISE = false;
 SETT = false;
 locOffset = -offset/60;			
 for (var i=-locOffset; i<-locOffset+24; i++) { // i=GMT							
  riseset(myDay, myMonth, myYear, i)								
  if (RISE && SETT)  break;			
 }

if (RISE || SETT) 
{
 if (RISE) {UTRISE=UTRISE + locOffset;if (UTRISE>24) UTRISE = UTRISE-24;if (UTRISE<0) UTRISE = UTRISE+24;}
 if (SETT) {UTSET=UTSET + locOffset;if (UTSET>24) UTSET = UTSET-24;if (UTSET<0) UTSET = UTSET+24;}
 if (UTSET>UTRISE) lengthOfDay=UTSET-UTRISE;
  else lengthOfDay=24-(UTRISE-UTSET);
}

 if (RISE) str=HoursMinutes(UTRISE); else {if (ABOVE) str="не восходит"; else str="--.--"}			
 document.getElementById("form_hours").riseTime.value=str;

if (SETT) str=HoursMinutes(UTSET); else {if (ABOVE) {str="не заходит"; lengthOfDay=24} else {str="--.--";lengthOfDay=0}}			
 document.getElementById("form_hours").setTime.value=str;
 //lengthOfDay=Math.round((100*lengthOfDay)/100);
 lengthOfDay=SWHM(lengthOfDay);
 document.getElementById("form_hours").text4.value=lengthOfDay;
}

function table() {
 tDat = new Date();
 daysInMonth(myMonth,myYear)
 if (lat>=0) ns=" Северной"; else ns=" Южной";
 if (longit>=0) ew=" Восточной"; else ew=" Западной";
 var str = "Восход, Заход, Долгота дня, Transit, and Max. Altitude"+"\n";
 str = str +  "Для Широты=" + lat + ns + ",  Долгота=" + longit + ew+"\n";
 document.getElementById("form_hours").area.value+=str;

 console.log('table str:'+str);


 for (var i=1; i<=dIM; i++) {
 JD=JulDay (i, myMonth,myYear, 12)
 EOT = eot(i, myMonth,myYear, 12)
 myDay=i

 RISE = false;
 SETT = false;				
 for (var j=-locOffset; j<-locOffset+24; j++) { // i=GMT							
  riseset(i, myMonth, myYear, j)								
  if (RISE && SETT)  break;			
 }
if (RISE || SETT) 
{
 if (RISE) {UTRISE=UTRISE + locOffset;if (UTRISE>24) UTRISE = UTRISE-24;if (UTRISE<0) UTRISE = UTRISE+24;}
 if (SETT) {UTSET=UTSET + locOffset;if (UTSET>24) UTSET = UTSET-24;if (UTSET<0) UTSET = UTSET+24;}
 if (UTSET>UTRISE) lengthOfDay=UTSET-UTRISE;
  else lengthOfDay=24-(UTRISE-UTSET); 
}

if (RISE) str1=HoursMinutes(UTRISE); else {if (ABOVE) str1="не восходит"; else str1="--.--"}
 if (SETT) str2=HoursMinutes(UTSET);
 else {if (ABOVE) {str2="не заходит"; lengthOfDay=24} else {str2="--.--";lengthOfDay=0}}			

 //lengthOfDay=Math.round((100*lengthOfDay)/100);
 lengthOfDay=SWHM(lengthOfDay);
 document.getElementById("form_hours").text4.value=lengthOfDay;
 
 if (i<10) s="0"; else s="";
 var trans = 12.0 - EOT/60.0 - longit/15.0; 
 var GHA = computeGHA (myDay, myMonth, myYear, trans);
 trans = trans-offset/60.0;
 str3 = HoursMinutes(trans);
 var elev = computeHeight(DEC, lat, longit, GHA);
 elev =  Math.round(elev*10)/10;
 if (elev % 1 !=0)  str4 = elev; else  str4 = elev+".0";
 document.getElementById("form_hours").area.value+=myYear + " " +month[myMonth-1]+" "+s+myDay+"    "+str1 + "    " + str2 + "   " + lengthOfDay +"   "+str3+"  "+str4+"\n"
}
}

function daysInMonth(m, y) {
	var n=31
	m=m-1
	if ((m==0) || (m==2) || (m==4) || (m==6) || (m==7) || (m==9) || (m==11))  n=31
	if ((m==3) || (m==5) || (m==8) || (m==10))  n=30;
	if (m==1) {
		n=28;
		if ((y % 4) == 0) n=29
		if ((y % 100) == 0) n=28
		if ((y % 400) == 0) n=29
		}
	dIM=n;			
}

function DateTime() {

 var str = " " + myYear+", "+myDay+" "+ document.getElementById("form_hours").cm.options[myMonth-1].value+"  , "+myHour+":";

 if (myMinute<10) str=str+"0"+myMinute; else str=str+myMinute;
  console.log('DateTime str:'+str);
  
 document.getElementById("form_hours").text1.value=str;
 str = " " + Math.round(1000*DEC)/1000;
 document.getElementById("form_hours").text2.value=str;



 lat = document.getElementById("form_hours").cityX.value
 longit = document.getElementById("form_hours").cityY.value

 console.log('DateTime lat:'+lat+' longit:'+longit);


 if (offset>=1320) offset=offset-1440;
 var nn=-2*offset/60
 if (offset<0) nn=nn-1;
 if (timezone1!=0 && cityUTC==0)
 {
  document.getElementById("form_hours").cityUTC2.options[Math.abs(nn)].selected=true;
  document.getElementById("form_hours").cityUTC.value=0;
   console.log('DateTime timezone1!=0 && cityUTC==0');
 }

   console.log('DateTime myDay:'+myDay+' myMonth:'+myMonth+' myYear:'+myYear+' UT:'+UT);
   console.log('DEC:'+DEC+' lat:'+lat+' longit:'+longit+' GHA:'+GHA);


 var GHA = computeGHA (myDay, myMonth, myYear, UT);
 var elev = computeHeight(DEC, lat, longit, GHA);
 elev =  Math.round(elev*100)/100;

  console.log('DateTime GHA:'+GHA+' elev:'+elev);

 RISE = false;
 SETT = false;

 for (var i=-locOffset; i<-locOffset+24; i++) { // i=GMT							
  riseset(myDay, myMonth, myYear, i)								
  if (RISE && SETT)  break;			
 }

 if (RISE || SETT) 
 {
  if (RISE) {hRise1=UTRISE + locOffset;if (hRise1>24) hRise1-=24;if (hRise1<0) hRise1+=24;}
  if (SETT) {hSet1=UTSET + locOffset;if (hSet1>24) hSet1-=24;if (hSet1<0) hSet1+=24;}
  if (hSet1>hRise1) lengthOfDay=hSet1-hRise1;
   else lengthOfDay=24-(hRise1-hSet1);
 }
  //console.log('DateTime hRise1:'+hRise1+' hSet1:'+hSet1);

 if (RISE) str=HoursMinutes(hRise1); else {if (ABOVE) str="не восходит"; else str="--.--";}			
 document.getElementById("form_hours").riseTime.value=str;	
 document.getElementById("time_voshod").innerHTML=str;	


if ((str=="не восходит") || (str=="--.--")) {
	error_var = true; error_msg = 'Расчет резинового времени для данной даты не возможен.'; return false;
}
  console.log('DateTime riseTime:'+str);



 if (SETT) str=HoursMinutes(hSet1);
 else {if (ABOVE) {str="не заходит"; lengthOfDay=24;}  else {str="--.--";lengthOfDay=0}}			
 document.getElementById("form_hours").setTime.value=str;
  document.getElementById("time_zahod").innerHTML=str;


 console.log('DateTime setTime:'+str);


//lengthOfDay=Math.round((100*lengthOfDay)/100);
 lengthOfDay=SWHM(lengthOfDay);
 document.getElementById("form_hours").text4.value=lengthOfDay;

 console.log('DateTime lengthOfDay:'+lengthOfDay);


}

function SWHM(ut)
{
    ut = Math.floor(ut*60.0+0.5)/60.0;
    var h = Math.floor(ut);
    var m = Math.floor(60.0*(ut-h)+0.5);
    if (h<10) {h = "0" + h};
    if (m<10) {m = "0" + m};
    var Result=h+"ч. "+m+"м.";
    return Result;
}

function thisHour() {
	dat=new Date()
	document.getElementById("form_hours").cho.options[dat.getHours()].selected=true
	myHour=dat.getHours()
}

function thisMinute() {
	dat=new Date()
	document.getElementById("form_hours").cmi.options[dat.getMinutes()].selected=true
	myMinute=dat.getMinutes()
}

function thisUT() {
	dat=new Date()
	offset=dat.getTimezoneOffset()
	if (offset>=1320) offset=offset-1440
	locOffset=-offset/60
	UT = myHour+(myMinute+offset)/60.0+dat.getSeconds()/3600.0
	str=myHour+offset/60.0
	if (myHour+offset/60.0<0)  str= 24+myHour+offset/60.0
	if (myHour+offset/60.0>=24)  str= -24+myHour+offset/60.0
	str=" " + str + ":";
	if (myMinute<10) str=str+"0"+myMinute
	else str=str+myMinute
	document.getElementById("form_hours").UTime.value=str

 console.log('thisUT UTime:'+str);


}

function thisJulDay() {
  yy = dat.getYear()
  if (yy<1000) yy=yy+1900		
	document.getElementById("form_hours").JulDay.value=" " + Math.round(10000*JD)/10000;

 console.log('thisJulDay JulDay:'+Math.round(10000*JD)/10000);
}

function thisDay() {
	dat=new Date()
	document.getElementById("form_hours").cd.options[dat.getDate()-1].selected=true
	myDay=dat.getDate();

	 console.log('thisDay myDay:'+myDay);
}

function thisMonth() {
	dat=new Date()
	document.getElementById("form_hours").cm.options[dat.getMonth()].selected=true
	myMonth=dat.getMonth()+1
}

function thisYear() {
	dat=new Date()
  yy=dat.getYear()-2000
  if (yy<0) {yy=yy+1900; myYear=dat.getYear()+1900} else  myYear=dat.getYear()
//	document.getElementById("form_hours").cy.options[yy].selected=true
 yyyy=dat.getFullYear();
 list=document.getElementById("form_hours").cy;
 for (var i=0; i<list.options.length; i++)
  if (list.options[i].value==yyyy) {list.options[i].selected=true; break;}
}

function theDay() {
	daysInMonth(myMonth,myYear)
	for (var i=0;i<document.getElementById("form_hours").cd.options.length;i++)
		if (document.getElementById("form_hours").cd.options[i].selected==true) myDay=i+1
	// if (dIM<myDay) {myDay=dIM; document.getElementById("form_hours").cd.options[dIM-1].selected=true}
}

function theMonth() {
	for (var i=0;i<document.getElementById("form_hours").cm.options.length;i++)
		if (document.getElementById("form_hours").cm.options[i].selected==true) myMonth=i+1
}

function theYear() {
	for (var i=0;i<document.getElementById("form_hours").cy.options.length;i++)
		if (document.getElementById("form_hours").cy.options[i].selected==true) myYear=document.getElementById("form_hours").cy.options[i].value;
	daysInMonth(myMonth,myYear)
	// if (dIM<myDay) {myDay=dIM; document.getElementById("form_hours").cd.options[dIM-1].selected=true}
}

function theHour() {
	for (var i=0;i<document.getElementById("form_hours").cho.options.length;i++)
		if (document.getElementById("form_hours").cho.options[i].selected==true) myHour=i
}

function theUT() {
  if (offset>=1320) offset=offset-1440
	UT = myHour+(myMinute+offset)/60.0+dat.getSeconds()/3600.0
  str=myHour+offset/60.0
	if (myHour+offset/60.0<0) str= 24+myHour+offset/60.0
	if (myHour+offset/60.0>=24) str= -24+myHour+offset/60.0
	str=" " + str + ":";
	if (myMinute<10) str=str+"0"+myMinute
	else str=str+myMinute	
	document.getElementById("form_hours").UTime.value=str
}

function theMinute() {
	for (var i=0;i<document.getElementById("form_hours").cmi.options.length;i++)
		if (document.getElementById("form_hours").cmi.options[i].selected==true) myMinute=i
}

function theJulDay() {
	if (myYear<1900) myYear=myYear+1900
	JD=JulDay(myDay,myMonth,myYear,UT)	
	document.getElementById("form_hours").JulDay.value=" " + Math.round(10000*JD)/10000	
}

function JulDay (date, month, year, UT){
 if (year<1900) year=year+1900
 if (month<=2) {month=month+12; year=year-1}
 B = Math.floor(year/400.0) - Math.floor(year/100.0)  + Math.floor(year/4.0)
 A = 365.0*year - 679004.0
 var jd = A + B + Math.floor(30.6001*(month+1)) + date + UT/24.0
 jd = jd + 2400000.5
 return jd
}

function thisDateTime() {
	thisDay()
  thisMonth()
	thisYear()
	thisHour()
	thisMinute()
	thisUT()
	theJulDay()
	offset=dat.getTimezoneOffset()
	EOT = eot(myDay, myMonth, myYear, UT)
  lat = document.getElementById("form_hours").cityX.value
	DateTime()
}

function theDateTime() {
	theDay()
	theMonth()
	theYear()
	theHour()
	theMinute()
	offset=dat.getTimezoneOffset()
	theUT()
	theJulDay()
	EOT = eot(myDay, myMonth, myYear, UT)
	DateTime()
}

function RightAscension(T) {	
	var K = Math.PI/180.0				
	var L, M, C, lambda,  eps, delta, theta							
	L = sunL(T)		
	M = 357.52910 + 35999.05030*T - 0.0001559*T*T - 0.00000048*T*T*T
	M = M % 360		
	if (M<0) M = M + 360				
	C = (1.914600 - 0.004817*T - 0.000014*T*T)*Math.sin(K*M)
	C = C + (0.019993 - 0.000101*T)*Math.sin(K*2*M)
	C = C + 0.000290*Math.sin(K*3*M)		
	theta = L + C; // true longitude of the Sun						
	eps = EPS(T)				
	eps = eps + 0.00256*Math.cos(K*(125.04 - 1934.136*T))		
	lambda = theta - 0.00569 - 0.00478*Math.sin(K*(125.04 - 1934.136*T)); // apparent longitude of the Sun
	RA = Math.atan2(Math.cos(K*eps)*Math.sin(K*lambda), Math.cos(K*lambda))				
	RA = RA/K
	if (RA<0) RA = RA + 360.0;			
	delta = Math.asin(Math.sin(K*eps)*Math.sin(K*lambda))
	delta = delta/K		
	DEC = delta				
	return RA		
}

function sunL(T){
	var L = 280.46645 + 36000.76983*T + 0.0003032*T*T	
	L = L % 360		
	if (L<0) L = L + 360
	return L			
}

function deltaPSI(T){
	var K = Math.PI/180.0
	var deltaPsi, omega, LS, LM				
	LS = sunL(T)	
	LM = 218.3165 + 481267.8813*T		
	LM = LM % 360	
	if (LM<0) LM = LM + 360		
	omega = 125.04452 - 1934.136261*T + 0.0020708*T*T + T*T*T/450000
	deltaPsi = -17.2*Math.sin(K*omega) - 1.32*Math.sin(K*2*LS) - 0.23*Math.sin(K*2*LM) + 0.21*Math.sin(K*2*omega)
	deltaPsi = deltaPsi/3600.0		
	return deltaPsi	
}
	
function EPS(T) {
	var K = Math.PI/180.0
	var LS = sunL(T)
	var LM = 218.3165 + 481267.8813*T	
	var eps0 =  23.0 + 26.0/60.0 + 21.448/3600.0 - (46.8150*T + 0.00059*T*T - 0.001813*T*T*T)/3600
	var omega = 125.04452 - 1934.136261*T + 0.0020708*T*T + T*T*T/450000		
	var deltaEps = (9.20*Math.cos(K*omega) + 0.57*Math.cos(K*2*LS) + 0.10*Math.cos(K*2*LM) - 0.09*Math.cos(K*2*omega))/3600
	return eps0 + deltaEps	
}
	
function eot(date, month, year, UT){		
	var K = Math.PI/180.0
	var  T = (JD - 2451545.0) / 36525.0		
	var eps = EPS(T);
	var RA = RightAscension(T)
	var LS = sunL(T)
	var deltaPsi = deltaPSI(T)						
	var E = LS - 0.0057183 - RA + deltaPsi*Math.cos(K*eps)		
	if (E>5) E = E - 360.0		
	E = E*4; // deg. to min		
	E = Math.round(1000*E)/1000								
	return E		
}

function getLatitude() {
 str=document.getElementById("form_hours").cityX.value;
 var n=str.length;
 for (var i=0; i<n; i++) {
 c=str.charAt(i);
 if ((c!='0') && (c!='1')  && (c!='2') && (c!='3') && (c!='4') && (c!='5') && (c!='6') && (c!='7') && (c!='8') && (c!='9')  && (c!='-') && (c!='+') && (c!='.')) {alert("Ошибка в Широте !"+"\n"+"Введите значение в градусах, например:"+"\n"+" 52.34 если Северная, или -52.34 если Южная.");document.getElementById("form_hours").cityX.value=0; break;};}
 if (Math.abs(Number(str))>90) {alert("Широта должна быть меньше либо равна 90 градусов!"); document.getElementById("form_hours").cityX.value=0; };
 lat=  Number(str);
}

function getLongitude() {
 str=document.getElementById("form_hours").cityY.value;
 var n=str.length;
 for (var i=0; i<n; i++) {
 c=str.charAt(i);
 if ((c!='0') && (c!='1')  && (c!='2') && (c!='3') && (c!='4') && (c!='5') && (c!='6') && (c!='7') && (c!='8') && (c!='9')  && (c!='-') && (c!='+') && (c!='.')) {alert("Ошибка в значении Долготы!"+"\n"+"Введите значение в градусах, например:"+"\n"+" 8.34 если Восточная, или -72.34 если Западная.");document.getElementById("form_hours").cityY.value=0; break;};}
 if (Math.abs(Number(str))>180) {alert("Долгота должна быть меньше или равна 180 градусов!");   document.getElementById("form_hours").cityY.value=0; };
 longit=  Number(str);
 DateTime();
}
