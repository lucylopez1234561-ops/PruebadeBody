# TODO - Cambios en Método de Pago

## ✅ Completado
- [x] Cambiar método de pago "Tarjeta" por "Depósito"
- [x] Agregar opciones de banco: Pichincha e Interbancario
- [x] Mostrar monto que debe enviar el usuario
- [x] Agregar funcionalidad para subir comprobante como imagen
- [x] Actualizar lógica de procesamiento de pago para incluir banco seleccionado

## 📋 Detalles de Cambios Realizados

### Archivo: `app/checkout/page.tsx`
- **Botón de método de pago**: Cambiado de "Tarjeta" a "Depósito" con ícono DollarSign
- **Formulario de depósito**: Reemplazado formulario de tarjeta con:
  - Selector de banco (Pichincha/Interbancario)
  - Información del monto a depositar con formato destacado
  - Campo de subida de comprobante con preview de imagen
- **Lógica de pago**: Actualizada para incluir banco seleccionado en el método de pago

## 🧪 Verificación
- [ ] Probar selección de método "Depósito"
- [ ] Verificar selector de banco funciona correctamente
- [ ] Confirmar que el monto se muestra correctamente
- [ ] Probar subida de imagen de comprobante
- [ ] Verificar que la imagen se previsualiza correctamente
- [ ] Confirmar que el pedido se procesa con el método de pago correcto

## 🔄 Próximos Pasos
- Ejecutar la aplicación y probar el flujo de checkout
- Verificar que no hay errores en consola
- Confirmar que el webhook recibe la información correcta del pedido
