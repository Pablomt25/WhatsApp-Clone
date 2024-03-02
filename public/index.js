const socket = io();

let usuarioActual;
let salaGeneral = 'sala:general';

function autenticarUsuario() {
  const nombre = document.getElementById('nombre').value;
  const estado = document.getElementById('estado').value;
  const avatarOptions = document.getElementsByName('avatar');
  let avatarId;

  for (const option of avatarOptions) {
    if (option.checked) {
      avatarId = option.value;
      break;
    }
  }

  if (avatarId === 'custom') {
    const customAvatarInput = document.getElementById('custom-avatar-input');
    const customAvatarFile = customAvatarInput.files[0];

    if (customAvatarFile) {
      console.log('Imagen personalizada seleccionada:', customAvatarFile);

      cargarImagenPersonalizada(customAvatarFile, nombre, estado);
    } else {
      alert('Selecciona una imagen para tu avatar personalizado.');
      return false;
    }
  } else {
    usuarioActual = {
      nombre,
      estado,
      avatarId,
    };

    autenticarUsuarioCompleta();
  }

  return false;
}

function cargarImagenPropia() {
  const customAvatarInput = document.getElementById('custom-avatar-input');
  customAvatarInput.style.display = 'block';

  customAvatarInput.addEventListener('change', function () {
    const customAvatarFile = customAvatarInput.files[0];

    if (customAvatarFile) {
      console.log('Imagen personalizada seleccionada:', customAvatarFile);

    } else {
      alert('Selecciona una imagen para tu avatar personalizado.');
    }
  });
}

function cargarImagenPersonalizada(archivo, nombre, estado) {
  const formData = new FormData();
  formData.append('avatar', archivo);

  fetch('/guardar-avatar', {
    method: 'POST',
    body: formData,
  })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        usuarioActual = {
          nombre,
          estado,
          avatarId: 'custom',
          avatar: data.avatarPath,
        };

        actualizarAvatarEnInterfaz(data.avatarPath);

        autenticarUsuarioCompleta();
      } else {
        alert('Error al guardar el avatar.');
      }
    })
    .catch(error => {
      console.error('Error al enviar la imagen al servidor:', error);
    });
}
function actualizarAvatarEnInterfaz(avatarPath) {
  const avatarElement = document.getElementById('avatar-element');
  avatarElement.src = avatarPath;
}


function autenticarUsuarioCompleta() {
  socket.emit('authenticate', usuarioActual);

  document.getElementById('auth-container').style.display = 'none';
  document.getElementById('chat-container').style.display = 'block';

  // Unirse a la sala general
  socket.emit('join', salaGeneral);

  // Manejar eventos de escritura
  const cajaTexto = document.getElementById('cajaTexto');
  cajaTexto.addEventListener('input', () => {
    if (cajaTexto.value.trim() !== '') {
      socket.emit('escribiendo', { nombre: usuarioActual.nombre });
    } else {
      socket.emit('dejarDeEscribir', { nombre: usuarioActual.nombre });
    }
  });
}

function mostrarFormularioRegistro() {
  document.getElementById('auth-container').style.display = 'block';
  document.getElementById('chat-container').style.display = 'none';
  document.getElementById('private-chat-container').style.display = 'none';
  document.getElementById('file-upload-container').style.display = 'none';
}

function enviar() {
  const cajaTexto = document.getElementById('cajaTexto');
  const mensaje = cajaTexto.value;
  socket.emit('chat message', { tipo: 'texto', contenido: mensaje, remitente: usuarioActual, sala: salaGeneral });
  mostrarMensaje('mensaje-usuario', mensaje);
  cajaTexto.value = '';
}



function emoticono1() {
  const imagenEmoticono = document.createElement('img');

  imagenEmoticono.src = './images/emoticono1.jpeg';

  imagenEmoticono.width = 20;

  agregarMensaje(imagenEmoticono);
}

function emoticono2() {
  const imagenEmoticono = document.createElement('img');

  imagenEmoticono.src = './images/emoticono1.jpeg';

  imagenEmoticono.width = 20;

  agregarMensaje(imagenEmoticono);
}

