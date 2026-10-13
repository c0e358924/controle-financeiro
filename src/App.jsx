// src/App.jsx
import { useState, useEffect } from 'react';
import { collection, addDoc, query, where, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { db } from './firebase'; 
import './index.css';

export default function App() {
  const [role, setRole] = useState(null);
  const [senha, setSenha] = useState('');
  
  const [textoInput, setTextoInput] = useState('');
  const [dataAtual, setDataAtual] = useState(new Date()); 
  const [gastos, setGastos] = useState([]);

  const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  
  const mesAtualNum = dataAtual.getMonth();
  const anoAtualNum = dataAtual.getFullYear();

  const handleLogin = (e) => {
    e.preventDefault();
    if (senha === 'admin123') setRole('admin');
    else if (senha === 'visita') setRole('visitante');
    else alert('Senha incorreta!');
  };

  useEffect(() => {
    if (!role) return;

    const q = query(
      collection(db, "gastos"),
      where("mes", "==", mesAtualNum),
      where("ano", "==", anoAtualNum)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const gastosFirebase = [];
      querySnapshot.forEach((documento) => {
        gastosFirebase.push({ id: documento.id, ...documento.data() });
      });
      
      gastosFirebase.sort((a, b) => (a.criadoEm?.seconds || 0) - (b.criadoEm?.seconds || 0));
      setGastos(gastosFirebase);
    });

    return () => unsubscribe();
  }, [mesAtualNum, anoAtualNum, role]);

  const processarTexto = (texto) => {
    const regexParcela = /(.*?)\s+(\d+)\s+(?:de|\/)\s+(\d+)\s+(?:R\$?\s*)?([\d,.]+)/i;
    const matchParcela = texto.match(regexParcela);

    if (matchParcela) {
      const descricao = matchParcela[1].trim();
      const parcelaInicial = parseInt(matchParcela[2]);
      const totalParcelas = parseInt(matchParcela[3]);
      const valor = parseFloat(matchParcela[4].replace(',', '.'));

      let novasParcelas = [];
      for (let i = 0; i <= totalParcelas - parcelaInicial; i++) {
        let dataGasto = new Date(anoAtualNum, mesAtualNum + i, 1);
        novasParcelas.push({
          descricao: descricao,
          valor: valor,
          parcela: `${parcelaInicial + i}/${totalParcelas}`,
          mes: dataGasto.getMonth(),
          ano: dataGasto.getFullYear(),
          criadoEm: new Date()
        });
      }
      return novasParcelas;
    }

    const regexNormal = /(.*?)\s+(?:R\$?\s*)?([\d,.]+)$/i;
    const matchNormal = texto.match(regexNormal);

    if (matchNormal) {
      return [{
        descricao: matchNormal[1].trim(),
        valor: parseFloat(matchNormal[2].replace(',', '.')),
        parcela: null,
        mes: mesAtualNum,
        ano: anoAtualNum,
        criadoEm: new Date()
      }];
    }
    return null; 
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!textoInput.trim() || role !== 'admin') return;

    const novosGastos = processarTexto(textoInput);

    if (novosGastos) {
      try {
        for (const gasto of novosGastos) {
          await addDoc(collection(db, "gastos"), gasto);
        }
        setTextoInput(''); // Só limpa o texto se o Firebase confirmar o salvamento
      } catch (erro) {
        alert("Erro ao enviar para o Firebase: " + erro.message);
      }
    } else {
      alert('Formato não reconhecido! Use: "nome valor" ou "nome 1 de 3 valor"');
    }
  };

  // Função de apagar gasto da nuvem
  const deletarGasto = async (id) => {
    if (role !== 'admin') return;
    const confirmacao = window.confirm("Deseja realmente apagar este gasto?");
    if (confirmacao) {
      await deleteDoc(doc(db, "gastos", id));
    }
  };

  const mudarMes = (direcao) => {
    setDataAtual(new Date(anoAtualNum, mesAtualNum + direcao, 1));
  };

  const ganhos = 1600.00;
  const totalGastos = gastos.reduce((acc, curr) => acc + curr.valor, 0);
  const saldo = ganhos - totalGastos;

  if (!role) {
    return (
      <div className="app-container" style={{ justifyContent: 'center', padding: '40px 20px' }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ color: '#f8fafc', marginBottom: '10px', fontSize: '1.5rem', textTransform: 'uppercase', letterSpacing: '2px' }}>Acesso</h1>
          <p style={{ color: '#64748b', marginBottom: '30px' }}>Controle Financeiro</p>
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <input 
              type="password" 
              placeholder="Digite a senha..." 
              value={senha} 
              onChange={(e) => setSenha(e.target.value)} 
              style={{ padding: '16px', borderRadius: '30px', border: '1px solid #334155', background: '#1e293b', color: '#fff', textAlign: 'center', fontSize: '1rem', outline: 'none' }} 
            />
            <button type="submit" style={{ padding: '16px', borderRadius: '30px', border: 'none', background: '#3b82f6', color: '#fff', fontSize: '1.1rem', cursor: 'pointer', fontWeight: 'bold' }}>Entrar</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <header className="header">
        <div className="mes-selector">
          <button onClick={() => mudarMes(-1)}>‹</button>
          <h1>{meses[mesAtualNum]} {anoAtualNum}</h1>
          <button onClick={() => mudarMes(1)}>›</button>
        </div>
        <h2 className="saldo" style={{ color: saldo < 0 ? '#ef4444' : '#f8fafc' }}>
          R$ {saldo.toFixed(2).replace('.', ',')}
        </h2>
        <p className="subtexto">
          Restante de R$ {ganhos.toFixed(2).replace('.', ',')}
        </p>
      </header>

      <main className="gastos-list">
        {gastos.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#64748b', marginTop: '20px' }}>
            Nenhum gasto neste mês.
          </p>
        ) : (
          gastos.map(g => (
            <div key={g.id} className="gasto-item">
              <div>
                <span className="descricao">{g.descricao}</span>
                {g.parcela && <span className="parcela">{g.parcela}</span>}
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className="valor">R$ {g.valor.toFixed(2).replace('.', ',')}</span>
                {role === 'admin' && (
                  <button 
                    onClick={() => deletarGasto(g.id)}
                    style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '1.5rem', cursor: 'pointer', padding: '0 5px' }}
                    title="Apagar gasto"
                  >
                    ×
                  </button>
                )}
              </div>

            </div>
          ))
        )}
      </main>

      {role === 'admin' && (
        <form className="input-form" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder='Ex: mercado 52,50 ou tênis 1 de 3 150'
            value={textoInput}
            onChange={(e) => setTextoInput(e.target.value)}
          />
          <button type="submit">↑</button>
        </form>
      )}
    </div>
  );
}