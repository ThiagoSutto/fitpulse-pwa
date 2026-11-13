# FitPulse Pro — Nutrição, Treino PPL & Bioimpedância (PWA)

Aplicativo web mobile-first (Progressive Web App) desenvolvido em **React 19, TypeScript, Tailwind CSS v4 e Lucide Icons**, arquitetado com padrão **Local-First** e suporte pronto para sincronização com **Supabase** e backend em **Python / FastAPI**.

---

## 🚀 Funcionalidades Principais

1. **Perfil Base & Linha de Base**
   - Dados de composição corporal pré-carregados (89,50 kg, 25,9% BF, 50,8% água, 62,89 kg de massa muscular e 1898 kcal BMR).
   - Meta proteica diária entre 160g e 180g.
   - Modo Observador (1º Mês) focado em mapeamento sem alertas punitivos.

2. **Nutrição & Banco Híbrido de Alimentos**
   - Integração com a API do **Open Food Facts** e base local da **Tabela TACO (UNICAMP)**.
   - Cálculo automático e proporcional por gramas.
   - Abatimento em tempo real do orçamento diário de macros (Proteína, Carbo, Gordura e Calorias).
   - Botões 1-Click para alimentos-base e divisão em 4 janelas da rotina (09h00, 12h30, 16h30 e 19h30).
   - Contadores rápidos de água (+250ml / +500ml) e passos diários.

3. **Treino Push / Pull / Legs (5 Dias) + Core Diário Fixo**
   - **Regra Global Diária:** Todos os treinos incluem 2 séries de Abdominal Infra e 2 séries de Abdominal na Máquina.
   - **Push A (Seg):** Supino inclinado (4x), Supino reto máquina (3x), Desenvolvimento halter (3x), Elevação lateral máquina (3x), Tríceps corda (3x), Tríceps pulley para frente (3x).
   - **Pull A (Ter):** Puxada alta máquina (4x), Remada baixa máquina (3x), Pull down (3x), Peck deck inverso (3x), Bíceps halter (3x), Bíceps máquina (3x).
   - **Legs (Qua):** Cadeira extensora, Leg Press 45°, Mesa flexora e Panturrilha.
   - **Push B (Qui):** Base do Push A com Crucifixo inclinado (3x) no lugar do supino reto máquina.
   - **Pull B (Sáb):** Idêntico ao Pull A.

4. **Automação de Check-in Zepp Life (Gemini Vision OCR)**
   - Upload drag-and-drop de capturas de tela do aplicativo Zepp Life.
   - Extração estruturada via **Google Gemini Vision API (`gemini-3.8-flash`)** com JSON Schema das 9 métricas corporais.
   - Gráficos de linha responsivos com histórico das avaliações reais (20/Ago, 28/Ago e 17/Set/2026).

5. **Cardio Automatizado com Strava (OAuth2)**
   - Integração com a API v3 do Strava para corridas na esteira e no parque.
   - Cálculo automático do gasto calórico ativo (Active Calories), ritmo (pace em min/km) e distância.

6. **Gerador de Relatório para o Gemini**
   - Compilação instantânea dos dados do dia, médias de macros, BMR, cargas máximas PPL e bioimpedância em Markdown formatado no clipboard.

---

## 🛠️ Tecnologias Utilizadas

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4, Lucide React.
- **PWA:** Service Worker para funcionamento offline e suporte a instalação em tela cheia.
- **Backend Opcional:** Python 3.10+, FastAPI, Pydantic v2, Uvicorn.
- **Cloud/Banco:** LocalStorage Local-First, compatível com Supabase (PostgreSQL + RLS).

---

## 💻 Como Rodar o Projeto

### 1. Clonar o repositório
\`\`\`bash
git clone https://github.com/thiagosutto/fitpulse-pwa.git
cd fitpulse-pwa
\`\`\`

### 2. Instalar dependências e iniciar o PWA
\`\`\`bash
npm install
npm run dev
\`\`\`

### 3. (Opcional) Executar o backend FastAPI
\`\`\`bash
pip install fastapi uvicorn pydantic
uvicorn backend_fastapi_app:app --reload --port 8000
\`\`\`
