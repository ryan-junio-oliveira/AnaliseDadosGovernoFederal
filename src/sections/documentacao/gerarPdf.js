// Gera e baixa o PDF do relatório no cliente, sem usar Ctrl+P.
export async function gerarPdf() {
  const [{ pdf }, { default: RelatorioPdf }, React] = await Promise.all([
    import("@react-pdf/renderer"),
    import("./RelatorioPdf.jsx"),
    import("react"),
  ]);
  const blob = await pdf(React.createElement(RelatorioPdf)).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "relatorio-atividade-pratica-1-engenharia-dados.pdf";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
