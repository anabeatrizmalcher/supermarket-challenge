import { Component, type ReactNode } from 'react';

/** Last line of defence: a friendly screen instead of a white page. Progress is saved on the device. */
export default class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
        <div className="text-6xl">😵</div>
        <h1 className="text-2xl font-bold">Ops! Algo deu errado.</h1>
        <p className="text-slate-600">Seu progresso está salvo. Toque no botão para continuar.</p>
        <button onClick={() => location.reload()} className="rounded-xl bg-indigo-600 px-6 py-4 text-lg font-bold text-white">
          🔄 Recarregar o jogo
        </button>
        <p className="max-w-xs break-words text-xs text-slate-400">{this.state.error.message}</p>
      </div>
    );
  }
}
