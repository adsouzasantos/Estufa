import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Método não permitido' });
    }

    const sql = neon(process.env.DATABASE_URL);

    try {
        // Buscamos os últimos 100 registros em ordem decrescente de tempo
        const dados = await sql`
            SELECT * FROM historico_estufa 
            ORDER BY data_hora DESC 
            LIMIT 100
        `;
        return res.status(200).json(dados);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}