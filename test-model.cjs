
const { GoogleGenerativeAI } = require('@google/generative-ai');

const API_KEY = 'AIzaSyD9aIcT6EuLyQM-Mm68-XlG1qJxuleEeeA';

async function listModels() {
  try {
    const genAI = new GoogleGenerativeAI(API_KEY);
    
    const modelsToTry = [
      'gemini-1.5-flash-8b',
      'gemini-exp-1206',
      'gemini-2.0-flash-thinking-exp-1219',
      'gemini-2.0-flash-thinking-exp',
      'models/gemini-1.5-flash',
      'models/gemini-1.5-pro',
      'models/gemini-pro'
    ];
    
    console.log('🔍 Testando novos modelos...\n');
    
    for (const modelName of modelsToTry) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent('Oi');
        const response = await result.response;
        const text = response.text();
        console.log('✅ ' + modelName + ' - FUNCIONA!');
        console.log('   Resposta: ' + text.substring(0, 50) + '...\n');
        break; // Para no primeiro que funcionar
      } catch (error) {
        const errorMsg = error.message.includes('quota') ? 'QUOTA EXCEDIDA' : 
                        error.message.includes('404') ? 'NÃO ENCONTRADO' :
                        error.message.includes('API_KEY') ? 'API KEY INVÁLIDA' : 'ERRO';
        console.log('❌ ' + modelName + ' - ' + errorMsg);
      }
    }
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

listModels();