var accessToken, refreshToken;

chrome.commands.onCommand.addListener(function (command) {
    if (command == 'toggle-feature-foo') {
        chrome.tabs.create({ url: chrome.runtime.getURL('index.html') });
    }
});

chrome.browserAction.onClicked.addListener(function () {
    chrome.tabs.create({ url: chrome.runtime.getURL('index.html') });
});

chrome.runtime.onMessage.addListener(function (message, sender, reply) {
    if (message.type == 'iniciarSesion') {
        iniciarSesion(message.user, message.password, message.huella).then(res => {
            if (res.data != null) {
                accessToken = res.data.access_token;
                refreshToken = res.data.refresh_token;
            }
            reply(res);
        });
        return true;
    } else if (message.type == 'consultarDatosCuenta') {
        consultarDatosCuenta(accessToken).then(res => {
            reply(res);
        });
        return true;
    } else if (message.type == 'consultarMovimientos') {
        consultarMovimientos(accessToken, message.cuenta).then(res => {
            reply(res);
        });
        return true;
    } else if (message.type == 'consultarCuentasRegistradas') {
        consultarCuentasRegistradas(accessToken).then(res => {
            reply(res);
        });
        return true;
    } else if (message.type == 'cerrarSesion') {
        cerrarSesion(accessToken, refreshToken).then(res => {
            reply(res);
        });
        return true;
    } else if (message.type == 'isSessionActive') {
        if ((accessToken == null && refreshToken == null) || (accessToken == undefined && refreshToken == undefined)) {
            reply(false);
        } else {
            isSessionActive(accessToken).then(active => {
                if (active == false) {
                    accessToken = null;
                    refreshToken = null;
                }
                reply(active);
            });
        }
        return true;
    }
});

function iniciarSesion(user, password, huella) {
    return new Promise((resolve, reject) => {
        let xhr = new XMLHttpRequest();
        xhr.open('POST', 'https://bdvenlinea.banvenez.com/oauthaccess/verificar-usuario-unico');
        xhr.withCredentials = true;
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.onload = function () {
            var ticketId = JSON.parse(xhr.responseText).ticketId;
            console.log('ticketId: ', ticketId);
            xhr.open('POST', 'https://bdvenlinea.banvenez.com/oauthaccess/login');
            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.onload = function () {
                resolve(JSON.parse(xhr.responseText));
            };
            xhr.send(JSON.stringify({ usoFrecuente: null, password, ticketId: ticketId }));
        };
        xhr.send(JSON.stringify({ username: user.toUpperCase(), mediaHuella: huella, huella: null }));
    });
}
function consultarDatosCuenta(accessToken) {
    return new Promise((resolve, reject) => {
        let xhr = new XMLHttpRequest();
        xhr.open('GET', 'https://bdvenlinea.banvenez.com/consultasaldocuenta/consultaSaldoCuenta/');
        xhr.withCredentials = true;
        xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);
        xhr.onload = function () {
            resolve(JSON.parse(xhr.responseText));
        };
        xhr.send();
    });
}

function consultarMovimientos(accessToken, cuenta) {
    return new Promise((resolve, reject) => {
        let xhr = new XMLHttpRequest();
        xhr.open('GET', `https://bdvenlinea.banvenez.com/movimientoscuenta/movimientosCuenta/${cuenta}/VES`);
        xhr.withCredentials = true;
        xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);
        xhr.onload = function () {
            resolve(JSON.parse(xhr.responseText));
        };
        xhr.send();
    });
}

function consultarCuentasRegistradas(accessToken) {
    return new Promise((resolve, reject) => {
        let xhr = new XMLHttpRequest();
        xhr.open('GET', 'https://bdvenlinea.banvenez.com/registrosafiliaciones/cuentasRegistradasBdv/');
        xhr.withCredentials = true;
        xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);
        xhr.onload = function () {
            resolve(JSON.parse(xhr.responseText));
        };
        xhr.send();
    });
}

function transferenciaTerceros() {
    return new Promise((resolve, reject) => {
        let xhr = new XMLHttpRequest();
        xhr.open('POST', 'https://bdvenlinea.banvenez.com/transferencias/cuentasTerceros');
        xhr.withCredentials = true;
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);
        xhr.onload = function () {
            resolve(JSON.parse(xhr.responseText));
        };
        xhr.send();
    });
}

function pedirFactores() {
    //https://bdvenlinea.banvenez.com/manejoautenticacion/pedir-factores
}

function validarFactores() {
    //https://bdvenlinea.banvenez.com/manejoautenticacion/validar-factores
}

function pagoMovil() {
    //https://bdvenlinea.banvenez.com/pagomovil/pagoMovil
}

function listadoDeBancos() {
    //https://bdvenlinea.banvenez.com/datosgenerales/listadoBancos/p2p
}
function actualizarSession() {
    //https://bdvenlinea.banvenez.com/oauthaccess/actualizar factor3=false refresh_token authorization bearer content type json
}

function isSessionActive(accessToken) {
    return new Promise((resolve, reject) => {
        consultarDatosCuenta(accessToken).then(res => {
            if ((res.error && res.error == 'invalid_token') || (res.descripcion && res.descripcion == 'Cliente tiene una sesion activa')) {
                console.log(res);
                resolve(false);
            } else {
                resolve(true);
            }
        });
    });
}

function cerrarSesion(accessToken, refreshToken) {
    return new Promise((resolve, reject) => {
        let xhr = new XMLHttpRequest();
        xhr.open('POST', 'https://bdvenlinea.banvenez.com/oauthaccess/cerrar');
        xhr.withCredentials = true;
        xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.onload = () => {
            if (JSON.parse(xhr.responseText).data == 'Ok') {
                this.accessToken = null;
                this.refreshToken = null;
            }
            resolve(JSON.parse(xhr.responseText));
        };
        xhr.send(JSON.stringify({ access_token: accessToken, refresh_token: refreshToken }));
    });
}
