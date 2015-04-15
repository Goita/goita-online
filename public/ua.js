//https://github.com/masakihongo/searchUA
var ua = {};
ua.browser = {};
ua.name = window.navigator.userAgent.toLowerCase();
ua.ver = "unknown";
ua.dpr = window.devicePixelRatio;
var isRetina = ua.dpr >= 2.0;

ua.isiPhone = ua.name.indexOf('iphone') >= 0;
ua.isiPod = ua.name.indexOf('ipod') >= 0;
ua.isiPad = ua.name.indexOf('ipad') >= 0;
ua.isiOS = (ua.isiPhone || ua.isiPod || ua.isiPad);
ua.isAndroid = ua.name.indexOf('android') >= 0;
ua.isTablet = (ua.isiPad || (ua.isAndroid && ua.name.indexOf('mobile') < 0));
ua.isMobile = (ua.isiOS || ua.isAndroid);
ua.isFirefoxPhone = (ua.name.indexOf('mozilla') >= 0 && (ua.name.indexOf('tablet') >= 0 || ua.name.indexOf('mobile') >= 0) 
                    && ua.name.indexOf('firefox') >= 0 && !ua.isAndroid && ua.name.indexOf('linux') < 0);
ua.isDesktop = (ua.name.indexOf('windows') >= 0 || (ua.name.indexOf('linux') >= 0 && !ua.isAndroid) 
                || ua.name.indexOf('macintosh') >= 0);
                
ua.isiOSRetina = ((ua.isiPhone || ua.isiPad || ua.isiPod) && isRetina);

ua.browser.isIE = (ua.name.indexOf('msie') >= 0 || ua.name.indexOf('trident') >= 0);
ua.browser.isChrome = (ua.name.indexOf('chrome') >= 0 && ua.name.indexOf('safari') >= 0);
ua.browser.isAndroidDefault = (ua.name.indexOf('safari') && ua.name.indexOf('mobile') >= 0 && ua.name.indexOf('chrome') < 0);

if (ua.browser.isIE) {
    ua.verArray = /(msie|rv:?)\s?([0-9]{1,})([\.0-9]{1,})/.exec(ua.name);
    if (ua.verArray) {
        ua.ver = parseInt(ua.verArray[2], 10);
    }
}
if (ua.isiOS) {
    ua.verArray = /(os)\s([0-9]{1,})([\_0-9]{1,})/.exec(ua.name);
    if (ua.verArray) {
        ua.ver = parseInt(ua.verArray[2], 10);
    }
}
if (ua.isAndroid) {
    ua.verArray = /(android)\s([0-9]{1,})([\.0-9]{1,})/.exec(ua.name);
    if (ua.verArray) {
        ua.ver = parseInt(ua.verArray[2], 10);
    }
}