# Pedidos Almacen Externo

Aplicación para seleccionar, unir y configurar la información para la generación del pedido al almacén externo.

Link de acceso a la aplicación [Pedidos Externo](https://perseo1326.github.io/IK-Pedido_Externo/pedidosExterno.html)

## Version 3.5

* Reparado error al copiar el contenido a Excel, donde no se mostraban los valores manuales escritos por el usuario.
* Actualización para el manejo de órdenes previas.
  - Adiciona la cantidad del pedido previo al contenido de la columna "camiones".
  - Reduce el stock disponible en el almacén externo en la cantidad pedida.
  - Suma la cantidad pedida de pallets a la cantidad de pallets en SGF y por consiguiente aumentan los valores de "Stock disponible en tienda" "EOQ %" y "Semanas de Stock".

## Version 3.4

* Agregada caracteristica en el menú de configuración para permitir colocar un texto que evitará que un artículo en cuyas observaciones especiales tenga ese mismo texto sea excluido de la reducción de la tabla de datos.
* Agregado el cálculo de la "Prioridad" en la tabla de datos completa.
* Reparado problema con la validación numérica en la tabla de datos al usuario escribir un dato.
* Reparado bug que al reducir el número de filas no mostraba la cantidades manuales en la tabla de datos.
* Agregada mejora visual para cambiar el fondo del color de la tabla de datos al aplicar la reducción de filas.

## Version 3.3

* Agregados botones para abrir un menu que permite modificar manualmente los parámetros con los cuales se realiza la reducción de datos de la tabla general y la asignación de las prioridades.

## Version 3.2

* Agregada caracteristica en el listado completo para permitir al usuario indicar cantidades a pedir manualmente.
* Agregada la columna "Tipo" para señalar si un articulo tiene oferta "O", esta en una cabecera "C", en una zona "Z" o es un pedido manual "M".
* Adicionados botones de enlace a cada uno de los reportes para una fácil ubicación y descarga.

## Version 3.1

* Adición de la columna "Prioridad" para facilitar y estandarizar los pasos para la ejecución del pedido.

## Version 3.0

* Definición de nuevos requerimietos y fórmulas de cálculo junto a mejoras visuales y de presentación de la información.
* Implementación de fórmulas para la reducción e filas del modelo de datos inicial.

## Version 2.1

* Modificados valores de configuración para la carga de pedidos previos, para facilitar su validación.

## Version 2

* Modificada la estructura y mejora en el diseño de la página para un mejor rendimiento.
* Mejorada la formula para calcular el valor de semanas de stock.
* Mejora para la validación de valores cuando se carga un pedido previo, descontando los valores del stock disponible en el almacén externo.
* Modificación en la configuración y validación para evitar fallos al cargar un pedido previo.

## Version 1.2

* Agregado botón para cargar la información de un pedido anterior e incluirlo en la información de la tabla.

## Version 1.1

* Agregado botón para cargar la información de las reservas.
