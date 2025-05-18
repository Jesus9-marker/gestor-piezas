// Cancelamos el modo edición
let idPiezaEnEdicion = null;
  
document.addEventListener('DOMContentLoaded', async () => {
  const supabaseUrl = 'https://mhomctwkdjfjzotjdnaa.supabase.co';
  const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ob21jdHdrZGpmanpvdGpkbmFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM0MTc5OTUsImV4cCI6MjA1ODk5Mzk5NX0.nDXOv9W-Pju-Lav_Leczvl84bXrDAZyaYf7bcgM16V0';
  const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseAnonKey); 

  await cargarPiezas(supabaseClient); 
  await cargarCategorías(supabaseClient); // Añade esta línea para cargar las categorías al inicio

  // Seleccionamos el formulario por su id
  const formularioPieza = document.getElementById('formularioPieza');

  botonCancelar.addEventListener('click', () => {
     // Limpiamos el formulario
      formularioPieza.reset();
    
    // Restauramos el aspecto del botón principal
      botonGuardar.textContent = "Guardar pieza";
      botonCancelar.style.display = "none";
  });

  // Capturamos el evento "submit" del formulario
  formularioPieza.addEventListener('submit', async (event) => {
    event.preventDefault(); // Evita que la página se recargue
    await guardarPiezas(supabaseClient);  // Llama a la función que guarda la pieza
    formularioPieza.reset(); // Limpia los campos del formulario
  });
});

async function cargarPiezas(supabase) { 
  const listadoPiezas = document.getElementById('listadoPiezas');
  
  const { data: piezas, error } = await supabase
    .from('tienda')
    .select('*');

  if (error) {
    listadoPiezas.innerHTML = '<p>Error al cargar piezas.</p>';
    console.error(error);
    return;
  }

  listadoPiezas.innerHTML = ''; // Limpiamos la vista anterior


  piezas.forEach(pieza => {
    
      // Creamos un contenedor div para la tarea
        const contenedor = document.createElement('div');
        
        const hNombre = document.createElement('h2');
        hNombre.textContent = pieza.nombre;
      

        const pDescripcion = document.createElement('p');
        pDescripcion.textContent = pieza.descripcion;

        const pFecha = document.createElement('p');
        pFecha.textContent = pieza.fecha;

        const pHora = document.createElement('p');
        pHora.textContent = pieza.hora;

        const pValoración = document.createElement('p');
        pValoración.textContent = pieza.valoración;

      // Creamos el botón para eliminar
        const botonEliminar = document.createElement('button');
        botonEliminar.textContent = 'Eliminar';

      // Al hacer clic, ejecutamos eliminarTarea
        botonEliminar.addEventListener('click', async () => {
          await eliminarPieza(pieza.id, supabase);

        });  
        // Botón para editar la tarea
        const botonEditar = document.createElement('button');
        botonEditar.textContent = 'Editar';
        botonEditar.addEventListener('click', () => {
      // Activamos el modo edición guardando el ID de la pieza
      idPiezaEnEdicion = pieza.id;

      // Rellenamos el formulario con los datos de la pieza
      formularioPieza.nombre.value = pieza.nombre;
      formularioPieza.descripcion.value = pieza.descripcion || '';
      formularioPieza.fecha.value = pieza.fecha || '';
      formularioPieza.hora.value = pieza.hora || '';
      formularioPieza.valoración.value = pieza.valoración || '';
      formularioPieza.completada.checked = pieza.completada || false;
      formularioPieza.categoria.value = pieza.categoria_id || ''; // Usa el UUID de la categoría de la tarea o cadena vacía si es null

      // Cambiamos los elementos visuales del formulario
      botonGuardar.textContent = "Guardar cambios";
      botonCancelar.style.display = "inline-block";
    });

    // Añadimos los elementos al contenedor y este al listado
      contenedor.appendChild(hNombre);
      contenedor.appendChild(pDescripcion);
      contenedor.appendChild(pFecha);
      contenedor.appendChild(pHora);
      contenedor.appendChild(pValoración);
      contenedor.appendChild(botonEditar);
      contenedor.appendChild(botonEliminar);
      listadoPiezas.appendChild(contenedor);
    }); 

  }

  // Función que recoge los datos y los guarda en Supabase
  async function guardarPiezas(supabase) {
      const nuevaPieza = {
        nombre: formularioPieza.nombre.value,
        descripcion: formularioPieza.descripcion.value,
        fecha: formularioPieza.fecha.value || null,
        hora: formularioPieza.hora.value || null,
        valoración: parseInt(formularioPieza.valoración.value),
        stock: formularioPieza.stock.checked,
        // Recogemos el valor seleccionado del select de categoría
        // Si el valor es la cadena vacía (""), guardamos null en la BD
        categoria_id: formularioPieza.categoria.value || null // Añade esta línea
      };

      let resultado;

    if (idPiezaEnEdicion) {
      // Estamos editando una pieza existente
      resultado = await supabase
        .from('tienda')
        .update(nuevaPieza)
        .eq('id', idPiezaEnEdicion);

      // Salimos del modo edición
      idPiezaEnEdicion = null;
    } else {
      // Estamos insertando una pieza nueva
      resultado = await supabase
        .from('tienda')
        .insert([nuevaPieza]);
    }

    console.error(nuevaPieza);
    console.error(resultado);

    if (resultado.error) {
      console.error('Error al guardar pieza:', resultado.error.message);
      return;
    }

    // Reiniciamos el formulario y el aspecto visual
      formularioPieza.reset();
      botonGuardar.textContent = "Guardar pieza";
      botonCancelar.style.display = "none"; 

    // Vuelve a mostrar los datos actualizados
      cargarPiezas(supabase);
  }

  async function eliminarPieza(id, supabase) {
    const { error } = await supabase
      .from('tienda')
      .delete()
      .eq('id', id); // Elimina la pieza cuyo ID coincida
  
    if (error) {
      console.error('Error al eliminar pieza:', error.message);
      return;
    }
    
    // Volvemos a cargar la lista para que desaparezca la pieza eliminada
    await cargarPiezas(supabase);
  }


  async function cargarCategorías(supabase) {
    const selectCategoria = document.getElementById('categoria');
    // Asumiendo que RLS está desactivado para desarrollo en la tabla 'categorias'
    const { data: categorias, error } = await supabase
      .from('categorías')
      .select('*'); // Obtenemos todas las categorías
  
    if (error) {
      console.error('Error al cargar categorías:', error.message);
      // Opcional: mostrar un mensaje de error al usuario
      return;
    }
  
    console.log('Categorías cargadas:', categorias);
  
    // Limpiamos las opciones existentes, excepto la primera (la de "Seleccione...")
    selectCategoria.innerHTML = '<option value="">-- Seleccione una categoría --</option>';
  
    // Añadimos las categorías obtenidas como opciones al select
    categorias.forEach(categoria => {
      const option = document.createElement('option');
      option.value = categoria.id; // El valor de la opción será el UUID de la categoría
      option.textContent = categoria.nombre; // El texto visible será el nombre de la categoría
      selectCategoria.appendChild(option);
    });
  }
  