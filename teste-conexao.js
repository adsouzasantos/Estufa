// Importamos o driver do Neon usando 'require' para compatibilidade com o terminal
const { neon } = require('@neondatabase/serverless');

// Sua URL de conexão (mantenha as aspas e o ponto e vírgula no final)
const DATABASE_URL = "postgresql://neondb_owner:npg_h2pUtNKF5qVI@ep-wispy-frog-apjzsjmm-pooler.c-7.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require";

// Criamos a instância de conexão
const sql = neon(DATABASE_URL);

async function inserirTeste() {
  try {
    console.log("⏳ Tentando conectar ao Neon...");
    
    /**
     * IMPORTANTE: Usamos a sintaxe de crase (Tagged Template) sem parênteses.
     * O driver do Neon processa automaticamente o que está dentro de ${} 
     * para evitar erros de sintaxe no SQL.
     */
    await sql`
      INSERT INTO historico_estufa (temperatura, setpoint, kp, ki, kd) 
      VALUES (${25.5}, ${30.0}, ${1.0}, ${0.5}, ${0.1})
    `;

    console.log("✅ Sucesso! O dado foi gravado no banco.");
  } catch (erro) {
    console.error("❌ Erro ao conectar:", erro.message);
  }
}

// Executa a função
inserirTeste();