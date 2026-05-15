import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  // Verifica se o método é POST (envio de dados)
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const sql = neon(process.env.DATABASE_URL);
  const { temperatura, setpoint, kp, ki, kd } = req.body;

  try {
    // Insere os dados na tabela que você criou
    await sql(`
      INSERT INTO historico_estufa (temperatura, setpoint, kp, ki, kd)
      VALUES ($1, $2, $3, $4, $5)
    `, [temperatura, setpoint, kp, ki, kd]);

    return res.status(200).json({ message: 'Dados salvos com sucesso!' });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao salvar no banco: ' + error.message });
  }
}