function agregarMensaje(contenido) {
  const chatDiv = document.getElementById('chat');
  const nuevoMensaje = document.createElement('div');
  nuevoMensaje.classList.add('mensaje-usuario');
  nuevoMensaje.appendChild(contenido);
  chatDiv.appendChild(nuevoMensaje);
}

function iniciarChatPrivado(destinatario) {
  document.getElementById('private-chat-container').style.display = 'block';
  document.getElementById('chat').style.display = 'none';
  document.getElementById('file-upload-container').style.display = 'none';
  document.getElementById('private-recipient').innerText = destinatario;

  const salaPrivada = `sala:${usuarioActual.nombre}-${destinatario}`;
  socket.emit('join', salaPrivada);

  socket.on(salaPrivada, (msg) => {
    if (msg.sala === salaPrivada) {
      mostrarMensaje('mensaje-otros', `[${msg.remitente.nombre}] ${msg.contenido}`);
    }
  });
}

function enviarPrivado() {
  const destinatario = document.getElementById('private-recipient').innerText;
  const mensaje = document.getElementById('private-cajaTexto').value;

  const salaPrivada = `sala:${usuarioActual.nombre}-${destinatario}`;
  socket.emit('chat message', { contenido: mensaje, remitente: usuarioActual, sala: salaPrivada });
  mostrarMensaje('mensaje-otros', mensaje);
  document.getElementById('private-cajaTexto').value = '';
}

function mostrarMensaje(clase, contenido) {
  const mensajesDiv = document.getElementById('chat');
  const nuevoMensaje = document.createElement('div');
  nuevoMensaje.classList.add('mensaje', clase);

  if (typeof contenido === 'string') {
    nuevoMensaje.textContent = contenido;
  } else {
    nuevoMensaje.appendChild(contenido);
  }

  mensajesDiv.appendChild(nuevoMensaje);
}

socket.on('entradaUsuario', (msg) => {
  const usuariosDiv = document.getElementById('user-list');
  usuariosDiv.innerHTML = msg;
});

socket.on('mensaje', (msg) => {
  if (msg.tipo === 'imagen') {
    mostrarImagen('mensaje-otros', msg.contenido);
  } else if (msg.tipo === 'info') {
    mostrarMensaje('mensaje-info', msg.contenido);
  } else {
    mostrarMensaje('mensaje-otros', `[${msg.remitente.nombre}] ${msg.contenido}`);
  }
});





function mostrarImagen(clase, url) {
  const mensajesDiv = document.getElementById('chat');
  const nuevoMensaje = document.createElement('div');
  nuevoMensaje.classList.add('mensaje', clase);

  const imagen = document.createElement('img');
  imagen.src = url;
  nuevoMensaje.appendChild(imagen);

  mensajesDiv.appendChild(nuevoMensaje);
}

function subirArchivo() {
  const archivoInput = document.getElementById('archivoInput');
  const archivo = archivoInput.files[0];

  if (archivo) {
    const reader = new FileReader();

    reader.onload = (e) => {
      const contenido = e.target.result;
      socket.emit('chat message', { tipo: 'archivo', contenido, nombre: archivo.name, remitente: usuarioActual, sala: salaGeneral });
      mostrarMensaje('mensaje-usuario', `[Archivo] ${archivo.name}`);
    };

    reader.readAsDataURL(archivo);
  }
}

function iniciarConversacionPrivada() {
  document.getElementById('private-chat-container').style.display = 'block';
  document.getElementById('chat').style.display = 'none';
  document.getElementById('file-upload-container').style.display = 'none';
}

function volverAChatGeneral() {
  document.getElementById('private-chat-container').style.display = 'none';
  document.getElementById('chat').style.display = 'block';
  document.getElementById('file-upload-container').style.display = 'block';
}


function iniciarConversacionPrivada(event) {
  const destinatario = event.target.innerText.trim();

  if (destinatario && destinatario !== usuarioActual.nombre) {
    iniciarChatPrivado(destinatario);
  }
}
