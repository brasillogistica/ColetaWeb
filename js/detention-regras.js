// Fonte: DETENTION.xlsx, Planilha1, colunas A–E, linhas 3–19 (23/11/2026).
// FT = dias corridos desde GATE OUT; tarifa = valor por dia após o FT.
// A coluna F (FT -30%) não é aplicada: depende de condição não especificada.
// Valores monetários mantêm o símbolo "$" da planilha original.
window.DETENTION_REGRAS = Object.freeze([
  {armador:'PIL',ft:30,diaria:100,termino:'GATE IN'},
  {armador:'HAPAG LLOYD',ft:30,diaria:297,termino:'GATE IN'},
  {armador:'ONE',ft:30,diaria:100,termino:'GATE IN'},
  {armador:'ALPHA SHIPPING',ft:30,diaria:100,termino:'GATE IN'},
  {armador:'CMA CGM',ft:25,diaria:175,termino:'GATE IN'},
  {armador:'YANG MING',ft:35,diaria:100,termino:'GATE IN'},
  {armador:'HMM',ft:42,diaria:100,termino:'GATE IN'},
  {armador:'MAERSK',ft:24,diaria:160,termino:'GATE IN'},
  {armador:'MSC',ft:30,diaria:130,termino:'GATE IN'},
  {armador:'COSCO',ft:17,diaria:250,termino:'GATE IN'},
  {armador:'EVERGREEN',ft:35,diaria:80,termino:'GATE IN'},
  {armador:'ZIM',ft:30,diaria:141,termino:'GATE IN'},
  {armador:'INTERTRANS - COSCO',ft:21,diaria:250,termino:'GATE IN'},
  {armador:'INTERTRANS - CMA CGM',ft:21,diaria:335,termino:'GATE IN'},
  {armador:'INTERTRANS - HMM',ft:21,diaria:360,termino:'GATE IN'},
  {armador:'INTERTRANS - YANG MING',ft:21,diaria:300,termino:'GATE IN'},
  {armador:'BR-X CARGO',ft:14,diaria:353,termino:'ON BOARD'}
]);
