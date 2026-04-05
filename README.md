# FisioHome — Gestão de Consultas ao Domicílio

App web para fisioterapeutas gerirem consultas, pacientes e pagamentos.

---

## Como usar agora (modo demo)

1. Abre o ficheiro `index.html` num browser
2. Clica em **"Entrar como demo"**
3. Explora a app com dados de exemplo

---

## Como ligar ao Firebase (produção)

### 1. Criar projeto Firebase

1. Vai a [firebase.google.com](https://firebase.google.com)
2. Clica em "Add project" → dá um nome (ex: `fisio-home`)
3. Desativa Google Analytics (opcional)

### 2. Ativar Firestore

- No menu lateral: **Build → Firestore Database**
- Clica "Create database"
- Escolhe região: **eur3 (europe-west)** (RGPD)
- Começa em modo **test** por agora

### 3. Ativar Authentication

- **Build → Authentication → Get started**
- Ativa: **Email/Password**
- Vai a **Users → Add user** → cria o login do teu irmão

### 4. Obter configuração

- **Project Settings (⚙️) → General → Your apps → Web app**
- Clica `</>` para adicionar app web
- Copia o objeto `firebaseConfig`

### 5. Colar na app

Abre `index.html`, encontra este bloco e substitui:

```javascript
const FIREBASE_CONFIG = {
  apiKey: "SEU_API_KEY_AQUI",
  authDomain: "SEU_PROJETO.firebaseapp.com",
  projectId: "SEU_PROJETO_ID",
  storageBucket: "SEU_PROJETO.appspot.com",
  messagingSenderId: "SEU_ID",
  appId: "SEU_APP_ID"
};
```

---

## Publicar no GitHub Pages (grátis)

1. Cria conta em [github.com](https://github.com)
2. Cria repositório novo (ex: `fisio-app`)
3. Faz upload dos 2 ficheiros: `index.html` e `manifest.json`
4. **Settings → Pages → Source: main branch → Save**
5. A app fica em: `https://teu-username.github.io/fisio-app`

---

## Funcionalidades incluídas

- ✅ Login com Firebase Auth (ou demo local)
- ✅ Dashboard com estatísticas (hoje, semana, pendentes, faturado)
- ✅ Calendário mensal com consultas por dia
- ✅ Gestão de pacientes (ficha clínica, histórico, filtro)
- ✅ Gestão de consultas (criar, editar, estados)
- ✅ Controlo de pagamentos (dinheiro, MB Way, Multibanco)
- ✅ Design responsivo (mobile + desktop)
- ✅ PWA — instalar no telemóvel como app nativa

## Próximos passos (Fase 2)

- [ ] Portal do paciente (link único por paciente)
- [ ] Notificações por email (Firebase Cloud Functions)
- [ ] Lembretes 24h antes da consulta
- [ ] Relatórios PDF mensais
- [ ] Referências Multibanco automáticas (IFTHENPAY)

---

## RGPD

Os dados de saúde são sensíveis. Certifica-te de:
- Usar a região EU no Firestore (eur3)
- Criar regras de segurança no Firestore (só o médico acede)
- Obter consentimento explícito dos pacientes

### Regras Firestore recomendadas:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```
