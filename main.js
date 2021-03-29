let posicionConsolidada = document.querySelector('#posicionConsolidada');
let movimientos = document.querySelector('#movimientos');
let historicoDeOperaciones = document.querySelector('#historicoDeOperaciones');
let cuentasDeTerceros = document.querySelector('#cuentasDeTerceros');
let cuentasDeOtrosBancos = document.querySelector('#cuentasDeOtrosBancos');
let pagoClave = document.querySelector('#pagoClave');
let pagoDeServicios = document.querySelector('#pagoDeServicios');
let loginForm = document.querySelector('#loginForm');
let userInput = document.querySelector('#user');
let passwordInput = document.querySelector('#password');
let huellaInput = document.querySelector('#mediaHuella');
let nroCuentaInput = document.querySelector('#nroCuenta');
let storage = document.querySelector('#storage');
let controlDeOperaciones = document.querySelector('#controlDeOperaciones');
let btnSalir = document.querySelector('#salir');
let tablaPoscionConsolidada = document.querySelector('#tablaPoscionConsolidada');
let tablaMovimientos = document.querySelector('#tablaMovimientos');
let divOperaciones = document.querySelector('#operaciones');
loginForm.addEventListener('submit', function (event) {
    event.preventDefault();

    var user = userInput.value;
    var password = passwordInput.value;
    var huella = huellaInput.value;
    var nroCuenta = nroCuentaInput.value;

    if (user && password && huella && nroCuenta) {
        iniciarSesion(user, password, huella, nroCuenta).then(response => {
            if (response.data != null && response.data.access_token != null) {
                if (storage.checked) {
                    let newAccount = [
                        {
                            user,
                            password,
                            huella,
                            nroCuenta,
                        },
                    ];
                    let cuentas = localStorage.getItem('cuentas') ? JSON.parse(localStorage.getItem('cuentas')) : [];
                    if (cuentas.length == 0) {
                        localStorage.setItem('cuentas', JSON.stringify(newAccount));
                    } else {
                        let exists = false;
                        cuentas.forEach(cuenta => {
                            if (cuenta.user == newAccount[0].user) {
                                exists = true;
                                return;
                            }
                        });
                        if (!exists) {
                            cuentas.push(newAccount);
                            localStorage.setItem('cuentas', JSON.stringify(cuentas));
                            refreshAccountCards();
                        } else {
                            console.log('cuenta existe');
                        }
                    }
                }
            }
        });
    } else {
        alert('Campos vacíos');
    }
});

posicionConsolidada.addEventListener('click', () => {
    consultarDatosCuenta();
});

movimientos.addEventListener('click', () => {
    consultarMovimientos();
});
btnSalir.addEventListener('click', function () {
    cerrarSesión();
});

function refreshAccountCards() {
    $('#accountCards').html('');
    let cuentas = localStorage.getItem('cuentas') ? JSON.parse(localStorage.getItem('cuentas')) : [];
    cuentas.forEach(cuenta => {
        $('#accountCards').append(
            `
<div class="card" style="width: 18rem;">
  <img src="./logo.png" class="card-img-top bg-danger" alt="...">
  <div class="card-body text-center">
    <h5 class="card-title">${cuenta.user.toUpperCase()}</h5>
    <a id="savedAccountLogin" href="#" class="btn btn-primary">Iniciar Sesión</a>
  </div>
</div>
`,
        );
        $('#savedAccountLogin').on('click', function () {
            iniciarSesion(cuenta.user, cuenta.password, cuenta.huella, cuenta.nroCuenta).then(response => {
                if (response.descripcion == 'EXITO') {
                    $('.card-body').append(`
    <a id="savedAccountLogout" href="#" class="btn btn-danger">Cerrar Sesión</a>
`);
                    $('#savedAccountLogout').on('click', () => {
                        cerrarSesión().then(response => {
                            $('#savedAccountLogout').remove();
                        });
                    });
                }
            });
        });
    });
}

function iniciarSesion(user, password, huella, nroCuenta) {
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ type: 'iniciarSesion', user, password, huella }, function (response) {
            if (response.descripcion == 'EXITO') {
                console.log(atob(response.data.fechaNac));
                //consultarDatosCuenta();
                localStorage.setItem('currentActiveAccount', nroCuenta);
                consultarMovimientos(localStorage.getItem('currentActiveAccount'));
                toggleSession(true);
            }
            resolve(response);
        });
    });
}

function cerrarSesión() {
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ type: 'cerrarSesion' }, function (response) {
            console.log(response);
            if (response.data == 'Ok') {
                toggleSession(false);
            }
            resolve(response);
        });
    });
}

function consultarDatosCuenta() {
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ type: 'consultarDatosCuenta' }, function (response) {
            console.log(response);
            actualizarDatosCuenta(response);
            resolve(response);
        });
    });
}

function actualizarDatosCuenta(datosCuentas) {
    if (isSessionActive()) {
        tablaPoscionConsolidada.querySelector('tbody').innerHTML = '';
        datosCuentas.forEach(cuenta => {
            let row = document.createElement('tr');
            let cell = document.createElement('th');
            let cell2 = document.createElement('th');
            cell.innerText = cuenta.cuenta;
            cell2.innerText = cuenta.saldoDisponible;
            row.append(cell);
            row.append(cell2);
            tablaPoscionConsolidada.querySelector('tbody').append(row);
        });
    }
}
function consultarMovimientos() {
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ type: 'consultarMovimientos', cuenta: localStorage.getItem('currentActiveAccount') }, function (response) {
            actualizarMovimientos(response);
            resolve(response);
        });
    });
}

function actualizarMovimientos(datosMovimientos) {
    if (isSessionActive()) {
        let body = tablaMovimientos.querySelector('tbody');
        body.innerHTML = '';
        datosMovimientos.forEach(movimiento => {
            let row = document.createElement('tr');
            for (var key in movimiento) {
                if (key !== "saldo" && key !== "tipoMovimiento") {
                    let cell = document.createElement('th');
                    cell.innerText = movimiento[key];
                    if (key === "importe") {
                        cell.style.color = parseFloat(movimiento[key]) < 0 ? "red" : "green";
                    }
                    if (key === "referencia") {
                        cell.innerHTML = movimiento[key].substring(1, movimiento[key].length - 4) + `<span style="color:orange;">${movimiento[key].substring(movimiento[key].length - 4)}</span>`;
                    }
                    row.append(cell);
                }
            }
            body.append(row);
        });
    }
}

function hideSavedAccounts() {
    $('#accountCards').html('');
    $('#accountCards').hide();
}

function showSavedAccounts() {
    refreshAccountCards();
    $('#accountCards').show();
}

function hideControlDeOperaciones() {
    controlDeOperaciones.classList.add('fade');
}
function showControlDeOperaciones() {
    controlDeOperaciones.classList.remove('fade');
}
function hideOperaciones() {
    divOperaciones.classList.remove('d-block');
    divOperaciones.classList.add('d-none');
}
function showOperaciones() {
    divOperaciones.classList.remove('d-none');
    divOperaciones.classList.add('d-block');
}

function toggleSession(sessionExists) {
    if (sessionExists) {
        hideSavedAccounts();
        showControlDeOperaciones();
        showOperaciones();
    } else {
        showSavedAccounts();
        hideControlDeOperaciones();
        hideOperaciones();
    }
}

function isSessionActive() {
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ type: 'isSessionActive' }, active => {
            toggleSession(active);
            resolve(active);
        });
    });
}
refreshAccountCards();
isSessionActive();
consultarMovimientos();
