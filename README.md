# Wave Physics

Laboratorio educativo en español para explorar propagación electromagnética, espectro, interacción con materiales y presupuestos de enlace.

## Modelo científico

- Constantes SI exactas para `c`, `h` y `e`.
- Relaciones `λ = c/f`, `E = hf`, expansión esférica y ecuación de Friis.
- Propiedades de materiales según los ajustes `ε′r = a·fGHz^b` y `σ = c·fGHz^d` de ITU‑R P.2040.
- Constante de propagación compleja en medios con pérdidas.
- Reflexión de Fresnel, refracción de Snell y atenuación de potencia `exp(−2αd)`.
- Suma incoherente de reflexiones internas para placas; las pilas de objetos combinan sus pérdidas de inserción.

El laboratorio separa deliberadamente la geometría real TX–RX de la animación visual comprimida. También muestra cuándo una frecuencia está fuera del rango de mediciones del material y cuándo la distancia incumple el criterio educativo de campo lejano `d ≥ 10λ`.

## Áreas

1. **Laboratorio:** frecuencia continua, distancia, potencia, ángulo, polarización y hasta cuatro capas.
2. **Espectro:** atlas logarítmico desde 3 Hz hasta 30 ZHz, relaciones fundamentales y referencias cotidianas.
3. **Materiales:** catálogo ITU, balance R/T/A, profundidad de penetración y curvas de pérdida.
4. **Enlace:** potencia recibida frente a distancia y presupuesto completo en dB.
5. **Comparador:** dos tecnologías bajo exactamente el mismo escenario.

## Alcance y límites

Es un modelo determinista educativo, no un solver FDTD ni un sustituto de mediciones. Los objetos se consideran placas homogéneas, planas y de caras paralelas. No se inventan parámetros para humedad, armaduras, rugosidad, juntas, geometría de antena o multitrayecto. La absorción atmosférica específica —por ejemplo, alrededor de 60 GHz— requiere ITU‑R P.676 y no se incluye en el presupuesto básico.

## Desarrollo

```bash
npm install
npm run dev
npm test
npm run lint
npm run build
```

## Referencias primarias

- ITU‑R P.2040: efectos de materiales y estructuras sobre la propagación radioeléctrica.
- ITU‑R P.676: atenuación por gases atmosféricos.
- NIST: constantes fundamentales y espectro electromagnético.
